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

// Flat Stat Card Component
const StatCard = ({ title, value, change, isPositive, icon: Icon }) => (
  <div className="bg-white p-5 rounded-sm border border-[#E3E3E4] hover:border-[#161823] transition-colors group cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <div className="w-8 h-8 rounded-sm bg-[#F8F8F8] border border-[#E3E3E4] flex items-center justify-center group-hover:border-[#161823] transition-colors">
        <Icon size={16} className="text-[#161823]" strokeWidth={2} />
      </div>
      <span className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-sm ${isPositive ? 'bg-[#E6F4EA] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#FE2C55]'}`}>
        {isPositive ? '+' : '-'}{Math.abs(change)}%
        <ArrowUpRight size={12} className={!isPositive && 'rotate-90'} />
      </span>
    </div>
    <h3 className="text-[#8A8B91] text-[12px] font-semibold mb-0.5">{title}</h3>
    <p className="text-xl font-bold text-[#161823] tracking-tight">{value}</p>
  </div>
);

// Custom Flat Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-[#E3E3E4] rounded-sm shadow-sm">
        <p className="text-[12px] font-bold text-[#161823] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-[12px] text-[#8A8B91]">
              <span className="font-bold text-[#161823] mr-1">{entry.value}</span> 
              {entry.name}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SellerDashboard() {
  const [storeData, setStoreData] = useState(null);
  const [hasProducts, setHasProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actual store profile data and check for products
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch('/api/stores'),
          fetch('/api/products?owner=true&limit=1', { headers: { 'ngrok-skip-browser-warning': 'true' } })
        ]);
        
        const storeResult = await storeRes.json();
        const productsResult = await productsRes.json();
        
        if (storeResult.success && storeResult.store) {
          setStoreData(storeResult.store);
        }

        if (productsResult.success && productsResult.data?.products) {
          setHasProducts(productsResult.data.products.length > 0);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock Analytics Data for Recharts
  const analyticsData = [
    { name: 'Mon', views: 120, orders: 12 },
    { name: 'Tue', views: 250, orders: 28 },
    { name: 'Wed', views: 180, orders: 15 },
    { name: 'Thu', views: 390, orders: 42 },
    { name: 'Fri', views: 480, orders: 55 },
    { name: 'Sat', views: 650, orders: 85 },
    { name: 'Sun', views: 590, orders: 70 },
  ];

  // Mock Data for Recent Orders
  const recentOrders = [
    { id: '#ORD-001', customer: 'Sarah Jenkins', product: 'Minimalist Desk Lamp', amount: '$45.00', status: 'Completed', date: 'Today, 2:30 PM' },
    { id: '#ORD-002', customer: 'Michael Chen', product: 'Ergonomic Office Chair', amount: '$199.99', status: 'Processing', date: 'Today, 11:15 AM' },
    { id: '#ORD-003', customer: 'Emma Watson', product: 'Wireless Mechanical Keyboard', amount: '$120.00', status: 'Pending', date: 'Yesterday' },
    { id: '#ORD-004', customer: 'David Miller', product: 'Noise Cancelling Headphones', amount: '$250.00', status: 'Completed', date: 'Yesterday' },
  ];

  // Mock Data for Trending Products (Sorted by views descending)
  const trendingProducts = [
    { id: 1, title: 'Wireless Mechanical Keyboard', views: 3420, orders: 145 },
    { id: 2, title: 'Ergonomic Office Chair', views: 2890, orders: 98 },
    { id: 3, title: 'Noise Cancelling Headphones', views: 2150, orders: 112 },
    { id: 4, title: 'Minimalist Desk Lamp', views: 1840, orders: 76 },
    { id: 5, title: 'Leather Mouse Pad', views: 1200, orders: 204 },
  ];

  // Dynamically calculate setup progress based on fetched data
  const setupTasks = [
    { 
      id: 1, 
      title: 'Store Details', 
      desc: 'Completed during onboarding', 
      icon: Store, 
      isCompleted: !!storeData?.title,
      link: '/profile'
    },
    { 
      id: 2, 
      title: 'Upload Branding', 
      desc: 'Add your store logo and banner', 
      icon: ImageIcon, 
      isCompleted: !!(storeData?.logo && storeData?.banner),
      link: '/profile'
    },
    { 
      id: 3, 
      title: 'Set Location', 
      desc: 'Add business address details', 
      icon: MapPin, 
      isCompleted: !!storeData?.location?.address,
      link: '/profile'
    },
    { 
      id: 4, 
      title: 'Add First Product', 
      desc: 'Start selling items to customers', 
      icon: PackagePlus, 
      isCompleted: hasProducts,
      link: '/products/add'
    },
  ];
  
  const completedTasks = setupTasks.filter(t => t.isCompleted).length;
  const progressPercentage = storeData ? Math.round((completedTasks / setupTasks.length) * 100) : 0;
  const isSetupFullyComplete = progressPercentage === 100;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full pb-10">

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-sm border border-[#E3E3E4] mb-6 p-6 flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#161823]" size={24} />
            <span className="text-[13px] font-semibold text-[#8A8B91]">Loading dashboard data...</span>
          </div>
        </div>
      )}

      {/* Dynamic Store Setup Progress - Hidden if fully complete */}
      {!isLoading && !isSetupFullyComplete && (
        <div className="bg-white rounded-sm border border-[#E3E3E4] mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-[#161823] text-[15px]">Complete your store setup</h3>
              <p className="text-[13px] text-[#8A8B91] mt-0.5">{completedTasks} of {setupTasks.length} tasks completed</p>
            </div>
            <div className="text-[14px] font-bold text-[#161823]">{progressPercentage}%</div>
          </div>
          
          <div className="w-full h-2 bg-[#F8F8F8] rounded-sm overflow-hidden mb-6 border border-[#E3E3E4]">
            <div className="h-full bg-[#161823] transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {setupTasks.map((task) => (
              <Link 
                href={task.link}
                key={task.id}
                className={`relative p-4 rounded-sm border transition-colors flex flex-col group ${
                  task.isCompleted 
                    ? 'bg-[#F8F8F8] border-[#E3E3E4] cursor-default pointer-events-none' 
                    : 'bg-white border-[#E3E3E4] hover:border-[#161823] cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center border ${
                    task.isCompleted ? 'bg-white border-[#E3E3E4]' : 'bg-[#F8F8F8] border-[#E3E3E4] group-hover:border-[#161823]'
                  }`}>
                    <task.icon size={14} className={task.isCompleted ? 'text-[#16A34A]' : 'text-[#161823]'} />
                  </div>
                  {task.isCompleted ? (
                    <CheckCircle2 size={16} className="text-[#16A34A]" />
                  ) : (
                    <Circle size={16} className="text-[#8A8B91] group-hover:text-[#161823]" />
                  )}
                </div>
                <h4 className={`text-[13px] font-bold mb-1 ${task.isCompleted ? 'text-[#8A8B91] line-through decoration-[#E3E3E4]' : 'text-[#161823]'}`}>
                  {task.title}
                </h4>
                <p className={`text-[12px] leading-relaxed ${task.isCompleted ? 'text-[#8A8B91]' : 'text-[#8A8B91]'}`}>
                  {task.desc}
                </p>
                
                {!task.isCompleted && (
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#161823] group-hover:text-[#FE2C55] transition-colors mt-auto">
                    Complete Task <ChevronRight size={12} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value="$12,450.00" change={12.5} isPositive={true} icon={DollarSign} />
        <StatCard title="Active Orders" value="42" change={4.2} isPositive={true} icon={ShoppingBag} />
        <StatCard title="Store Views" value="3,214" change={1.4} isPositive={false} icon={Users} />
        <StatCard title="Conversion Rate" value="3.8%" change={0.8} isPositive={true} icon={TrendingUp} />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-sm border border-[#E3E3E4] mb-6 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-[#161823] text-sm">Store Performance</h3>
            <p className="text-[12px] text-[#8A8B91] mt-0.5">Product Views vs Orders over the last 7 days</p>
          </div>
          <select className="bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-1.5 text-[12px] font-semibold text-[#161823] outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
        </div>
        
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} accessibilityLayer>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#8A8B91', fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#8A8B91', fontWeight: 600 }} 
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E3E3E4', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#161823', paddingTop: '10px' }} 
              />
              <Line 
                type="monotone" 
                name="Product Views"
                dataKey="views" 
                stroke="#8884d8" 
              />
              <Line 
                type="monotone" 
                name="Orders"
                dataKey="orders" 
                stroke="#82ca9d" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-[#E3E3E4] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E3E4] flex items-center justify-between bg-white">
            <h3 className="font-bold text-[#161823] text-sm">Recent Orders</h3>
            <button className="text-[12px] font-bold text-[#161823] hover:text-[#FE2C55] transition-colors border border-transparent">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E3E4]">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F8F8] transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5 font-semibold text-[#161823]">{order.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#161823]">{order.customer}</div>
                      <div className="text-[11px] text-[#8A8B91] mt-0.5 truncate max-w-[150px]">{order.product}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#161823]">{order.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border
                        ${order.status === 'Completed' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 
                          order.status === 'Processing' ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20' : 
                          'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20'}
                      `}>
                        {order.status === 'Completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8A8B91] text-[12px] font-medium">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Trending Products */}
        <div className="bg-white rounded-sm border border-[#E3E3E4] flex flex-col">
          <div className="px-5 py-4 border-b border-[#E3E3E4] flex items-center justify-between">
            <h3 className="font-bold text-[#161823] text-sm">Trending Products</h3>
            <button className="text-[12px] font-bold text-[#161823] hover:text-[#FE2C55] transition-colors border border-transparent">Report</button>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {trendingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-[#8A8B91]">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#161823] truncate">{product.title}</p>
                    <p className="text-[11px] text-[#8A8B91] mt-0.5 flex items-center gap-1">
                      <Eye size={12} /> {product.views.toLocaleString()} views
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-[#161823]">{product.orders}</p>
                    <p className="text-[10px] font-semibold text-[#8A8B91] uppercase">Sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-[#E3E3E4] bg-[#F8F8F8]">
            <Link href="/seller/products" className="w-full flex justify-center items-center text-[12px] font-bold text-[#161823] hover:text-[#FE2C55] transition-colors">
              Manage All Products <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}