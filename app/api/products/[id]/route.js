// app/api/products/[id]/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category, Product, ProductReview, ProductView } from '@/models/Marketplace';
// Store joined via $lookup — no direct import needed
import '@/models/User';
import { getViewer } from '@/lib/getViewer';

const VIEW_DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h — set to 0 for raw counting

// Records a product view in the history collection and increments the public
// `views` counter only for genuinely new/stale views (de-duped per viewer).
async function recordProductView(productId) {
  const viewer = await getViewer();
  const now    = new Date();

  // No identity at all (bot / no cookie): just bump the raw counter.
  if (!viewer.userId && !viewer.sessionId) {
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
    return;
  }

  const filter = viewer.userId
    ? { user: viewer.userId, product: productId }
    : { sessionId: viewer.sessionId, product: productId };

  // Upsert the history row. `new: false` returns the doc as it was BEFORE
  // this update (or null if it was just inserted) so we can de-dupe.
  const previous = await ProductView.findOneAndUpdate(
    filter,
    { $set: { lastViewedAt: now }, $inc: { viewCount: 1 } },
    { upsert: true, new: false },
  ).lean();

  const isNewOrStale =
    !previous || (now - new Date(previous.lastViewedAt)) > VIEW_DEDUP_WINDOW_MS;

  // Only bump the public counter for genuinely new/stale views.
  if (isNewOrStale) {
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
  }
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // ── Single aggregation pipeline — joins store, user, category, and
    // storeCategoryId in ONE DB round trip ────────────────────────────────────
    const mongoose = (await import('mongoose')).default;

    // Record the view (history + de-duped public counter) before aggregating
    // so the returned product reflects the new count.
    await recordProductView(id);

    const pipeline = [
      // Match the product
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // ── Join store by storeId (primary) ──────────────────────────────────
      {
        $lookup: {
          from:         'stores',
          localField:   'storeId',
          foreignField: '_id',
          as:           '_storeById',
          pipeline: [
            { $project: {
              _id: 1, title: 1, domain: 1, logo: 1, banner: 1,
              contact: 1, verified: 1, location: 1, years: 1, rating: 1,
            }},
          ],
        },
      },

      // ── Join store by owner userId (fallback) ─────────────────────────────
      {
        $lookup: {
          from:         'stores',
          localField:   'userId',
          foreignField: 'owner',
          as:           '_storeByOwner',
          pipeline: [
            { $project: {
              _id: 1, title: 1, domain: 1, logo: 1, banner: 1,
              contact: 1, verified: 1, location: 1, years: 1, rating: 1,
            }},
          ],
        },
      },

      // ── Merge: prefer storeById, fall back to storeByOwner ────────────────
      {
        $addFields: {
          store: {
            $let: {
              vars: {
                s: {
                  $cond: [
                    { $gt: [{ $size: '$_storeById' }, 0] },
                    { $arrayElemAt: ['$_storeById', 0] },
                    { $arrayElemAt: ['$_storeByOwner', 0] },
                  ],
                },
              },
              in: {
                $cond: [
                  { $gt: ['$$s', null] },
                  {
                    _id:      '$$s._id',
                    title:    { $ifNull: ['$$s.title',    'Unknown Store']     },
                    domain:   { $ifNull: ['$$s.domain',   null]               },
                    logo:     { $ifNull: ['$$s.logo',     null]               },
                    banner:   { $ifNull: ['$$s.banner',   null]               },
                    contact:  { $ifNull: ['$$s.contact',  null]               },
                    verified: { $ifNull: ['$$s.verified', false]              },
                    location: { $ifNull: ['$$s.location', null]               },
                    years:    { $ifNull: ['$$s.years',    null]               },
                    rating:   { $ifNull: ['$$s.rating',   null]               },
                  },
                  // No store found — structured fallback so UI never breaks
                  {
                    _id: null, title: 'Independent Seller', domain: null,
                    logo: null, banner: null, contact: null,
                    verified: false, location: null, years: null, rating: null,
                  },
                ],
              },
            },
          },
        },
      },

      // ── Join user (owner) ─────────────────────────────────────────────────
      {
        $lookup: {
          from:         'users',
          localField:   'userId',
          foreignField: '_id',
          as:           'userId',
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
        },
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },

      // ── Join category ─────────────────────────────────────────────────────
      {
        $lookup: {
          from:         'categories',
          localField:   'categoryId',
          foreignField: '_id',
          as:           'categoryId',
          pipeline: [{ $project: { name: 1, slug: 1, parentId: 1 } }],
        },
      },
      { $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true } },

      // ── Join storeCategory ────────────────────────────────────────────────
      {
        $lookup: {
          from:         'storecategories',
          localField:   'storeCategoryId',
          foreignField: '_id',
          as:           'storeCategoryId',
          pipeline: [{ $project: { name: 1, slug: 1 } }],
        },
      },
      { $unwind: { path: '$storeCategoryId', preserveNullAndEmptyArrays: true } },

      // Clean up temp fields
      { $project: { _storeById: 0, _storeByOwner: 0 } },
    ];

    const [product] = await Product.aggregate(pipeline);

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    const reviews = await ProductReview.find({ productId: id })
      .sort({ createdAt: -1 })
      .lean();

    const reviewStats = {
      average:      product.rating || 5.0,
      total:        reviews.length || product.reviewsCount || 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => {
        reviewStats.distribution[r.rating] = (reviewStats.distribution[r.rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      reviewStats.average = Number((sum / reviews.length).toFixed(1));
    }

    // ── Breadcrumbs ───────────────────────────────────────────────────────────
    let breadcrumbs = ['Home'];
    if (product.categoryId) {
      if (product.categoryId.parentId) {
        const parentCat = await Category.findById(product.categoryId.parentId)
          .select('name')
          .lean();
        if (parentCat) breadcrumbs.push(parentCat.name);
      }
      breadcrumbs.push(product.categoryId.name);
    }
    if (product.storeCategoryId) breadcrumbs.push(product.storeCategoryId.name);
    breadcrumbs.push(product.title);

    // ── Recommendations ───────────────────────────────────────────────────────
    let recommendations = [];
    if (product.categoryId) {
      recommendations = await Product.find({
        categoryId: product.categoryId._id,
        _id:        { $ne: id },
        status:     'active',
      })
        .select('title price moq image images storeId')
        .limit(6)
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        breadcrumbs,
        reviews,
        reviewStats,
        recommendations,
      },
    });

  } catch (error) {
    console.error('[Product GET]', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id }  = await params;
    const body    = await request.json();

    const updatePayload = {
      ...body,
      ...(body.category      && { categoryId:      body.category      }),
      ...(body.storeCategory && { storeCategoryId: body.storeCategory }),
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProduct });

  } catch (error) {
    console.error('[Product PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    console.error('[Product DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}