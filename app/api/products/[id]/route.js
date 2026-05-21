import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category, Product, ProductReview } from '@/models/Marketplace';
import Store from '@/models/Store';
import '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    )
      .populate('userId')
      .populate('categoryId')
      .populate('storeCategoryId')
      .lean();

    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    if (product.userId) {
      const userIdString = product.userId._id?.toString() ?? product.userId.toString();

      const storeDetails = await Store.findOne({
        $or: [
          { owner: userIdString },
          ...(product.userId.clerkId ? [{ owner: product.userId.clerkId }] : []),
        ],
      })
        .select('title domain contact bannerImages verified location years logo banner rating')
        .lean();

      product.store = storeDetails || { title: 'Independent Seller', verified: false, domain: '' };
    }

    const reviews = await ProductReview.find({ productId: id }).sort({ createdAt: -1 }).lean();

    const reviewStats = {
      average:      product.rating || 5.0,
      total:        reviews.length || product.reviewsCount || 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => {
        reviewStats.distribution[r.rating]++;
        return acc + r.rating;
      }, 0);
      reviewStats.average = Number((sum / reviews.length).toFixed(1));
    }

    let breadcrumbs = ['Home'];
    if (product.categoryId) {
      if (product.categoryId.parentId) {
        const parentCat = await Category.findById(product.categoryId.parentId).lean();
        if (parentCat) breadcrumbs.push(parentCat.name);
      }
      breadcrumbs.push(product.categoryId.name);
    }
    if (product.storeCategoryId) breadcrumbs.push(product.storeCategoryId.name);
    breadcrumbs.push(product.title);

    let recommendations = [];
    if (product.categoryId) {
      recommendations = await Product.find({
        categoryId: product.categoryId._id,
        _id:        { $ne: id },
      })
        .select('title price moq image')
        .limit(4)
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: { ...product, breadcrumbs, reviews, reviewStats, recommendations },
    });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body   = await request.json();

    const updatePayload = {
      ...body,
      ...(body.category      && { categoryId:      body.category }),
      ...(body.storeCategory && { storeCategoryId: body.storeCategory }),
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, {
      new:           true,
      runValidators: true,
    }).lean();

    if (!updatedProduct) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}