"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

// --- Original 7 Variants ---
import ClassicStore from './variants/ClassicStore';
import ModernStore from './variants/ModernStore';
import BoldStore from './variants/BoldStore';
import FurnitureStore from './variants/FurnitureStore';
import ApparelStore from './variants/ApparelStore';
import BeautyStore from './variants/BeautyStore';
import MinimalStore from './variants/MinimalStore';

// --- Previous 3 Additions ---
import TechStore from './variants/TechStore';
import MarketStore from './variants/MarketStore';
import LuxuryStore from './variants/LuxuryStore';

// --- 10 New Industry-Specific Variants ---
import AutoStore from './variants/AutoStore';           // Car sales, dealerships
import CampusStore from './variants/CampusStore';       // School/University merchandise
import HotelStore from './variants/HotelStore';         // Hotel bookings, hospitality
import DigitalStore from './variants/DigitalStore';     // Software, courses, digital downloads
import PropertyStore from './variants/PropertyStore';   // Real estate, apartment listings
import CafeStore from './variants/CafeStore';           // Restaurants, food delivery, coffee shops
import FitnessStore from './variants/FitnessStore';     // Gym gear, supplements, memberships
import PetStore from './variants/PetStore';             // Pet supplies and accessories
import BookStore from './variants/BookStore';           // Books, publishing, magazines
import ArtStore from './variants/ArtStore';             // Art galleries, prints, sculptures

const Storefront = ({ store: initialStore, onBack }) => {
  const productsRef = useRef(null);
  const contactRef = useRef(null);

  const [fetchedProducts, setFetchedProducts] = useState(initialStore?.products || []);
  const [isLoadingProducts, setIsLoadingProducts] = useState(!initialStore?.products?.length);

  useEffect(() => {
    const fetchStoreProducts = async () => {
      if (!initialStore?._id && !initialStore?.domain) {
        setIsLoadingProducts(false);
        return;
      }

      try {
        setIsLoadingProducts(true);
        const query = initialStore._id ? `storeId=${initialStore._id}` : `domain=${initialStore.domain}`;
        const response = await fetch(`/api/products?${query}&limit=100`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        const result = await response.json();

        if (result.success) {
          setFetchedProducts(result.data?.products || result.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch store products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchStoreProducts();
  }, [initialStore?._id, initialStore?.domain]);

  if (!initialStore) return null;

  const activeStore = {
    ...initialStore,
    products: fetchedProducts.length > 0 ? fetchedProducts : (initialStore.products || []),
    categories: initialStore.categories?.length > 0 ? initialStore.categories : ['Featured', 'New Arrivals', 'Trending']
  };

  const bgThemeStyle = { backgroundColor: activeStore.themeColor || '#000' };
  const themeStyle = { color: activeStore.themeColor || '#000' };

  const renderStoreVariant = () => {
    const props = { 
      store: activeStore, 
      bgThemeStyle, 
      themeStyle, 
      productsRef, 
      contactRef, 
      isLoadingProducts,
      onBack
    };
    
    switch (activeStore.layoutStyle?.toLowerCase()) {
      // Original 10
      case 'modern': return <ModernStore {...props} />;
      case 'bold': return <BoldStore {...props} />;
      case 'furniture': return <FurnitureStore {...props} />;
      case 'apparel': return <ApparelStore {...props} />;
      case 'beauty': return <BeautyStore {...props} />;
      case 'minimal': return <MinimalStore {...props} />;
      case 'tech': return <TechStore {...props} />;
      case 'market': return <MarketStore {...props} />;
      case 'luxury': return <LuxuryStore {...props} />;
      
      // 10 New Variants (with fallbacks for similar terms)
      case 'auto':
      case 'cars': return <AutoStore {...props} />;
      
      case 'school':
      case 'campus': return <CampusStore {...props} />;
      
      case 'hotel':
      case 'booking': return <HotelStore {...props} />;
      
      case 'digital':
      case 'software': return <DigitalStore {...props} />;
      
      case 'property':
      case 'realestate': return <PropertyStore {...props} />;
      
      case 'cafe':
      case 'restaurant': return <CafeStore {...props} />;
      
      case 'fitness':
      case 'gym': return <FitnessStore {...props} />;
      
      case 'pet': return <PetStore {...props} />;
      
      case 'book': return <BookStore {...props} />;
      
      case 'art':
      case 'gallery': return <ArtStore {...props} />;
      
      // Default Fallback
      case 'classic':
      default: return <ClassicStore {...props} />;
    }
  };

  return (
    <div className="w-full min-h-screen relative bg-white">
      {onBack && (
        <button 
          onClick={onBack} 
          className="fixed top-5 left-5 z-[999] p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all shadow-lg"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {renderStoreVariant()}
    </div>
  );
};

export default Storefront;