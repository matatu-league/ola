// GET /api/admin/stats?range=7D|30D|3M|1Y
// Real, aggregated marketplace metrics for the admin dashboard (no mock data).
// GMV/revenue from PAID orders, order + user + store counts, revenue trend,
// user growth, order-status breakdown, and top vendors by revenue.
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Marketplace';
import User from '@/models/User';
import Store from '@/models/Store';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

function rangeStart(range) {
  const d = new Date();
  if (range === '7D')      d.setDate(d.getDate() - 7);
  else if (range === '3M') d.setMonth(d.getMonth() - 3);
  else if (range === '1Y') d.setFullYear(d.getFullYear() - 1);
  else                     d.setDate(d.getDate() - 30); // default 30D
  return d;
}

export async function GET(request) {
  try {
    await connectToDatabase();

    const range = new URL(request.url).searchParams.get('range') || '30D';
    const start = rangeStart(range);
    // Symmetric previous window for trend %.
    const prevStart = new Date(start.getTime() - (Date.now() - start.getTime()));
    const PAID = { paymentStatus: 'paid' };
    // Daily buckets for short ranges, monthly for long ones.
    const bucketFmt = (range === '3M' || range === '1Y') ? '%Y-%m' : '%Y-%m-%d';

    const settings       = await Settings.findOne({ isGlobal: true }).lean();
    const commissionRate = settings?.globalCommissionRate ?? 12.5;
    const currency       = settings?.baseCurrency || 'UGX';

    const [
      curAgg, prevAgg, ordersCount, vendorsCount, activeBuyers, prevBuyers,
      trendAgg, userGrowthAgg, statusAgg, topVendorsAgg,
    ] = await Promise.all([
      Order.aggregate([{ $match: { ...PAID, createdAt: { $gte: start } } },
        { $group: { _id: null, gmv: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { ...PAID, createdAt: { $gte: prevStart, $lt: start } } },
        { $group: { _id: null, gmv: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Order.countDocuments({ createdAt: { $gte: start } }),
      Store.countDocuments({}),
      Order.distinct('user', { ...PAID, createdAt: { $gte: start } }),
      Order.distinct('user', { ...PAID, createdAt: { $gte: prevStart, $lt: start } }),
      Order.aggregate([
        { $match: { ...PAID, createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: bucketFmt, date: '$createdAt' } }, gmv: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $ne: null } } },
        { $group: { _id: { m: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, role: '$role' }, count: { $sum: 1 } } },
        { $sort: { '_id.m': 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', value: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...PAID } },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.storeId',
            sales:   { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders:  { $sum: 1 },
        } },
        { $match: { _id: { $ne: null } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Resolve top-vendor store names/categories.
    const storeIds = topVendorsAgg.map(v => v._id).filter(Boolean);
    const stores   = storeIds.length ? await Store.find({ _id: { $in: storeIds } }).select('title industry').lean() : [];
    const storeMap = new Map(stores.map(s => [String(s._id), s]));
    const topVendors = topVendorsAgg.map(v => {
      const s = storeMap.get(String(v._id));
      return {
        id:       String(v._id || ''),
        name:     s?.title || 'Unknown store',
        category: s?.industry || '—',
        sales:    v.sales || 0,
        revenue:  Math.round(v.revenue || 0),
        orders:   v.orders || 0,
      };
    });

    const cur  = curAgg[0]  || { gmv: 0, count: 0 };
    const prev = prevAgg[0] || { gmv: 0, count: 0 };
    const gmv         = cur.gmv || 0;
    const revenue     = Math.round(gmv * (commissionRate / 100));
    const prevGmv     = prev.gmv || 0;
    const prevRevenue = prevGmv * (commissionRate / 100);

    const revenueTrend = trendAgg.map(t => ({
      name:    t._id,
      gmv:     Math.round(t.gmv || 0),
      revenue: Math.round((t.gmv || 0) * (commissionRate / 100)),
      orders:  t.orders || 0,
    }));

    // Pivot user growth: buyers (buyer/admin) vs vendors (seller) per month.
    const months = {};
    for (const row of userGrowthAgg) {
      const m = row._id?.m;
      if (!m) continue;
      months[m] = months[m] || { month: m, buyers: 0, vendors: 0 };
      if (row._id.role === 'seller') months[m].vendors += row.count;
      else                            months[m].buyers  += row.count;
    }
    const userGrowth = Object.values(months).slice(-6);

    const statusBreakdown = statusAgg.map(s => ({ name: s._id || 'unknown', value: s.value }));

    const pct = (c, p) => {
      if (!p) return c ? 100 : 0;
      return Math.round(((c - p) / p) * 1000) / 10;
    };

    return NextResponse.json({
      success: true,
      stats: {
        currency,
        commissionRate,
        gmv,
        revenue,
        orders: ordersCount,
        vendors: vendorsCount,
        activeBuyers: activeBuyers.length,
        trends: {
          gmv:     pct(gmv, prevGmv),
          revenue: pct(revenue, prevRevenue),
          buyers:  pct(activeBuyers.length, prevBuyers.length),
        },
        revenueTrend,
        userGrowth,
        statusBreakdown,
        topVendors,
      },
    });
  } catch (error) {
    console.error('[admin/stats GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to compute stats' }, { status: 500 });
  }
}
