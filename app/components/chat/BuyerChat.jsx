import React, { useState } from 'react';
import { 
  MessageSquare, ClipboardList, DollarSign, Heart, Bookmark, 
  Package, Box, Grid, MoreHorizontal, User, ChevronRight, 
  Search, ShieldCheck, Phone, Video, Smile, Image as ImageIcon, 
  Folder, Paperclip, MoreVertical, Send
} from 'lucide-react';

// --- MOCK DATA ---
const CHAT_LIST = [
  { id: 1, name: 'Fiona Ms', company: 'Hebei Rongztai Metal W...', preview: 'you want blackout or semi-bl...', date: '2026-04-09', unread: false, avatar: 'F' },
  { id: 2, name: 'Cathy Xu', company: 'Changzhou Newdoon Po...', preview: 'Hi! May I know the dropout a...', date: '2026-04-05', unread: true, avatar: 'C' },
  { id: 3, name: 'Joe Hu', company: 'Leading', preview: '[Video]', date: '2026-03-24', unread: false, avatar: 'J', isBrand: true },
  { id: 4, name: 'pang xiao', company: 'GuangDong Meizhou Cit...', preview: 'Thank you.', date: '2026-02-20', unread: false, avatar: 'P' },
  { id: 5, name: 'bai wei', company: 'GuangDong Meizhou Cit...', preview: '[Read] EOS 2011', date: '2026-02-20', unread: false, avatar: 'B', isBrand: true },
  { id: 6, name: 'Yuko Xuan', company: 'Guangzhou Vigor Health...', preview: 'Ok dear', date: '2026-02-18', unread: false, avatar: 'Y' },
];

const MESSAGES = [
  { id: 1, text: 'hi', sender: 'them', time: '2026-04-09 04:16' },
  { id: 2, text: 'hi', sender: 'me', time: '2026-04-08 21:54', read: true },
  { id: 3, text: 'you need honeycomb fabric?', sender: 'them', time: '2026-04-09 05:12' },
  { id: 4, text: 'you want blackout or semi-black?', sender: 'them', time: '2026-04-09 05:12' },
];

// ==========================================
// 1. SIDE NAVIGATION (From Screenshot 1)
// ==========================================
const SideNavigation = () => {
  return (
    <div className="w-[280px] h-full bg-[#F5F6F8] border-r border-gray-200 flex flex-col overflow-y-auto p-4 flex-shrink-0">
      
      {/* Messages (Active Card) */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between mb-3 shadow-sm cursor-pointer border border-gray-100">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-black fill-black" />
          <span className="font-bold text-[15px] text-black">Messages</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Orders (Gray Card) */}
      <div className="bg-[#EAECEF] rounded-xl p-4 flex items-center justify-between mb-6 cursor-pointer hover:bg-[#e1e4e8] transition-colors">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-gray-700" />
          <span className="text-[15px] text-gray-800">Orders</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Main Menu Group */}
      <div className="bg-transparent space-y-1 mb-6">
        <MenuItem icon={<DollarSign size={20} />} label="Payment" />
        <MenuItem icon={<Heart size={20} />} label="Saved & history" />
      </div>

      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mb-6">
        <MenuItem icon={<Bookmark size={20} />} label="Subscription" badge="New" />
        <MenuItem icon={<Package size={20} />} label="Logistics services" />
        <MenuItem icon={<Box size={20} />} label="Reseller Hub" />
        <MenuItem icon={<Grid size={20} />} label="More services" />
      </div>

      {/* Footer Group */}
      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mt-auto">
        <MenuItem icon={<User size={20} />} label="Account settings" hideChevron />
      </div>

    </div>
  );
};

const MenuItem = ({ icon, label, badge, hideChevron }) => (
  <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="text-gray-600 group-hover:text-black transition-colors">{icon}</div>
      <span className="text-[15px] text-gray-700 group-hover:text-black transition-colors">{label}</span>
      {badge && (
        <span className="text-[11px] font-bold text-[#E53935] ml-1">{badge}</span>
      )}
    </div>
    {!hideChevron && <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />}
  </div>
);


