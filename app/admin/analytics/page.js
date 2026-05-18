"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Store, 
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  MoreHorizontal,
  Activity,
  CreditCard,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

// Mock Data for Charts
const revenueData = [
  { name: '1 May', gmv: 45000, revenue: 4500, orders: 1200 },
  { name: '5 May', gmv: 52000, revenue: 5200, orders: 1350 },
  { name: '10 May', gmv: 48000, revenue: 4800, orders: 1250 },
  { name: '15 May', gmv: 61000, revenue: 6100, orders: 1500 },
  { name: '20 May', gmv: 59000, revenue: 5900, orders: 1420 },
  { name: '25 May', gmv: 75000, revenue: 7500, orders: 1800 },
  { name: '30 May', gmv: 82000, revenue: 8200, orders: 2100 },
];

const data01 = [
  { name: 'Electronics', value: 400 },
  { name: 'Fashion', value: 300 },
  { name: 'Home', value: 300 },
  { name: 'Beauty', value: 200 },
];

const data02 = [
  { name: 'Phones', value: 100 },
  { name: 'Laptops', value: 300 },
  { name: 'Shoes', value: 100 },
  { name: 'Apparel', value: 80 },
  { name: 'Bags', value: 120 },
  { name: 'Decor', value: 100 },
  { name: 'Furniture', value: 200 },
  { name: 'Makeup', value: 150 },
  { name: 'Skincare', value: 50 },
];

const userGrowthData = [
  { month: 'Jan', buyers: 12000, vendors: 450 },
  { month: 'Feb', buyers: 15000, vendors: 520 },
  { month: 'Mar', buyers: 18000, vendors: 610 },
  { month: 'Apr', buyers: 22000, vendors: 750 },
  { month: 'May', buyers: 28000, vendors: 890 },
  { month: 'Jun', buyers: 35000, vendors: 1100 },
];

const topVendors = [
  { id: 'V-1029', name: 'TechHaven Official', category: 'Electronics', sales: 12450, revenue: '$145,200', rating: 4.9, status: 'Top Rated' },
  { id: 'V-8832', name: 'Luxe Wardrobe', category: 'Fashion', sales: 8320, revenue: '$82,500', rating: 4.7, status: 'Trending' },
  { id: 'V-4511', name: 'HomeEssentials', category: 'Home', sales: 6100, revenue: '$45,800', rating: 4.6, status: 'Stable' },
  { id: 'V-9021', name: 'Glow Beauty Co.', category: 'Beauty', sales: 5400, revenue: '$38,200', rating: 4.8, status: 'Stable' },
  { id: 'V-3310', name: 'ActiveLife Sports', category: 'Sports', sales: 4200, revenue: '$29,100', rating: 4.5, status: 'Needs Attention' },
];

const COLORS = ['#161823', '#FE2C55', '#3B82F6', '#10B981', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-[#E3E3E4] rounded-lg shadow-lg">
        <p className="font-bold text-[#161823] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#8A8B91] capitalize">{entry.name}:</span>
            <span className="font-semibold text-[#161823]">
              {entry.name === 'gmv' || entry.name === 'revenue' ? '$' : ''}
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, trend, percent, icon: Icon, subtitle }) => (
  <div className="bg-white p-5 rounded-2xl border border-[#E3E3E4] shadow-sm flex flex-col hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] flex items-center justify-center text-[#161823]">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
        trend === 'up' ? 'bg-[#E6F8F1] text-[#10B981]' : 'bg-[#FEECEF] text-[#FE2C55]'
      }`}>
        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {percent}%
      </div>
    </div>
    <div>
      <h3 className="text-[#8A8B91] text-sm font-semibold mb-1">{title}</h3>
      <div className="text-2xl font-black text-[#161823] tracking-tight">{value}</div>
      <p className="text-[#8A8B91] text-xs mt-2 font-medium">{subtitle}</p>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30D');

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#161823] font-sans p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#161823]">Platform Analytics</h1>
            <p className="text-[#8A8B91] text-sm mt-1 font-medium">Comprehensive overview of marketplace performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E3E3E4] rounded-lg p-1 shadow-sm">
              {['7D', '30D', '3M', '1Y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    timeRange === range 
                      ? 'bg-[#161823] text-white shadow' 
                      : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E3E3E4] text-[#161823] text-sm font-bold rounded-lg hover:bg-[#F8F9FA] transition-colors shadow-sm">
              <Download size={16} />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard 
            title="Total GMV" 
            value="$4.2M" 
            trend="up" 
            percent="18.2" 
            icon={DollarSign}
            subtitle="vs. $3.5M last month"
          />
          <StatCard 
            title="Platform Revenue" 
            value="$420,500" 
            trend="up" 
            percent="12.5" 
            icon={Activity}
            subtitle="10% Take rate avg."
          />
          <StatCard 
            title="Active Buyers" 
            value="128.4K" 
            trend="up" 
            percent="8.4" 
            icon={Users}
            subtitle="Users with ≥ 1 purchase"
          />
          <StatCard 
            title="Active Vendors" 
            value="3,240" 
            trend="down" 
            percent="1.2" 
            icon={Store}
            subtitle="Vendors with active listings"
          />
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Main Area Chart for GMV/Revenue */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#161823]">GMV & Revenue Trend</h2>
                <p className="text-[#8A8B91] text-xs mt-1">Daily gross merchandise value vs platform fee revenue.</p>
              </div>
              <button className="p-2 text-[#8A8B91] hover:text-[#161823] rounded-md hover:bg-[#F8F9FA] transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#161823" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#161823" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FE2C55" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FE2C55" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E3E3E4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="gmv" name="Gross Volume (GMV)" stroke="#161823" fillOpacity={1} fill="url(#colorGmv)" />
                  <Area type="monotone" dataKey="revenue" name="Platform Revenue" stroke="#FE2C55" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div className="bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#161823]">Sales by Category</h2>
              <button className="p-2 text-[#8A8B91] hover:text-[#161823] rounded-md hover:bg-[#F8F9FA] transition-colors">
                <Filter size={18} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data01}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius="50%"
                    fill="#8884d8"
                  />
                  <Pie
                    data={data02}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    fill="#82ca9d"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Dual Line Chart for Users */}
          <div className="bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm">
            <h2 className="text-lg font-bold text-[#161823] mb-6">User Acquisition</h2>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E3E3E4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} tickFormatter={(val) => `${val/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="buyers" name="Buyers" stroke="#161823" dot={{ fill: '#ffffff' }} activeDot={{ stroke: '#ffffff', r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="vendors" name="Vendors" stroke="#3B82F6" dot={{ fill: '#ffffff' }} activeDot={{ stroke: '#ffffff', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E3E3E4] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E3E3E4] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#161823]">Top Performing Vendors</h2>
                <p className="text-[#8A8B91] text-xs mt-1">Ranked by total sales volume and revenue generation.</p>
              </div>
              <button className="text-sm font-bold text-[#161823] hover:text-[#FE2C55] transition-colors flex items-center gap-1">
                View All <ArrowUpRight size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#8A8B91] text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Vendor Details</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">Total Sales</th>
                    <th className="px-6 py-4 font-bold">Revenue</th>
                    <th className="px-6 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E3E4]">
                  {topVendors.map((vendor, index) => (
                    <tr key={vendor.id} className="hover:bg-[#F8F9FA] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#161823] to-[#4A4B55] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#161823] text-sm group-hover:text-[#FE2C55] transition-colors cursor-pointer">{vendor.name}</p>
                            <p className="text-xs text-[#8A8B91] font-medium">{vendor.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F2F2F3] text-[#5A5B60]">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#161823] text-sm">{vendor.sales.toLocaleString()}</div>
                        <div className="text-xs text-[#8A8B91] mt-0.5 flex items-center gap-1">
                          ★ {vendor.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#161823] text-sm">
                        {vendor.revenue}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          vendor.status === 'Top Rated' ? 'bg-[#E6F8F1] text-[#10B981]' :
                          vendor.status === 'Trending' ? 'bg-[#EFF6FF] text-[#3B82F6]' :
                          vendor.status === 'Needs Attention' ? 'bg-[#FFFBEB] text-[#F59E0B]' :
                          'bg-[#F2F2F3] text-[#5A5B60]'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}