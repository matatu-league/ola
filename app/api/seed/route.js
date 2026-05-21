import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store, { StoreCategory, StoreCollection } from '@/models/Store';
import { Category, Collection, Product, ProductReview } from '@/models/Marketplace';

// Import local data
import {
  topDeals,
  tailoredSelections,
  productGrid,
  newArrivals,
  marketplaceCategories,
  stores,
} from '../../data/mockData';

export async function POST(req) {
  console.log('🚀 --- STARTING DATABASE SEED PROCESS --- 🚀');

  try {
    console.log('1️⃣ Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected successfully.');

    console.log('2️⃣ Wiping existing collections...');
    await Category.deleteMany({});
    await Store.deleteMany({});
    await StoreCategory.deleteMany({});
    await StoreCollection.deleteMany({});
    await Collection.deleteMany({});
    await Product.deleteMany({});
    await ProductReview.deleteMany({});
    console.log('✅ Old data wiped.');

    console.log('3️⃣ Seeding Marketplace Categories & Subcategories...');
    const categoryMap = {}; // name → _id

    for (const parentCat of marketplaceCategories) {
      // Create the parent — Category model requires: name, slug (unique), optional image/description
      // parentId defaults to null for top-level entries
      const createdParent = await Category.create({
        name:        parentCat.name,
        slug:        parentCat.slug,
        image:       parentCat.image,
        description: parentCat.description,
        parentId:    null,
      });

      categoryMap[createdParent.name] = createdParent._id;

      if (parentCat.subCategories?.length) {
        const subCategoryDocs = parentCat.subCategories.map((sub) => ({
          name:     sub.name,
          slug:     sub.slug,
          parentId: createdParent._id, // ← correct field name per Category model
        }));

        const createdChildren = await Category.insertMany(subCategoryDocs);

        createdChildren.forEach((child) => {
          categoryMap[child.name] = child._id;
        });
      }
    }

    console.log(
      `✅ Categories seeded. Indexed ${Object.keys(categoryMap).length} total categories & subcategories.`,
    );

    console.log('4️⃣ Preparing Store data with Category references...');
    const storesToInsert = stores.map((store) => {
      // Store.categories → [ObjectId] refs to Category
      const mappedCategoryIds =
        store.categories
          ?.map((catName) => categoryMap[catName])
          .filter(Boolean) ?? [];

      // Strip any product-level fields that don't belong on the Store schema
      // (products are a separate Product collection, not embedded on Store)
      const { products: _products, ...storeFields } = store;

      return {
        ...storeFields,
        categories: mappedCategoryIds,
      };
    });

    console.log('5️⃣ Inserting Stores into DB...');
    const insertedStores = await Store.insertMany(storesToInsert);
    console.log(`✅ Successfully inserted ${insertedStores.length} Stores.`);

    // ── Seed standalone Products (linked to stores + categories) ──────────────
    if (productGrid?.length) {
      console.log('6️⃣ Seeding Products...');
      const productsToInsert = productGrid.map((prod) => ({
        ...prod,
        categoryId: prod.categoryName ? categoryMap[prod.categoryName] ?? null : null,
      }));
      await Product.insertMany(productsToInsert);
      console.log(`✅ Inserted ${productsToInsert.length} Products.`);
    }

    // ── Seed top-level marketplace Collections (if any) ───────────────────────
    if (topDeals?.length || tailoredSelections?.length || newArrivals?.length) {
      console.log('7️⃣ Seeding Marketplace Collections (deals, arrivals, etc.)...');

      const allCollections = [
        ...(topDeals          ?? []),
        ...(tailoredSelections ?? []),
        ...(newArrivals        ?? []),
      ];

      if (allCollections.length) {
        await Collection.insertMany(allCollections);
        console.log(`✅ Inserted ${allCollections.length} Collection entries.`);
      }
    }

    console.log('🎉 --- SEEDING COMPLETE --- 🎉');
    return NextResponse.json(
      {
        success: true,
        message: `Database seeded successfully! ${Object.keys(categoryMap).length} categories and ${insertedStores.length} stores inserted.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ SEEDING FATAL ERROR ❌');
    console.error('Error Name:',    error.name);
    console.error('Error Message:', error.message);
    if (error.errors) console.error('Validation Details:', error.errors);

    return NextResponse.json(
      {
        success: false,
        error:   error.message,
        details: error.errors ?? null,
      },
      { status: 500 },
    );
  }
}