const fs = require('fs/promises');
const path = require('path');

// Removed 'export' so this file can run standalone via 'node fetch-slugs.js'
const marketplaceCategories = [
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
      { name: "Event Centres, Venues & Workstations", slug: "event-centers-and-venues" },
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
    subCategories: [
      { name: "Building & Trades Services", slug: "building-and-trades-services" },
      { name: "Car Services", slug: "automotive-services" },
      { name: "Computer & IT Services", slug: "computer-and-it-services" },
      { name: "Repair Services", slug: "repair-services" },
      { name: "Cleaning Services", slug: "cleaning-services" },
      { name: "Logistics Services", slug: "removals-and-storage-services" },
      { name: "Legal Services", slug: "legal-services" },
      { name: "Tax & Financial Services", slug: "tax-and-financial-services" }
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

const BASE_URL = 'https://jiji.ug/api_web/v1/attributes/update-filters?slug=';
// Directory where all the JSON files will be saved
const OUTPUT_DIR = path.join(__dirname, 'filters_data');

// Helper function to introduce a delay (polite scraping to avoid rate limits)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to recursively remove "count" or "counts" keys from the API response
function removeCounts(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(item => removeCounts(item));
  } else if (obj !== null && typeof obj === 'object') {
    // Delete the dynamic count keys if they exist in the current object
    if ('count' in obj) delete obj.count;
    if ('counts' in obj) delete obj.counts;
    
    // Recursively check all remaining properties
    for (const key in obj) {
      removeCounts(obj[key]);
    }
  }
  return obj;
}

async function fetchAndSaveAllFilters() {
  // Step 1: Create the output directory if it doesn't exist
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📂 Output directory ready: ${OUTPUT_DIR}\n`);
  } catch (error) {
    console.error('❌ Failed to create output directory:', error);
    process.exit(1);
  }

  // Step 2: Extract all subCategories into a flat array
  const allSubCategories = marketplaceCategories.flatMap(category => category.subCategories);
  console.log(`🔍 Found ${allSubCategories.length} total subcategories to process.\n`);

  // Step 3: Loop through each subCategory, fetch data, and save locally
  for (let i = 0; i < allSubCategories.length; i++) {
    const { name, slug } = allSubCategories[i];
    const url = `${BASE_URL}${slug}`;
    const filePath = path.join(OUTPUT_DIR, `${slug}.json`);

    console.log(`[${i + 1}/${allSubCategories.length}] Fetching data for: ${name} (${slug})...`);

    try {
      // Node.js 18+ has built-in fetch. 
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Recursively remove dynamic count fields from the data
      removeCounts(data);

      // Write the file locally formatted with 2 spaces for readability
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`   ✅ Successfully saved to: ${slug}.json`);

    } catch (error) {
      console.error(`   ❌ Error fetching/saving ${slug}:`, error.message);
    }

    // Step 4: Wait 1 second before the next request to avoid getting blocked by Jiji's servers
    if (i < allSubCategories.length - 1) {
      await sleep(1000); 
    }
  }

  console.log('\n🎉 Finished processing all subcategories!');
}

// Run the script
fetchAndSaveAllFilters();