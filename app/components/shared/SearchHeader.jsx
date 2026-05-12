import React from 'react';
import { Search, Camera, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

const SearchHeader = ({ activeTab, setActiveTab }) => {
  const tabs = ["Products", "Stores"];

  return (
    <div className="w-full pt-6 pb-12 md:pt-10 md:pb-16 relative">
      <div className="max-w-[1400px] mx-auto px-4 flex flex-col items-center">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mb-8 w-full max-w-4xl px-1 overflow-x-auto hide-scrollbar">
          <span className="text-gray-900 font-extrabold text-[20px] md:text-[26px] flex items-center gap-1 cursor-pointer shrink-0">
            AI Mode <span className="text-[#FE2C55] text-[16px] self-start mt-0.5 md:mt-1">✦</span>
          </span>
          <span className="text-gray-200 shrink-0 h-6 w-px bg-gray-300 block"></span>
          <div className="flex gap-6 md:gap-10 shrink-0">
            {tabs.map((tab) => (
              <span 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-extrabold text-[20px] md:text-[26px] cursor-pointer transition-all ${
                  activeTab === tab ? "text-[#FE2C55] border-b-[3px] border-[#FE2C55] pb-1" : "text-gray-800 hover:text-[#FE2C55]"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-[850px] relative">
          <div className="flex flex-col w-full border-[2px] md:border-[3px] border-[#FE2C55] rounded-[24px] bg-white transition-shadow focus-within:ring-8 focus-within:ring-[#FE2C55]/10 shadow-[0_10px_30px_rgb(0,0,0,0.05)] p-4 md:p-5 h-[130px] md:h-[150px] justify-between">
            <input 
              type="text" 
              placeholder={activeTab === "Stores" ? "Search for verified stores..." : "Search products..."} 
              className="w-full px-2 outline-none text-gray-800 font-medium text-[16px] md:text-[18px] bg-transparent placeholder-gray-500"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-gray-800 hover:text-[#FE2C55] transition-colors font-bold text-[13px] md:text-[15px]">
                  <Camera size={20} strokeWidth={2.5} /> <span className="hidden sm:inline">Image Search</span>
                </button>
                {activeTab === "Stores" && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button className="flex items-center gap-2 text-gray-800 hover:text-[#FE2C55] transition-colors font-bold text-[13px] md:text-[15px]">
                      <FileText size={20} strokeWidth={2.5} /> <span className="hidden sm:inline">Search with File</span>
                    </button>
                  </>
                )}
              </div>
              <button className="bg-[#FE2C55] hover:bg-[#E0264A] text-white font-bold text-[16px] md:text-[18px] px-8 md:px-12 h-[44px] md:h-[50px] rounded-full flex items-center gap-2 transition-colors shadow-sm">
                <Search size={20} strokeWidth={2.5} /> <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Connect String for Stores */}
        {activeTab === "Stores" && (
          <div className="mt-6 text-center animate-fade-in">
            <h3 className="text-[16px] md:text-[18px] font-extrabold text-gray-900 flex items-center justify-center gap-2 mb-2">
              Connect with 34K+ <span className="text-[#25F4EE] flex items-center gap-1"><ShieldCheck size={18} fill="#25F4EE" className="text-white"/> Verified</span> stores
            </h3>
            <div className="flex flex-wrap justify-center gap-4 text-[12px] text-gray-500 font-medium">
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-gray-400"/> 5K+ industries covered</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-gray-400"/> Factory-direct pricing</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-gray-400"/> Sample & customization available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHeader;