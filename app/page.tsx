"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import TopNav from './components/shared/TopNav';
import SearchHeader from './components/shared/SearchHeader';
import ProductsView from './components/marketplace/ProductsView';
import StoresView from './components/marketplace/StoresView';
import Storefront from './components/storefronts/Storefront';
import CategoryListingView from './components/marketplace/CategoryListingView';

function MarketplaceContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state directly from the URL parameters
  const urlTab = searchParams.get('tab') || "Products";
  const urlCategory = searchParams.get('category') || null;

  const [view, setView] = useState("marketplace"); // "marketplace" | "storefront"
  const [activeTab, setActiveTab] = useState(urlTab);
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [selectedStore, setSelectedStore] = useState(null);

  // Sync state if the user navigates using Browser Back/Forward buttons
  useEffect(() => {
    const currentUrlTab = searchParams.get('tab') || "Products";
    const currentUrlCategory = searchParams.get('category') || null;

    if (activeTab !== currentUrlTab) setActiveTab(currentUrlTab);
    if (activeCategory !== currentUrlCategory) setActiveCategory(currentUrlCategory);
  }, [searchParams]);

  const handleVisitStore = (store) => {
    setSelectedStore(store);
    setView("storefront");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for switching between Products and Stores tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);

    if (tab === "Stores") {
      setActiveCategory(null);
      params.delete('category'); // Clear category param if switching to stores
    }

    // Update the browser URL
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handler for when a category is clicked anywhere (TopNav or ProductsView)
  const handleCategorySelect = (slug) => {
    setActiveCategory(slug);
    setActiveTab("Products");
    setView("marketplace");

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'Products');
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }

    // Update the browser URL
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render dynamic storefront if a store is selected
  if (view === "storefront" && selectedStore) {
    return <Storefront store={selectedStore} onBack={() => { setView("marketplace"); window.scrollTo(0,0); }} />;
  }

  // Render marketplace home
  return (
    <div className="font-sans text-gray-800 flex flex-col min-h-screen">
      <div className={`transition-colors duration-500 relative ${activeTab === 'Products' ? 'bg-gradient-to-tr from-white via-white to-[#fff0f4] animate-bg-gradient' : 'bg-gradient-to-br from-white via-white to-red-50'}`}>
        <TopNav />

        {/* Hide SearchHeader when browsing a specific category */}
        {!activeCategory && (
          <SearchHeader
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        )}
      </div>

      {/* Conditionally render the views based on active tab & selected category */}
      {activeCategory ? (
        <CategoryListingView initialCategory={activeCategory} />
      ) : activeTab === "Products" ? (
        <ProductsView onCategorySelect={handleCategorySelect} />
      ) : (
        <StoresView onVisitStore={handleVisitStore} />
      )}

      <footer className="bg-white border-t border-gray-200 pt-10 pb-6 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between pt-6">
           <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium mb-4 md:mb-0">
              <span className="cursor-pointer hover:text-[#FE2C55]">Ola.com Site</span><span>|</span>
              <span className="cursor-pointer hover:text-[#FE2C55]">Site Map</span><span>|</span>
              <span className="cursor-pointer hover:text-[#FE2C55]">Terms of Use</span>
           </div>
           <div className="text-[13px] text-gray-500 font-medium">© 2026 Ola.com. All rights reserved.</div>
        </div>
      </footer>

      {/* Global CSS for scrollbars and animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-bg-gradient { background-size: 200% 200%; animation: gradientMove 15s ease-in-out infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}

// Wrap the main content in a Suspense boundary (Required by Next.js when using useSearchParams)
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FE2C55]/30 border-t-[#FE2C55] rounded-full animate-spin"></div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}