"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Store, Download,
  Filter, ArrowUpRight, MoreHorizontal, Activity, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#161823', '#FE2C55', '#3B82F6', '#10B981', '#F59E0B', '#9333EA'];

const CURRENCY_SYMBOL = { UGX: 'USh', KES: 'KSh', RWF: 'FRw', NGN: '₦', USD: '$' };

const money = (n, currency = 'UGX') => {
  const sym = CURRENCY_SYMBOL[currency] || '';
  const v = Number(n || 0);
  const abs = Math.abs(v);
  let out;
  if (abs >= 1_000_000) out = `${(v / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) out = `${(v / 1_000).toFixed(1)}K`;
  else out = `${Math.round(v)}`;
  return `${sym} ${out}`.trim();
};

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-[#E3E3E4] rounded-lg shadow-lg">
        <p className="font-bold text-[#161823] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#8A8B91] capitalize">{entry.name}:</span>
            <span className="font-semibold text-[#161823]">
              {entry.name === 'gmv' || entry.name === 'revenue'
                ? money(entry.value, currency)
                : Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, percent, icon: Icon, subtitle }) => {
  const up = Number(percent) >= 0;
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E3E3E4] shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] flex items-center justify-center text-[#161823]">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${up ? 'bg-[#E6F8F1] text-[#10B981]' : 'bg-[#FEECEF] text-[#FE2C55]'}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(Number(percent || 0))}%
        </div>
      </div>
      <div>
        <h3 className="text-[#8A8B91] text-sm font-semibold mb-1">{title}</h3>
        <div className="text-2xl font-black text-[#161823] tracking-tight">{value}</div>
        <p className="text-[#8A8B91] text-xs mt-2 font-medium">{subtitle}</p>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30D');
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res  = await fetch(`/api/admin/stats?range=${timeRange}`);
        const json = await res.json();
        if (!alive) return;
        if (json.success) setStats(json.stats);
        else setError(json.error || 'Failed to load analytics.');
      } catch {
        if (alive) setError('Failed to load analytics.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [timeRange]);

  const currency = stats?.currency || 'UGX';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#161823] font-sans p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#161823]">Platform Analytics</h1>
            <p className="text-[#8A8B91] text-sm mt-1 font-medium">Live overview of marketplace performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E3E3E4] rounded-lg p-1 shadow-sm">
              {['7D', '30D', '3M', '1Y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${timeRange === range ? 'bg-[#161823] text-white shadow' : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F9FA]'}`}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#8A8B91]">
            <Loader2 size={28} className="animate-spin mb-3" />
            <p className="text-sm font-medium">Loading live analytics…</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-[#E3E3E4] rounded-2xl p-10 text-center text-[#FE2C55] font-semibold">{error}</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <StatCard title="Total GMV" value={money(stats.gmv, currency)} percent={stats.trends?.gmv} icon={DollarSign} subtitle="Paid orders, selected period" />
              <StatCard title="Platform Revenue" value={money(stats.revenue, currency)} percent={stats.trends?.revenue} icon={Activity} subtitle={`${stats.commissionRate}% take rate`} />
              <StatCard title="Active Buyers" value={Number(stats.activeBuyers).toLocaleString()} percent={stats.trends?.buyers} icon={Users} subtitle="Buyers with ≥ 1 paid order" />
              <StatCard title="Vendors" value={Number(stats.vendors).toLocaleString()} percent={0} icon={Store} subtitle="Registered stores" />
            </div>

            {/* Trend + status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#161823]">GMV &amp; Revenue Trend</h2>
                    <p className="text-[#8A8B91] text-xs mt-1">Gross merchandise value vs platform fee revenue.</p>
                  </div>
                  <button className="p-2 text-[#8A8B91] hover:text-[#161823] rounded-md hover:bg-[#F8F9FA] transition-colors"><MoreHorizontal size={20} /></button>
                </div>
                <div className="h-[350px] w-full">
                  {stats.revenueTrend?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#161823" stopOpacity={0.3} /><stop offset="95%" stopColor="#161823" stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FE2C55" stopOpacity={0.3} /><stop offset="95%" stopColor="#FE2C55" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E3E3E4" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} tickFormatter={(val) => money(val, currency)} width={70} />
                        <Tooltip content={<CustomTooltip currency={currency} />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="gmv" name="Gross Volume (GMV)" stroke="#161823" fillOpacity={1} fill="url(#colorGmv)" />
                        <Area type="monotone" dataKey="revenue" name="Platform Revenue" stroke="#FE2C55" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="No paid orders in this period yet." />}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-[#161823]">Orders by Status</h2>
                  <button className="p-2 text-[#8A8B91] hover:text-[#161823] rounded-md hover:bg-[#F8F9FA] transition-colors"><Filter size={18} /></button>
                </div>
                <div className="flex-1 flex flex-col justify-center min-h-[300px]">
                  {stats.statusBreakdown?.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={stats.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} label={(e) => e.name}>
                          {stats.statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="No orders yet." />}
                </div>
              </div>
            </div>

            {/* User growth + top vendors */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E3E3E4] shadow-sm">
                <h2 className="text-lg font-bold text-[#161823] mb-6">User Acquisition</h2>
                <div className="h-[280px] w-full">
                  {stats.userGrowth?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.userGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E3E3E4" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8B91' }} />
                        <Tooltip content={<CustomTooltip currency={currency} />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="buyers" name="Buyers" stroke="#161823" dot={{ fill: '#ffffff' }} activeDot={{ stroke: '#ffffff', r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="vendors" name="Vendors" stroke="#3B82F6" dot={{ fill: '#ffffff' }} activeDot={{ stroke: '#ffffff', r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="No sign-ups yet." />}
                </div>
              </div>

              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E3E3E4] shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-[#E3E3E4] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#161823]">Top Performing Vendors</h2>
                    <p className="text-[#8A8B91] text-xs mt-1">Ranked by paid revenue generated.</p>
                  </div>
                  <a href="/admin/stores" className="text-sm font-bold text-[#161823] hover:text-[#FE2C55] transition-colors flex items-center gap-1">View All <ArrowUpRight size={16} /></a>
                </div>
                <div className="overflow-x-auto">
                  {stats.topVendors?.length ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8F9FA] text-[#8A8B91] text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold">Vendor</th>
                          <th className="px-6 py-4 font-bold">Category</th>
                          <th className="px-6 py-4 font-bold">Units Sold</th>
                          <th className="px-6 py-4 font-bold text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3E3E4]">
                        {stats.topVendors.map((vendor) => (
                          <tr key={vendor.id} className="hover:bg-[#F8F9FA] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#161823] to-[#4A4B55] text-white flex items-center justify-center font-bold text-sm shadow-sm">{vendor.name.charAt(0)}</div>
                                <div>
                                  <p className="font-bold text-[#161823] text-sm">{vendor.name}</p>
                                  <p className="text-xs text-[#8A8B91] font-medium">{vendor.orders} orders</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F2F2F3] text-[#5A5B60] capitalize">{vendor.category}</span></td>
                            <td className="px-6 py-4 font-bold text-[#161823] text-sm">{Number(vendor.sales).toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold text-[#161823] text-sm text-right">{money(vendor.revenue, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="p-10 text-center text-[#8A8B91] text-sm">No vendor sales yet.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const EmptyChart = ({ label }) => (
  <div className="h-full w-full flex items-center justify-center text-[#8A8B91] text-sm font-medium">{label}</div>
);
