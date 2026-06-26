// app/api/cart/validate/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Marketplace';

export async function POST(request) {
  try {
    await connectToDatabase();

    const body  = await request.json();
    const items = body.items || [];

    if (!items.length) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } })
      .select('_id title price stock status isFlashItem flashSalePrice')
      .lean();

    const productMap = {};
    for (const p of products) productMap[String(p._id)] = p;

    for (const item of items) {
      const product = productMap[String(item.productId)];

      if (!product) {
        return NextResponse.json({
          success: false,
          message: 'One or more items in your cart are no longer available. Please refresh your cart.',
        }, { status: 400 });
      }

      // Product archived or drafted by seller
      if (product.status !== 'active') {
        return NextResponse.json({
          success: false,
          message: `"${product.title}" is no longer available.`,
        }, { status: 400 });
      }

      // Stock check — only if stock is tracked (> 0 means tracked)
      if (typeof product.stock === 'number' && product.stock < item.quantity) {
        if (product.stock === 0) {
          return NextResponse.json({
            success: false,
            message: `"${product.title}" is out of stock. Please remove it from your cart.`,
          }, { status: 400 });
        }
        return NextResponse.json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.title}" available. Please update your quantity.`,
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Cart is valid' });

  } catch (error) {
    console.error('[Cart validate]', error);
    // Don't block checkout on server errors
    return NextResponse.json({ success: true, message: 'Validation skipped' });
  }
}