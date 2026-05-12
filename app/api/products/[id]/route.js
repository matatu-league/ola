import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductGrid, ProductReview, MarketplaceCategory } from '@/models/Marketplace';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+, params must be awaited
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 1. Fetch Product
    const product = await ProductGrid.findById(id)
      .populate('owner', 'title verified years location contact domain logo')
      .populate('categoryRef')
      .lean();

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // 2. Fetch Reviews & Calculate Stats
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

    // 3. Build Breadcrumbs efficiently
    let breadcrumbs = ['Home'];
    if (product.categoryRef) {
       const currentCat = product.categoryRef;
       if (currentCat.parentRef) {
          const parentCat = await MarketplaceCategory.findById(currentCat.parentRef).lean();
          if (parentCat) breadcrumbs.push(parentCat.name);
       }
       breadcrumbs.push(currentCat.name);
    }
    breadcrumbs.push(product.title);

    // 4. Fetch Recommendations (Same category, but not this product)
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

    // 5. Structure the clean payload
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