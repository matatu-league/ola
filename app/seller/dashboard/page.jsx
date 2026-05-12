import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Users, ArrowUpRight, Clock, CheckCircle2, ChevronRight, Circle, Image as ImageIcon, MapPin, PackagePlus, Store } from 'lucide-react';

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

export default function SellerDashboard() {
  // Mock Data for Recent Orders
  const recentOrders = [
    { id: '#ORD-001', customer: 'Sarah Jenkins', product: 'Minimalist Desk Lamp', amount: '$45.00', status: 'Completed', date: 'Today, 2:30 PM' },
    { id: '#ORD-002', customer: 'Michael Chen', product: 'Ergonomic Office Chair', amount: '$199.99', status: 'Processing', date: 'Today, 11:15 AM' },
    { id: '#ORD-003', customer: 'Emma Watson', product: 'Wireless Mechanical Keyboard', amount: '$120.00', status: 'Pending', date: 'Yesterday' },
    { id: '#ORD-004', customer: 'David Miller', product: 'Noise Cancelling Headphones', amount: '$250.00', status: 'Completed', date: 'Yesterday' },
  ];

  // Setup Progress Tasks Mock Data
  const setupTasks = [
    { id: 1, title: 'Store Details', desc: 'Completed during onboarding', icon: Store, isCompleted: true },
    { id: 2, title: 'Upload Branding', desc: 'Add your store logo and banner', icon: ImageIcon, isCompleted: false },
    { id: 3, title: 'Set Location', desc: 'Add business address details', icon: MapPin, isCompleted: false },
    { id: 4, title: 'Add First Product', desc: 'Start selling items to customers', icon: PackagePlus, isCompleted: false },
  ];
  
  const completedTasks = setupTasks.filter(t => t.isCompleted).length;
  const progressPercentage = (completedTasks / setupTasks.length) * 100;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Welcome Banner - Flat Dark Mode */}
      <div className="bg-[#161823] rounded-sm p-6 lg:p-8 mb-6 text-white relative overflow-hidden border border-[#161823]">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome back to your dashboard.</h2>
          <p className="text-[#8A8B91] text-[13px] font-medium leading-relaxed">Your store views are up 14% today. Keep up the great work and consider fulfilling your pending orders.</p>
        </div>
        {/* Subtle decorative accent */}
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#FE2C55]/20 to-transparent pointer-events-none"></div>
      </div>

      {/* NEW: Store Setup Progress */}
      <div className="bg-white rounded-sm border border-[#E3E3E4] mb-6 p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-[#161823] text-sm">Complete your store setup</h3>
            <p className="text-[12px] text-[#8A8B91] mt-0.5">{completedTasks} of {setupTasks.length} tasks completed</p>
          </div>
          <div className="text-[13px] font-bold text-[#161823]">{progressPercentage}%</div>
        </div>
        
        <div className="w-full h-1.5 bg-[#F8F8F8] rounded-sm overflow-hidden mb-5 border border-[#E3E3E4]">
          <div className="h-full bg-[#161823] transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {setupTasks.map((task) => (
            <div 
              key={task.id}
              className={`relative p-4 rounded-sm border transition-colors flex flex-col group ${
                task.isCompleted 
                  ? 'bg-[#F8F8F8] border-[#E3E3E4]' 
                  : 'bg-white border-[#E3E3E4] hover:border-[#161823] cursor-pointer shadow-sm hover:shadow-none'
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
              <p className={`text-[11px] leading-relaxed ${task.isCompleted ? 'text-[#8A8B91]' : 'text-[#8A8B91]'}`}>
                {task.desc}
              </p>
              
              {!task.isCompleted && (
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#161823] group-hover:text-[#FE2C55] transition-colors mt-auto">
                  Complete Task <ChevronRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value="$12,450.00" change={12.5} isPositive={true} icon={DollarSign} />
        <StatCard title="Active Orders" value="42" change={4.2} isPositive={true} icon={ShoppingBag} />
        <StatCard title="Store Views" value="3,214" change={1.4} isPositive={false} icon={Users} />
        <StatCard title="Conversion Rate" value="3.8%" change={0.8} isPositive={true} icon={TrendingUp} />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-[#E3E3E4] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E3E4] flex items-center justify-between bg-white">
            <h3 className="font-bold text-[#161823] text-sm">Recent Orders</h3>
            <button className="text-[12px] font-bold text-[#161823] hover:text-[#FE2C55] transition-colors">View All</button>
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

        {/* Right Column: Quick Actions & Alerts */}
        <div className="space-y-4">
          {/* Action Required Card */}
          <div className="bg-[#FFFBEB] rounded-sm border border-[#FCD34D] p-5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#F59E0B]"></div>
             <h3 className="font-bold text-[#D97706] mb-1.5 text-sm">Action Required</h3>
             <p className="text-[13px] text-[#92400E] mb-4 leading-relaxed font-medium">You have 3 pending orders that need to be shipped within 24 hours.</p>
             <button className="w-full bg-[#161823] hover:bg-[#333540] text-white font-bold py-2 rounded-sm transition-colors text-[13px]">
               Process Orders
             </button>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-sm border border-[#E3E3E4] p-5">
            <h3 className="font-bold text-[#161823] mb-3 text-sm">Quick Shortcuts</h3>
            <div className="space-y-1">
              {['Add New Product', 'Edit Store Profile', 'View Analytics', 'Marketing Campaigns'].map((link, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-sm hover:bg-[#F8F8F8] cursor-pointer group transition-colors border border-transparent hover:border-[#E3E3E4]">
                  <span className="text-[13px] font-semibold text-[#161823] group-hover:text-[#FE2C55] transition-colors">{link}</span>
                  <ChevronRight size={14} className="text-[#8A8B91] group-hover:text-[#FE2C55] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}