// ==========================================
// 2. CHAT INBOX LIST (From Screenshot 2)
// ==========================================
const ChatInbox = () => {
  return (
    <div className="w-[320px] h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      
      {/* Header & Search */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[16px] text-gray-900">Inbox</h2>
          <div className="bg-gray-100 rounded-full p-1.5 cursor-pointer hover:bg-gray-200">
            <Search size={16} className="text-gray-600" />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center justify-between text-[13px] font-medium">
          <div className="flex gap-6">
            <div className="flex items-center gap-1 cursor-pointer border-b-2 border-black pb-2 text-black font-bold">
              <MessageSquare size={14} className="fill-black" /> All
            </div>
            <div className="flex items-center gap-1 cursor-pointer border-b-2 border-transparent pb-2 text-gray-500 hover:text-gray-800">
              <span className="relative">
                Unread
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </span>
            </div>
          </div>
          <span className="text-gray-400 pb-2">143</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {CHAT_LIST.map((chat, idx) => (
          <div 
            key={chat.id} 
            className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${idx === 0 ? 'bg-[#F3F4F6]' : 'hover:bg-gray-50 border-b border-gray-50'}`}
          >
            <div className="relative">
              {chat.isBrand ? (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
                  {chat.avatar}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {chat.avatar}
                </div>
              )}
              {idx === 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className="text-[14px] font-bold text-gray-900 truncate pr-2">{chat.name}</h4>
                <span className="text-[11px] text-gray-400 flex-shrink-0">{chat.date}</span>
              </div>
              <p className="text-[12px] text-gray-500 truncate mb-0.5">{chat.company}</p>
              <p className="text-[12px] text-gray-800 truncate">{chat.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// 3. MAIN CHAT AREA (From Screenshot 2)
// ==========================================
const ChatArea = () => {
  const [inputText, setInputText] = useState('');

  return (
    <div className="flex-1 h-full bg-[#F8F9FA] flex flex-col relative">
      
      {/* Header */}
      <div className="h-[60px] bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[16px] text-gray-900">Fiona Ms</h2>
          <span className="text-gray-400 text-[12px] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            12:03 AM Local Time
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <Phone size={18} className="cursor-pointer hover:text-gray-800" />
          <Video size={18} className="cursor-pointer hover:text-gray-800" />
          <User size={18} className="cursor-pointer hover:text-gray-800" />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* Trust Notice */}
        <div className="mx-auto bg-[#F0FDF4] border border-[#BBF7D0] rounded-md py-2.5 px-4 flex items-center gap-2 mb-8 shadow-sm">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-[13px] text-gray-800">
            Keep chats and transactions on Alibaba.com to enjoy order protection. <a href="#" className="text-gray-900 underline">Learn more</a>
          </span>
        </div>

        {/* Messages */}
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          
          <div className="flex flex-col items-center gap-6">
            <span className="text-[11px] text-gray-400">2026-04-08 21:54</span>
            <div className="flex items-start gap-3 w-full flex-row-reverse">
               <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold flex-shrink-0">
                 ME
               </div>
               <div className="flex flex-col items-end">
                 <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tr-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                   hi
                 </div>
                 <span className="text-[11px] text-gray-400 mt-1">Read</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6">
            <span className="text-[11px] text-gray-400 self-center">2026-04-09 04:16</span>
            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 hi
               </div>
            </div>
          </div>

          {/* Translation Notice */}
          <div className="mx-auto bg-white border border-gray-100 rounded-full py-2 px-6 shadow-sm text-[12px] text-gray-500 my-2">
            Need translation? Try our automatic translation feature for smoother communication. <a href="#" className="text-blue-600 font-medium">Try now</a>
          </div>

          <div className="flex flex-col items-start gap-6">
            <span className="text-[11px] text-gray-400 self-center">2026-04-09 05:12</span>
            
            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 you need honeycomb fabric?
               </div>
            </div>

            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 opacity-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 you want blackout or semi-black?
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0 relative">
        
        {/* Quick Action Chips */}
        <div className="absolute -top-12 left-0 w-full px-6 flex gap-3 overflow-x-auto hide-scrollbar pointer-events-none">
           <div className="pointer-events-auto flex gap-2">
             {['Rate supplier', 'Send order request', 'View all payment options', 'File a complaint', 'Logistics Inquiry'].map((chip, i) => (
                <button key={i} className="bg-white border border-gray-200 shadow-sm rounded-full px-4 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors whitespace-nowrap">
                  {chip}
                </button>
             ))}
           </div>
        </div>

        <div className="p-4 flex flex-col h-[160px]">
          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-3 text-gray-500">
             <Smile size={18} className="cursor-pointer hover:text-gray-800" />
             <ImageIcon size={18} className="cursor-pointer hover:text-gray-800" />
             <Folder size={18} className="cursor-pointer hover:text-gray-800" />
             <Paperclip size={18} className="cursor-pointer hover:text-gray-800" />
             <Phone size={18} className="cursor-pointer hover:text-gray-800" />
             <div className="h-4 w-px bg-gray-300 mx-1"></div>
             <MoreVertical size={18} className="cursor-pointer hover:text-gray-800" />
          </div>

          {/* Text Area */}
          <textarea 
            placeholder="Please enter your message here"
            className="w-full flex-1 resize-none outline-none text-[14px] text-gray-800 placeholder-gray-400 bg-transparent"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>

          {/* Send Button Row */}
          <div className="flex justify-end items-center gap-4 mt-2">
            <span className="text-[12px] text-gray-400">Press "Enter" to send</span>
            <button 
              className={`px-8 py-2 rounded-full text-[13px] font-bold transition-colors ${
                inputText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MAIN EXPORT (3-Pane Layout)
// ==========================================
export default function BuyerChat() {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      <SideNavigation />
      <ChatInbox />
      <ChatArea />
    </div>
  );
}