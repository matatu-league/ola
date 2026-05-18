import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductGrid, ProductReview, MarketplaceCategory } from '@/models/Marketplace';
import Store, { StoreCategory } from '@/models/Store'; // Ensure StoreCategory is imported to allow population
import '@/models/User'; 

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    //    // In Next.js 15+, params must be awaited
    const resolvedParams = await params;
    const { id } = resolvedParams;

    //    // 1. Fetch Product, Increment Views, and Populate References
    // We use findByIdAndUpdate with $inc to track views efficiently
    const product = await ProductGrid.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true } // Returns the document AFTER the update
    )
      .populate('owner')
      .populate('categoryRef') // Global Marketplace Category
      .populate('storeCategoryRef') // Merchant's Custom Subcategory
      .lean();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    //    // 2. Fetch Store Details Manually
    if (product.owner) {
      const userIdString = product.owner._id ? product.owner._id.toString() : product.owner.toString();
      
      const storeDetails = await Store.findOne({ 
        $or: [
          { owner: userIdString },
          ...(product.owner.clerkId ? [{ owner: product.owner.clerkId }] : []) 
        ]
      })
      .select('title domain contact bannerImages verified location years logo banner rating')
      .lean();

      product.owner = storeDetails || { 
         title: "Independent Seller", 
         verified: false,
         domain: ""
      };
    }

    //    // 3. Fetch Reviews & Calculate Stats
    const reviews = await ProductReview.find({ productRef: id }).sort({ createdAt: -1 }).lean();
    
    const reviewStats = {
      average: product.rating || 5.0,
      total: reviews.length || product.reviewsCount || 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    if (reviews.length > 0) {
       let sum = 0;
       reviews.forEach(r => {
         sum += r.rating;
         if (reviewStats.distribution[r.rating] !== undefined) {
           reviewStats.distribution[r.rating]++;
         }
       });
       reviewStats.average = Number((sum / reviews.length).toFixed(1));
    }

    //    // 4. Build Breadcrumbs efficiently
    let breadcrumbs = ['Home'];
    if (product.categoryRef) {
       const currentCat = product.categoryRef;
       if (currentCat.parentRef) {
          const parentCat = await MarketplaceCategory.findById(currentCat.parentRef).lean();
          if (parentCat) breadcrumbs.push(parentCat.name);
       }
       breadcrumbs.push(currentCat.name);
    }
    // Optional: Add store subcategory to breadcrumbs if it exists
    if (product.storeCategoryRef) {
       breadcrumbs.push(product.storeCategoryRef.name);
    }
    breadcrumbs.push(product.title);

    //    // 5. Fetch Recommendations (Same category, but not this product)
    let recommendations = [];
    if (product.categoryRef) {
      recommendations = await ProductGrid.find({ 
        categoryRef: product.categoryRef._id,
        _id: { $ne: id }
      })
      .select('title price moq image')
      .limit(4)
      .lean();
    }

    //    // 6. Structure the clean payload
    const structuredData = {
      ...product,
      breadcrumbs,
      reviews,
      reviewStats,
      recommendations
    };

    return NextResponse.json({ success: true, data: structuredData });
  } catch (error) {
    console.error("Error fetching single product:", error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    //    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
    }

    const updatePayload = {
      ...body,
      ...(body.category && { categoryRef: body.category }),
      ...(body.storeCategory && { storeCategoryRef: body.storeCategory }) // Handle custom store category updates
    };

    const updatedProduct = await ProductGrid.findByIdAndUpdate(
      id, 
      updatePayload, 
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product updated successfully", data: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    //    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
    }

    const deletedProduct = await ProductGrid.findByIdAndDelete(id);

    if (!deletedProduct) {
       return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}