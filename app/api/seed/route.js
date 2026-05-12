import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { TopDeal, TailoredSelection, ProductGrid, NewArrival, MarketplaceCategory } from '@/models/Marketplace';

// Import local data
import { topDeals, tailoredSelections, productGrid, newArrivals, marketplaceCategories, stores } from '../../data/mockData';

export async function POST(req) {
  console.log("🚀 --- STARTING DATABASE SEED PROCESS --- 🚀");
  
  try {
    console.log("1️⃣ Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully.");

    console.log("2️⃣ Wiping existing collections...");
    await MarketplaceCategory.deleteMany({});
    await Store.deleteMany({});
    await TopDeal.deleteMany({});
    await TailoredSelection.deleteMany({});
    await ProductGrid.deleteMany({});
    await NewArrival.deleteMany({});
    console.log("✅ Old data wiped.");

    console.log("3️⃣ Seeding Marketplace Categories & Subcategories...");
    const categoryMap = {}; // We will map category names to their new _ids
    
    for (const parentCat of marketplaceCategories) {
      // Create the Parent Category
      const createdParent = await MarketplaceCategory.create({
        name: parentCat.name,
        slug: parentCat.slug,
        image: parentCat.image,
        description: parentCat.description
      });
      
      // Save Parent ID to map so stores can link to it
      categoryMap[createdParent.name] = createdParent._id;

      // Create the Children linking to the Parent
      if (parentCat.subCategories && parentCat.subCategories.length > 0) {
        const subCategoryDocs = parentCat.subCategories.map(sub => ({
          name: sub.name,
          slug: sub.slug,
          parentRef: createdParent._id // Link to the parent!
        }));
        
        const createdChildren = await MarketplaceCategory.insertMany(subCategoryDocs);
        
        // Add children to the map too, so products/stores can link directly to a specific subcategory
        createdChildren.forEach(child => {
          categoryMap[child.name] = child._id;
        });
      }
    }
    console.log(`✅ Categories seeded successfully. Indexed ${Object.keys(categoryMap).length} total categories & subcategories.`);

    console.log("4️⃣ Preparing Store data with Category References...");
    const storesToInsert = stores.map(store => {
      // Map global categories to store.categories array
      const mappedCategoryIds = store.categories
        ?.map(catName => categoryMap[catName])
        .filter(Boolean) || [];

      // Map product category references
      const mappedProducts = store.products?.map(prod => ({
        ...prod,
        categoryRef: categoryMap[prod.categoryName] || null
      })) || [];

      return {
        ...store,
        categories: mappedCategoryIds,
        products: mappedProducts
      };
    });

    console.log("5️⃣ Inserting Stores into DB...");
    const insertedStores = await Store.insertMany(storesToInsert);
    console.log(`✅ Successfully inserted ${insertedStores.length} Stores.`);

    console.log("6️⃣ Inserting Marketplace feeds (Deals, Arrivals, etc.)...");
    await TopDeal.insertMany(topDeals);
    await TailoredSelection.insertMany(tailoredSelections);
    await ProductGrid.insertMany(productGrid);
    await NewArrival.insertMany(newArrivals);
    console.log("✅ Marketplace feeds inserted.");

    console.log("🎉 --- SEEDING COMPLETE --- 🎉");
    return NextResponse.json({ 
      success: true, 
      message: `Database seeded successfully! Categories, Subcategories, and ${insertedStores.length} Stores were inserted.` 
    }, { status: 200 });

  } catch (error) {
    console.error("❌ SEEDING FATAL ERROR ❌");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    
    if (error.errors) {
      console.error("Validation Details:", error.errors);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.errors || null
    }, { status: 500 });
  }
}