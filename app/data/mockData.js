// 1. EXTRACTED CATEGORIES JSON DATA (1-Level Hierarchy)
export const marketplaceCategories = [
  { 
    name: "Vehicles", slug: "vehicles", image: "https://assets.jijistatic.com/art/attributes/categories/vehicles-x3.png", 
    subCategories: [
      { name: "Vehicle Parts & Accessories", slug: "car-parts-and-accessories" },
      { name: "Cars", slug: "cars" },
      { name: "Motorcycles & Scooters", slug: "motorcycles-and-scooters" },
      { name: "Buses & Microbuses", slug: "buses" },
      { name: "Trucks & Trailers", slug: "trucks-commercial-agricultiral" },
      { name: "Construction & Heavy Machinery", slug: "heavy-equipments-machinery" },
      { name: "Watercraft & Boats", slug: "watercrafts-vehicle" }
    ]
  },
  { 
    name: "Property", slug: "real-estate", image: "https://assets.jijistatic.com/art/attributes/categories/property-x3.png",
    subCategories: [
      { name: "New Builds", slug: "new-builds" },
      { name: "Houses & Apartments For Rent", slug: "houses-apartments-for-rent" },
      { name: "Houses & Apartments For Sale", slug: "houses-apartments-for-sale" },
      { name: "Short Let", slug: "temporary-and-vacation-rentals" },
      { name: "Land & Plots for Rent", slug: "land-and-plots-for-rent" },
      { name: "Land & Plots For Sale", slug: "land-and-plots-for-sale" },
      { name: "Event Centres, Venues & Workstations", slug: "event-centers-and-venues", kind: "service", serviceType: "venue" },
      { name: "Commercial Property For Rent", slug: "commercial-property-for-rent" },
      { name: "Commercial Property For Sale", slug: "commercial-properties" }
    ]
  },
  { 
    name: "Phones & Tablets", slug: "mobile-phones-tablets", image: "https://assets.jijistatic.com/art/attributes/categories/phones-x3.png",
    subCategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Accessories for Phones & Tablets", slug: "cell-phones-tablets-accessories" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Tablets", slug: "tablets" }
    ]
  },
  { 
    name: "Electronics", slug: "electronics", image: "https://assets.jijistatic.com/art/attributes/categories/electronics-x3.png",
    subCategories: [
      { name: "Laptops & Computers", slug: "computers-and-laptops" },
      { name: "TV & Video Equipment", slug: "tv-dvd-equipment" },
      { name: "Video Game Consoles", slug: "video-games-and-consoles" },
      { name: "Audio & Music Equipment", slug: "audio-and-music-equipment" },
      { name: "Headphones", slug: "headphones" },
      { name: "Photo & Video Cameras", slug: "cameras-video-cameras-and-accessories" },
      { name: "Security & Surveillance", slug: "security-and-surveillance" },
      { name: "Networking Products", slug: "networking-products" },
      { name: "Printers & Scanners", slug: "printers-and-scanners" },
      { name: "Computer Monitors", slug: "computer-monitors" },
      { name: "Computer Hardware", slug: "computer-hardware" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Software", slug: "computer-software" }
    ]
  },
  { 
    name: "Home, Furniture & Appliances", slug: "home-garden", image: "https://assets.jijistatic.com/art/attributes/categories/home-x3.png",
    subCategories: [
      { name: "Furniture", slug: "furniture" },
      { name: "Lighting", slug: "lighting" },
      { name: "Storage & Organization", slug: "storage-organization" },
      { name: "Home Accessories", slug: "decor-accessories" },
      { name: "Home Appliances", slug: "home-appliances" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Kitchenware & Cookware", slug: "kitchen-and-dining" },
      { name: "Household Chemicals", slug: "household-chemicals" },
      { name: "Garden Supplies", slug: "garden" }
    ]
  },
  { 
    name: "Fashion", slug: "fashion-and-beauty", image: "https://assets.jijistatic.com/art/attributes/categories/fashion-x3.png",
    subCategories: [
      { name: "Women's Clothing", slug: "clothing" },
      { name: "Women's Shoes", slug: "shoes" },
      { name: "Women's Bags", slug: "bags" },
      { name: "Women's Jewelry", slug: "jewellery-and-watches" },
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Men's Shoes", slug: "mens-shoes" },
      { name: "Men's Watches", slug: "mens-watches" },
      { name: "Children's Clothing", slug: "childrens-clothing" },
      { name: "Children's Shoes", slug: "childrens-shoes" }
    ]
  },
  { 
    name: "Beauty & Personal Care", slug: "health-and-beauty", image: "https://assets.jijistatic.com/art/attributes/categories/health-x3.png",
    subCategories: [
      { name: "Hair Beauty", slug: "hair-beauty" },
      { name: "Face Care", slug: "skin-care" },
      { name: "Oral Care", slug: "oral-care" },
      { name: "Body Care", slug: "bath-body" },
      { name: "Fragrance", slug: "fragrance" },
      { name: "Makeup", slug: "makeup" },
      { name: "Sexual Wellness", slug: "sexual-wellness" },
      { name: "Vitamins & Supplements", slug: "supplements" }
    ]
  },
  {
    name: "Services", slug: "services", image: "https://assets.jijistatic.com/art/attributes/categories/services-new-x3.png",
    kind: "service", serviceType: "generic",
    subCategories: [
      // ── Booking-first services (dynamic per-industry fields) ──────────────
      { name: "Hotels & Accommodation",            slug: "hotels",               kind: "service", serviceType: "hotel" },
      { name: "Salon & Spa Booking",               slug: "salon-booking",        kind: "service", serviceType: "salon" },
      { name: "Clinics & Doctor Appointments",     slug: "doctor-appointments",  kind: "service", serviceType: "medical" },
      { name: "Event Tickets",                     slug: "event-tickets",        kind: "service", serviceType: "tickets" },
      { name: "Venue & Event Rentals",             slug: "venue-rentals",        kind: "service", serviceType: "venue" },
      // Schools sell physical items (uniforms, books) yet are a service → both
      { name: "Schools & Education",               slug: "schools",              kind: "both",    serviceType: "school" },
      // ── Professional / trade services (generic booking) ───────────────────
      { name: "Building & Trades Services", slug: "building-and-trades-services", kind: "service", serviceType: "generic" },
      { name: "Car Services",               slug: "automotive-services",         kind: "service", serviceType: "generic" },
      { name: "Computer & IT Services",     slug: "computer-and-it-services",     kind: "service", serviceType: "generic" },
      { name: "Repair Services",            slug: "repair-services",              kind: "service", serviceType: "generic" },
      { name: "Cleaning Services",          slug: "cleaning-services",            kind: "service", serviceType: "generic" },
      { name: "Logistics Services",         slug: "removals-and-storage-services", kind: "service", serviceType: "generic" },
      { name: "Legal Services",             slug: "legal-services",               kind: "service", serviceType: "generic" },
      { name: "Tax & Financial Services",   slug: "tax-and-financial-services",   kind: "service", serviceType: "generic" }
    ]
  },
  { 
    name: "Repair & Construction", slug: "repair-and-construction", image: "https://assets.jijistatic.com/art/attributes/categories/repair-x3.png",
    subCategories: [
      { name: "Electrical Equipment", slug: "power-equipments" },
      { name: "Building Materials & Supplies", slug: "building-materials" },
      { name: "Plumbing & Water Systems", slug: "plumbing-and-water-supply" },
      { name: "Electrical Hand Tools", slug: "power-tools" },
      { name: "Hand Tools", slug: "hand-and-power-tools" },
      { name: "Hardware & Fasteners", slug: "hardware-and-fasteners" },
      { name: "Doors & Security", slug: "doors" },
      { name: "Windows & Glass", slug: "windows" }
    ]
  },
  { 
    name: "Commercial Equipment & Tools", slug: "office-and-commercial-equipment-tools", image: "https://assets.jijistatic.com/art/attributes/categories/equipment-x3.png",
    subCategories: [
      { name: "Medical Equipment & Supplies", slug: "medical-equipment" },
      { name: "Safety Equipment & Protective Gear", slug: "safety-equipment" },
      { name: "Manufacturing Equipment", slug: "manufacturing-equipments" },
      { name: "Retail & Store Equipment", slug: "store-equipments" },
      { name: "Restaurant & Catering Equipment", slug: "restaurant-and-catering-equipment" },
      { name: "Stationery & Office Equipment", slug: "stationery" },
      { name: "Salon & Beauty Equipment", slug: "salon-equipment" }
    ]
  },
  { 
    name: "Leisure & Activities", slug: "hobbies-art-sport", image: "https://assets.jijistatic.com/art/attributes/categories/hobbies-x3.png",
    subCategories: [
      { name: "Sports Equipment", slug: "sports-bicycles-and-fitness" },
      { name: "Massagers", slug: "massagers" },
      { name: "Musical Instruments & Gear", slug: "musical-instruments" },
      { name: "Books & Table Games", slug: "books-and-games" },
      { name: "Arts, Crafts & Awards", slug: "art-collectibles" },
      { name: "Outdoor Gear", slug: "camping-gear" }
    ]
  },
  { 
    name: "Babies & Kids", slug: "babies-and-kids", image: "https://assets.jijistatic.com/art/attributes/categories/babies-x3.png",
    subCategories: [
      { name: "Toys & Games", slug: "toys" },
      { name: "Children's Furniture", slug: "childrens-furniture" },
      { name: "Baby Gear & Equipment", slug: "childrens-gear-and-safety" },
      { name: "Care & Feeding", slug: "baby-care" },
      { name: "Maternity & Pregnancy", slug: "maternity-and-pregnancy" },
      { name: "Transport & Safety", slug: "prams-and-strollers" }
    ]
  },
  { 
    name: "Food, Agriculture & Farming", slug: "agriculture-and-foodstuff", image: "https://assets.jijistatic.com/art/attributes/categories/agriculture-x3.png",
    subCategories: [
      { name: "Food & Beverages", slug: "meals-and-drinks" },
      { name: "Farm Animals", slug: "livestock-and-poultry" },
      { name: "Seeds & Fertilizers", slug: "feeds-supplements-seeds" },
      { name: "Farm Machinery & Equipment", slug: "farm-machinery-equipment" },
      { name: "Farm Animal Feed & Supplements", slug: "farm-animal-feed-supplements" }
    ]
  },
  { 
    name: "Animals & Pets", slug: "animals-and-pets", image: "https://assets.jijistatic.com/art/attributes/categories/animals-x3.png",
    subCategories: [
      { name: "Pet's Accessories", slug: "pets-accessories" },
      { name: "Cats & Kittens", slug: "cats-and-kittens" },
      { name: "Dogs & Puppies", slug: "dogs-and-puppies" },
      { name: "Fish", slug: "fish" },
      { name: "Birds", slug: "birds" },
      { name: "Other Animals", slug: "other-animals" }
    ]
  },
  { 
    name: "Jobs", slug: "jobs", image: "https://assets.jijistatic.com/art/attributes/categories/jobs-x3.png",
    subCategories: [
      { name: "Advertising & Marketing Jobs", slug: "advertising-and-marketing-jobs" },
      { name: "Accounting & Finance Jobs", slug: "accounting-and-finance-jobs" },
      { name: "Computing & IT Jobs", slug: "computing-and-it-jobs" },
      { name: "Construction & Skilled Trade Jobs", slug: "construction-and-skilled-trade-jobs" },
      { name: "Driver Jobs", slug: "driver-jobs" },
      { name: "Healthcare & Nursing Jobs", slug: "healthcare-and-nursing-jobs" },
      { name: "Teaching Jobs", slug: "teaching-jobs" }
    ]
  }
];

// 2. MARKETPLACE FEEDS
export const topDeals = [
  { id: 1, title: "Induction Cooker", price: "USh 579,119", moq: "1", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop" },
  { id: 2, title: "Portable Cooktop", price: "USh 35,120", moq: "1", image: "https://images.unsplash.com/photo-1585659722983-3a6750f1883c?w=300&h=300&fit=crop" },
  { id: 3, title: "Welding Machine", price: "USh 827,313", moq: "1", image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&h=300&fit=crop" },
  { id: 4, title: "Laser Engraver", price: "USh 512,934", moq: "1", image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=300&h=300&fit=crop" },
  { id: 5, title: "Drone Accessories", price: "USh 599,802", moq: "1", image: "https://images.unsplash.com/photo-1507580461466-932f38d6fc3a?w=300&h=300&fit=crop" },
  { id: 6, title: "Power Inverter", price: "USh 496,388", moq: "1", image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=300&h=300&fit=crop" },
];

export const tailoredSelections = [
  {
    title: "36-72 V Electric Bicycle Conversion Kits", views: "7K+ Views", price: "USh 417,793-628,758",
    images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1496180590890-50d7cb1b1d42?w=150&h=150&fit=crop"]
  },
  {
    title: "Universal Electric Mobility Parts", views: "7K+ Views", price: "USh 72,390",
    images: ["https://images.unsplash.com/photo-1580274455092-23c2a13ee1bc?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=150&h=150&fit=crop"]
  },
  {
    title: "E-Bike Motor Suspension and Hub Options", views: "15K+ Views", price: "USh 206,829-268,877",
    images: ["https://images.unsplash.com/photo-1620050851862-793574d6b6df?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=150&h=150&fit=crop"]
  }
];

export const productGrid = [
  { id: 1, title: "Freight Forwarder China to Uganda Door to Door Ddp Service", price: "USh 12,410-20,683", moq: "1 kg", sold: "20 views", image: "https://images.unsplash.com/photo-1570710891163-6d815f470087?w=300&h=300&fit=crop", verified: true, years: 1 },
  { id: 2, title: "Electric Infrared Cooker 2200-3500W Portable Induction Cooktop", price: "USh 32,266-49,639", moq: "100 cartons", sold: "72 views", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop", verified: true, years: 2 },
  { id: 3, title: "Factory Wholesale Fashion Color 48V 350W 500W Electric Moped", price: "USh 306,106-330,926", moq: "1 piece", sold: "917 views", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop", verified: true, years: 1 },
  { id: 4, title: "2000W Dual Core High Power Electric Stove Home Use", price: "USh 28,956", moq: "2 pieces", sold: "9 sold", image: "https://images.unsplash.com/photo-1585659722983-3a6750f1883c?w=300&h=300&fit=crop", verified: true, years: 3 },
  { id: 5, title: "EK Electric Bike Accessories 3 Speed Lead-Acid Battery 40 km", price: "USh 248,194-330,926", moq: "1 piece", sold: "1386 views", image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=300&h=300&fit=crop", verified: true, years: 1 },
  { id: 6, title: "EK Wholesale Best Seller 350W 48V 14\" Brushless Electronic High", price: "USh 455,023-672,192", moq: "100 pieces", sold: "100 sold", image: "https://images.unsplash.com/photo-1496180590890-50d7cb1b1d42?w=300&h=300&fit=crop", verified: true, years: 1 },
];

export const newArrivals = [
  { id: 1, title: "Induction Cooker", price: "USh 27,715", moq: "10", tag: "Patented", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop" },
  { id: 2, title: "Cooking Pot", price: "USh 4,137", moq: "1", tag: "", image: "https://images.unsplash.com/photo-1570710891163-6d815f470087?w=300&h=300&fit=crop" },
  { id: 3, title: "Electric Scooter", price: "USh 943,137", moq: "50", tag: "", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop" },
  { id: 4, title: "Mini Stove", price: "USh 15,200", moq: "5", tag: "Hot", image: "https://images.unsplash.com/photo-1585659722983-3a6750f1883c?w=300&h=300&fit=crop" },
];

// 3. STORES (Mapped to the exact category names above)
export const stores = [
  {
    title: "Shenzhen Me Led Technology Co.", domain: "meled.ola.com", description: "Global manufacturer of high-resolution indoor and outdoor LED display solutions tailored for events, advertising, and commercial installations.",
    themeColor: "#10b981", layoutStyle: "classic", banner: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=400&fit=crop",
    categories: ["Electronics"], location: { address: "Bao'an District, Shenzhen, China", lat: 22.5431, lng: 114.0579 },
    contact: { email: "sales@meled.com", phone: "+86 138 0013 8000" }, verified: true, years: 11, staff: "70+", revenue: "US$ 28.9M+", rating: 4.8,
    capabilities: [{ label: "On-time delivery", value: "96.7%" }],
    products: [{ title: "P3 Indoor LED Screen", price: "USh 616,349", moq: "4 pieces", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop", categoryName: "Electronics" }],
    gallery: { image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop", count: "1/41" }
  },
  {
    title: "Ironclad Heavy Machinery", domain: "ironclad.ola.com", description: "Robust industrial extractors, loaders, and welding equipment engineered for extreme durability and heavy-duty performance.",
    themeColor: "#dc2626", layoutStyle: "bold", banner: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&h=400&fit=crop",
    categories: ["Commercial Equipment & Tools"], location: { address: "Industrial Zone, Shanghai, China", lat: 31.2304, lng: 121.4737 },
    contact: { email: "sales@ironclad.cn", phone: "+86 020 9999 1234" }, verified: true, years: 12, staff: "500+", revenue: "US$ 800M+", rating: 4.7,
    capabilities: [{ label: "Heavy Duty Certified", value: "CE, ISO9001" }],
    products: [{ title: "Pro Welding Machine", price: "USh 827,313", moq: "1 piece", image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&h=300&fit=crop", categoryName: "Commercial Equipment & Tools" }],
    gallery: { image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop", count: "1/80" }
  },
  {
    title: "Hangzhou Luxe Furnishings", domain: "luxefurnishings.ola.com", description: "Curated modern and classic furniture pieces made from premium sustainable materials to elevate interior and exterior spaces.",
    themeColor: "#92400e", layoutStyle: "furniture", banner: "https://images.unsplash.com/photo-1615529182904-14819c35d47a?w=1200&h=500&fit=crop",
    categories: ["Home, Furniture & Appliances"], location: { address: "Xihu District, Hangzhou, China", lat: 30.2741, lng: 120.1551 },
    contact: { email: "hello@luxefurnishings.com", phone: "+86 571 2222 3333" }, verified: true, years: 14, staff: "120+", revenue: "US$ 64.5M+", rating: 4.7,
    capabilities: [{ label: "Premium Materials", value: "Verified" }],
    products: [{ title: "Velvet Lounge Chair", price: "USh 450,000", moq: "2 pieces", image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&h=300&fit=crop", categoryName: "Home, Furniture & Appliances" }],
    gallery: { image: "https://images.unsplash.com/photo-1615529182904-14819c35d47a?w=400&h=300&fit=crop", count: "1/24" }
  },
  {
    title: "Vogue Threads Apparel", domain: "voguethreads.ola.com", description: "Wholesale distributor of fast fashion, activewear, and high-quality seasonal clothing lines offering complete custom labeling.",
    themeColor: "#000000", layoutStyle: "apparel", banner: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=500&fit=crop",
    categories: ["Fashion"], location: { address: "Haizhu District, Guangzhou, China", lat: 23.1291, lng: 113.2644 },
    contact: { email: "wholesale@voguethreads.com", phone: "+86 20 8888 9999" }, verified: true, years: 9, staff: "450+", revenue: "US$ 320M+", rating: 4.6,
    capabilities: [{ label: "Custom Labeling", value: "Available" }],
    products: [{ title: "Linen Summer Dress", price: "USh 85,000", moq: "20 pieces", image: "https://images.unsplash.com/photo-1515347619362-6734d71e7551?w=300&h=400&fit=crop", categoryName: "Fashion" }],
  }
];