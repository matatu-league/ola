"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, ShoppingBag, Users, ArrowUpRight, Clock,
  CheckCircle2, ChevronRight, Circle, Image as ImageIcon, MapPin,
  PackagePlus, Store, Loader2, Eye
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, isPositive, icon: Icon }) => (
  <div className="bg-white p-5 border border-gray-200 hover:border-black transition-colors group cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <div className="w-8 h-8 bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
        <Icon size={16} className="text-black" strokeWidth={2} />
      </div>
      <span className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 border ${
        isPositive
          ? 'bg-green-50 text-green-600 border-green-200'
          : 'bg-red-50 text-red-500 border-red-200'
      }`}>
        {isPositive ? '+' : '-'}{Math.abs(change)}%
        <ArrowUpRight size={12} className={!isPositive ? 'rotate-90' : ''} />
      </span>
    </div>
    <h3 className="text-gray-500 text-xs font-semibold mb-0.5">{title}</h3>
    <p className="text-xl font-bold text-black tracking-tight">{value}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Custom Chart Tooltip
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-sm">
        <p className="text-xs font-bold text-black mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="w-2 h-2" style={{ backgroundColor: entry.color }} />
            <p className="text-xs text-gray-500">
              <span className="font-bold text-black mr-1">{entry.value}</span>
              {entry.name}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge helper
// ─────────────────────────────────────────────────────────────────────────────
const statusCls = (status) => {
  if (status === 'Completed') return 'bg-green-50 text-green-600 border-green-200';
  if (status === 'Processing') return 'bg-blue-50 text-blue-600 border-blue-200';
  return 'bg-yellow-50 text-yellow-600 border-yellow-200';
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const [storeData, setStoreData]     = useState(null);
  const [hasProducts, setHasProducts] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch('/api/stores'),
          fetch('/api/products?owner=true&limit=1', { headers: { 'ngrok-skip-browser-warning': 'true' } }),
        ]);
        const storeResult    = await storeRes.json();
        const productsResult = await productsRes.json();

        if (storeResult.success && storeResult.store)
          setStoreData(storeResult.store);
        if (productsResult.success && productsResult.data?.products)
          setHasProducts(productsResult.data.products.length > 0);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const analyticsData = [
    { name: 'Mon', views: 120,  orders: 12  },
    { name: 'Tue', views: 250,  orders: 28  },
    { name: 'Wed', views: 180,  orders: 15  },
    { name: 'Thu', views: 390,  orders: 42  },
    { name: 'Fri', views: 480,  orders: 55  },
    { name: 'Sat', views: 650,  orders: 85  },
    { name: 'Sun', views: 590,  orders: 70  },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'Sarah Jenkins',  product: 'Minimalist Desk Lamp',          amount: '$45.00',   status: 'Completed',  date: 'Today, 2:30 PM'  },
    { id: '#ORD-002', customer: 'Michael Chen',   product: 'Ergonomic Office Chair',         amount: '$199.99',  status: 'Processing', date: 'Today, 11:15 AM' },
    { id: '#ORD-003', customer: 'Emma Watson',    product: 'Wireless Mechanical Keyboard',   amount: '$120.00',  status: 'Pending',    date: 'Yesterday'       },
    { id: '#ORD-004', customer: 'David Miller',   product: 'Noise Cancelling Headphones',    amount: '$250.00',  status: 'Completed',  date: 'Yesterday'       },
  ];

  const trendingProducts = [
    { id: 1, title: 'Wireless Mechanical Keyboard',  views: 3420, orders: 145 },
    { id: 2, title: 'Ergonomic Office Chair',         views: 2890, orders: 98  },
    { id: 3, title: 'Noise Cancelling Headphones',   views: 2150, orders: 112 },
    { id: 4, title: 'Minimalist Desk Lamp',           views: 1840, orders: 76  },
    { id: 5, title: 'Leather Mouse Pad',              views: 1200, orders: 204 },
  ];

  const setupTasks = [
    { id: 1, title: 'Store Details',    desc: 'Completed during onboarding',        icon: Store,       isCompleted: !!storeData?.title,                          link: '/profile'      },
    { id: 2, title: 'Upload Branding',  desc: 'Add your store logo and banner',     icon: ImageIcon,   isCompleted: !!(storeData?.logo && storeData?.banner),    link: '/profile'      },
    { id: 3, title: 'Set Location',     desc: 'Add business address details',       icon: MapPin,      isCompleted: !!storeData?.location?.address,              link: '/profile'      },
    { id: 4, title: 'Add First Product',desc: 'Start selling items to customers',   icon: PackagePlus, isCompleted: hasProducts,                                 link: '/products/add' },
  ];

  const completedTasks       = setupTasks.filter(t => t.isCompleted).length;
  const progressPercentage   = storeData ? Math.round((completedTasks / setupTasks.length) * 100) : 0;
  const isSetupFullyComplete = progressPercentage === 100;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full bg-white text-black min-h-screen p-4 sm:p-8 pb-10">

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="bg-white border border-gray-200 mb-6 p-6 flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-black" size={24} />
            <span className="text-sm font-semibold text-gray-500">Loading dashboard data...</span>
          </div>
        </div>
      )}

      {/* ── Store Setup Progress ─────────────────────────────────────────────── */}
      {!isLoading && !isSetupFullyComplete && (
        <div className="bg-white border border-gray-200 mb-6 p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
            <div className="flex-1">
              <h3 className="font-bold text-base">Complete your store setup</h3>
              <p className="text-sm text-gray-500 mt-0.5">{completedTasks} of {setupTasks.length} tasks completed</p>
            </div>
            <span className="text-sm font-bold text-black">{progressPercentage}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 border border-gray-200 overflow-hidden mb-6">
            <div
              className="h-full bg-black transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {setupTasks.map((task) => (
              <Link
                href={task.link}
                key={task.id}
                className={`relative p-4 border flex flex-col group transition-colors ${
                  task.isCompleted
                    ? 'bg-gray-50 border-gray-200 cursor-default pointer-events-none'
                    : 'bg-white border-gray-200 hover:border-black cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 flex items-center justify-center border ${
                    task.isCompleted
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-200 group-hover:border-black transition-colors'
                  }`}>
                    <task.icon
                      size={14}
                      className={task.isCompleted ? 'text-green-600' : 'text-black'}
                    />
                  </div>
                  {task.isCompleted
                    ? <CheckCircle2 size={16} className="text-green-600" />
                    : <Circle size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                  }
                </div>

                <h4 className={`text-sm font-bold mb-1 ${
                  task.isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-black'
                }`}>
                  {task.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">{task.desc}</p>

                {!task.isCompleted && (
                  <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-bold text-black group-hover:text-blue-600 transition-colors">
                    Complete Task <ChevronRight size={12} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue"    value="$12,450.00" change={12.5} isPositive={true}  icon={DollarSign}  />
        <StatCard title="Active Orders"    value="42"         change={4.2}  isPositive={true}  icon={ShoppingBag} />
        <StatCard title="Store Views"      value="3,214"      change={1.4}  isPositive={false} icon={Users}       />
        <StatCard title="Conversion Rate"  value="3.8%"       change={0.8}  isPositive={true}  icon={TrendingUp}  />
      </div>

      {/* ── Analytics Chart ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 mb-6 p-5 lg:p-6">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <div className="flex-1">
            <h3 className="font-bold text-base">Store Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Product Views vs Orders over the last 7 days</p>
          </div>
          <select className="bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} accessibilityLayer>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#111', paddingTop: '10px' }} />
              <Line type="monotone" name="Product Views" dataKey="views"  stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" name="Orders"        dataKey="orders" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Orders + Trending ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-bold text-base">Recent Orders</h3>
            <button className="text-xs font-bold text-black hover:text-blue-600 transition-colors">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-semibold text-black text-sm">{order.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-black text-sm">{order.customer}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{order.product}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-black text-sm">{order.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${statusCls(order.status)}`}>
                        {order.status === 'Completed'
                          ? <CheckCircle2 size={10} />
                          : <Clock size={10} />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs font-medium">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Products */}
        <div className="bg-white border border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-base">Trending Products</h3>
            <button className="text-xs font-bold text-black hover:text-blue-600 transition-colors">
              Report
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {trendingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{product.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Eye size={12} /> {product.views.toLocaleString()} views
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-black">{product.orders}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link
              href="/products"
              className="w-full flex justify-center items-center text-xs font-bold text-black hover:text-blue-600 transition-colors"
            >
              Manage All Products <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}