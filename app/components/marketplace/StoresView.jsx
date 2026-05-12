import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, Camera } from 'lucide-react';

const StoresView = ({ onVisitStore }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores',{
          headers: {
            'ngrok-skip-browser-warning': 'true', 
          },
        });
        const result = await response.json();
        
        if (result.success) {
          setStores(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch stores. Is your backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading Stores Directory...</div>;
  }

  if (error) {
    return <div className="text-center py-20 font-bold text-red-500">{error}</div>;
  }

  return (
    <div className="bg-[#f2f2f6] min-h-screen pb-16">
      <div className="max-w-[1400px] mx-auto px-4 mt-6 md:mt-8">
        <div className="flex flex-col gap-4">
          {stores.map((store) => (
            <div key={store._id || store.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6 border border-transparent hover:border-gray-200">
              
              {/* Left Details */}
              <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  {/* UPDATED: Conditionally render Logo or Initial Placeholder */}
                  <div className="bg-[#f7f8fa] rounded w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                    {store.logo ? (
                      <img src={store.logo} alt={store.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-blue-700 text-lg leading-none">{store.title?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] text-black hover:text-[#FE2C55] cursor-pointer underline-offset-2 hover:underline leading-snug mb-1" onClick={() => onVisitStore(store)}>
                      {store.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-[11px] text-gray-500 font-medium">
                      {store.verified && <span className="text-[#25F4EE] font-bold flex items-center gap-0.5"><ShieldCheck size={12}/> Verified</span>}
                      <span>{store.years} yrs</span>
                      <span>·</span>
                      <span>{store.staff}</span>
                      <span>·</span>
                      <span>{store.revenue}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex-1">
                  <div className="text-[12px] text-gray-500 mb-2">Capabilities</div>
                  <ul className="text-[12px] text-black font-bold space-y-1.5">
                    {store.capabilities?.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{cap.label} {cap.value && <span className="font-medium text-gray-600 ml-1">{cap.value}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Mobile Button */}
                <div className="flex items-center gap-3 mt-auto lg:hidden pt-4">
                   <button onClick={() => onVisitStore(store)} className="flex-1 rounded-full py-2 font-bold text-[13px] text-white transition-opacity hover:opacity-90 shadow-md" style={{ backgroundColor: store.themeColor || '#000' }}>
                     Visit Store
                   </button>
                </div>
              </div>
              
              {/* Right Products/Gallery */}
              <div className="w-full lg:w-[65%] xl:w-[70%] flex flex-col">
                 <div className="hidden lg:flex items-center justify-end gap-3 mb-4">
                   <button onClick={() => onVisitStore(store)} className="rounded-full px-8 py-2 font-bold text-[14px] text-white transition-transform hover:scale-105 shadow-md flex items-center gap-2" style={{ backgroundColor: store.themeColor || '#000' }}>
                     Visit Store <ChevronRight size={16}/>
                   </button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-1">
                   {store.products?.slice(0, 3).map((prod, i) => (
                     <div key={i} className="flex flex-col cursor-pointer group">
                       <div className="bg-[#f7f8fa] rounded-lg aspect-square mb-2 p-3 flex items-center justify-center relative overflow-hidden group-hover:bg-gray-100 transition">
                         <img src={prod.image} className="w-full h-full object-cover rounded mix-blend-multiply group-hover:scale-105 transition duration-500" alt="Product" />
                       </div>
                       <div className="font-extrabold text-black text-[13px] leading-tight mb-1">{prod.price}</div>
                       <div className="text-[11px] text-gray-500 font-medium">Min. order: {prod.moq}</div>
                     </div>
                   ))}
                   {store.gallery && (
                     <div className="relative rounded-lg overflow-hidden cursor-pointer group aspect-square md:aspect-auto">
                       <img src={store.gallery.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Gallery" />
                       <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-300"></div>
                       <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                         <Camera size={12}/> {store.gallery.count}
                       </div>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoresView;