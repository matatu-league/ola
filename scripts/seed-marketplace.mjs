/**
 * ============================================================================
 * scripts/seed-marketplace.mjs
 * ----------------------------------------------------------------------------
 * Seeds demo marketplace data so a fresh install has something to show:
 *   • 5 hybrid stores (products + services)
 *   • 100 products and 100 services, spread across the current categories
 *
 * All demo data is owned by a single seed vendor (seed-vendor@ola.ug), so the
 * script is IDEMPOTENT: on every run it wipes that vendor's previous stores /
 * products / services and recreates them. Existing real data is never touched.
 *
 * Base categories are upserted by slug if the DB has fewer than 5 categories;
 * otherwise the existing categories are used as-is.
 *
 * Usage:
 *   MATATU_DB_URI="mongodb+srv://..." node scripts/seed-marketplace.mjs
 *   # or with the URI in .env.local / .env:
 *   npm run seed:marketplace
 * ============================================================================
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { connectToDatabase } = await import('../app/lib/mongodb.js');
const mongooseMod = await import('mongoose');
const mongoose = mongooseMod.default || mongooseMod;
const { Category, Product } = await import('../app/models/Marketplace.js');
const StoreMod   = await import('../app/models/Store.js');
const ServiceMod = await import('../app/models/Service.js');
const UserMod    = await import('../app/models/User.js');
const Store   = StoreMod.default   || StoreMod.Store;
const Service = ServiceMod.default || ServiceMod.Service;
const User    = UserMod.default    || UserMod.User;

const SEED_EMAIL = 'seed-vendor@ola.ug';
const img = (kw) => `https://source.unsplash.com/600x600/?${encodeURIComponent(kw)}`;
const banner = (kw) => `https://source.unsplash.com/1600x600/?${encodeURIComponent(kw)}`;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr, i) => arr[i % arr.length];
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Base categories (upserted only if the DB is under-seeded). key drives pools.
const BASE_CATEGORIES = [
  { name: 'Electronics',        slug: 'electronics',    key: 'electronics' },
  { name: 'Fashion',            slug: 'fashion',        key: 'fashion' },
  { name: 'Beauty & Cosmetics', slug: 'beauty',         key: 'beauty' },
  { name: 'Home & Furniture',   slug: 'home-furniture', key: 'home' },
  { name: 'Food & Grocery',     slug: 'food-grocery',   key: 'food' },
  { name: 'Sports & Fitness',   slug: 'sports-fitness', key: 'sports' },
];

// Product/service name pools + image keyword per category key.
const POOLS = {
  electronics: {
    kw: 'electronics gadget',
    products: ['Wireless Noise-Cancelling Headphones', 'Ultrabook Pro 14"', 'Flagship Smartphone', '4K Action Camera', 'Mechanical Keyboard', 'Smart Watch Series X', 'Bluetooth Speaker', 'USB-C Fast Charger', '27" 4K Monitor', 'Drone Camera Kit', 'Gaming Mouse', 'Power Bank 20000mAh'],
    services: ['Phone Screen Repair', 'Laptop Diagnostics', 'Home Network Setup', 'Data Recovery', 'CCTV Installation', 'Smart Home Setup', 'PC Custom Build', 'Device Trade-in Valuation'],
  },
  fashion: {
    kw: 'fashion clothing',
    products: ['Minimalist Linen Shirt', 'Essential Cotton Crew', 'Relaxed Fit Trousers', 'Classic Wool Coat', 'Leather Weekend Bag', 'Silk Blend Scarf', 'Knit Beanie', 'Suede Chelsea Boots', 'Denim Jacket', 'Summer Maxi Dress', 'Canvas Sneakers', 'Aviator Sunglasses'],
    services: ['Bespoke Tailoring', 'Personal Styling Session', 'Wardrobe Consultation', 'Alterations & Repairs', 'Bridal Fitting', 'Fashion Photoshoot', 'Custom Embroidery', 'Shoe Restoration'],
  },
  beauty: {
    kw: 'beauty cosmetics',
    products: ['Radiance Serum', 'Velvet Matte Lipstick', 'Hydrating Day Cream', 'Signature Eau de Parfum', 'Silk Foundation', 'Nourishing Hair Oil', 'Clay Detox Mask', 'Rose Gold Brush Set', 'Vitamin C Toner', 'SPF 50 Sunscreen'],
    services: ['Classic Facial', 'Gel Manicure', 'Hair Colour & Style', 'Bridal Makeup', 'Deep Tissue Massage', 'Lash Extensions', 'Spa Day Package', 'Skin Consultation'],
  },
  home: {
    kw: 'home furniture interior',
    products: ['Oak Lounge Chair', 'Linen Sofa 3-Seater', 'Ceramic Table Lamp', 'Handwoven Area Rug', 'Solid Wood Dining Table', 'Minimalist Bookshelf', 'Velvet Accent Cushion', 'Framed Wall Art Set', 'Storage Ottoman', 'Pendant Light Fixture'],
    services: ['Interior Design Consultation', 'Furniture Assembly', 'Custom Carpentry', 'Home Deep Cleaning', 'Curtain & Blinds Fitting', 'Painting & Decorating', 'Space Planning', 'Upholstery Repair'],
  },
  food: {
    kw: 'food fresh produce',
    products: ['Artisan Sourdough Loaf', 'Single-Origin Coffee Beans', 'Cold-Pressed Juice', 'Farm Fresh Eggs', 'Handmade Chocolate Box', 'Organic Honey Jar', 'Seasonal Fruit Basket', 'Stone-Baked Pizza', 'Gourmet Cheese Board', 'Herbal Tea Sampler'],
    services: ['Private Chef Experience', 'Event Catering', 'Weekly Meal Prep', 'Cake & Bakery Orders', 'Barista Training', 'Grocery Delivery', 'Cooking Class', 'Cocktail Bartending'],
  },
  sports: {
    kw: 'sports fitness gym',
    products: ['Performance Running Shoes', 'Adjustable Dumbbell Set', 'Breathable Training Tee', 'Yoga Mat Pro', 'Insulated Water Bottle', 'Resistance Band Kit', 'Trail Backpack 30L', 'Smart Fitness Tracker', 'Foam Roller', 'Jump Rope Speed'],
    services: ['Personal Training', 'Group Fitness Class', 'Nutrition Coaching', 'Physio Session', 'Bike Servicing', 'Sports Massage', 'Yoga Session', 'Running Clinic'],
  },
  generic: {
    kw: 'premium product',
    products: ['Signature Item', 'Premium Bundle', 'Classic Edition', 'Deluxe Set', 'Essential Pack', 'Limited Release', 'Everyday Staple', 'Pro Collection', 'Starter Kit', 'Gift Box'],
    services: ['Consultation', 'Installation', 'Maintenance Plan', 'Custom Order', 'Express Service', 'On-site Visit', 'Support Package', 'Setup & Onboarding'],
  },
};

function keyForCategory(name) {
  const n = (name || '').toLowerCase();
  if (/electronic|tech|gadget|computer|phone|device|digital|appliance/.test(n)) return 'electronics';
  if (/beauty|cosmet|skincare|makeup|salon|spa|hair/.test(n)) return 'beauty';
  if (/food|grocer|restaurant|cafe|bakery|drink|beverage|coffee|kitchen/.test(n)) return 'food';
  if (/furnitur|home|decor|interior|homeware/.test(n)) return 'home';
  if (/sport|fitness|gym|outdoor|athletic/.test(n)) return 'sports';
  if (/fashion|cloth|apparel|wear|boutique|shoe|jewel|accessor/.test(n)) return 'fashion';
  return 'generic';
}

const priceStr = (min, max) => String(rand(min, max) * 1000); // UGX, as the model stores a string

async function main() {
  console.log('🚀 Seeding marketplace demo data…');
  await connectToDatabase();

  // 1. Seed vendor
  let owner = await User.findOne({ email: SEED_EMAIL });
  if (!owner) {
    owner = await User.create({
      email: SEED_EMAIL, displayName: 'Ola Demo Vendor', role: 'seller',
      status: 'active', authProviders: ['email'],
    });
    console.log('👤 Created seed vendor');
  }

  // 2. Categories — ensure a usable set, then use whatever exists.
  const existing = await Category.countDocuments();
  if (existing < 5) {
    for (const c of BASE_CATEGORIES) {
      await Category.updateOne({ slug: c.slug }, { $setOnInsert: { name: c.name, slug: c.slug } }, { upsert: true });
    }
    console.log('🏷️  Upserted base categories');
  }
  const categories = await Category.find().limit(24).lean();
  if (!categories.length) throw new Error('No categories available to attach data to.');

  // 3. Wipe this seed vendor's previous data (idempotent).
  const oldStores = await Store.find({ userId: owner._id }).select('_id').lean();
  const oldStoreIds = oldStores.map(s => s._id);
  await Promise.all([
    Product.deleteMany({ userId: owner._id }),
    Service.deleteMany({ userId: owner._id }),
    Store.deleteMany({ userId: owner._id }),
  ]);
  if (oldStoreIds.length) console.log(`🧹 Removed ${oldStoreIds.length} previous demo store(s) and their items`);

  // 4. Five hybrid stores, each specialising in one of the first categories.
  const STORE_DEFS = [
    { title: 'VoltEdge Electronics', key: 'electronics' },
    { title: 'Atelier Mode',         key: 'fashion' },
    { title: 'Lumière Beauty',       key: 'beauty' },
    { title: 'Nest & Grain Home',    key: 'home' },
    { title: 'Fresh Harvest Market', key: 'food' },
  ];

  const catByKey = (k) => categories.find(c => keyForCategory(c.name) === k) || categories[0];

  const stores = [];
  for (const def of STORE_DEFS) {
    const cat = catByKey(def.key);
    const pool = POOLS[def.key] || POOLS.generic;
    const store = await Store.create({
      userId: owner._id,
      title: def.title,
      domain: `${slugify(def.title)}.ola.ug`,
      businessType: 'both',
      industry: cat?.name || def.key,
      description: `${def.title} — your destination for quality ${(cat?.name || def.key).toLowerCase()} products and services.`,
      themeColor: '#161823',
      layoutStyle: 'Modern',
      verified: true,
      logo: img(`${pool.kw} logo`),
      banner: banner(pool.kw),
      contact: { email: `hello@${slugify(def.title)}.ola.ug`, phone: `+2567${rand(10, 99)}${rand(100000, 999999)}` },
      location: { isOnlineOnly: false, address: 'Kampala, Uganda' },
    });
    stores.push({ store, cat, key: def.key, pool });
  }
  console.log(`🏬 Created ${stores.length} hybrid stores`);

  // 5. 100 products + 100 services, 20 of each per store.
  const products = [];
  const services = [];
  for (const { store, cat, pool } of stores) {
    for (let i = 0; i < 20; i++) {
      const name = pick(pool.products, i);
      products.push({
        userId: owner._id, storeId: store._id, categoryId: cat?._id,
        status: 'active',
        title: `${name}${i >= pool.products.length ? ' ' + (Math.floor(i / pool.products.length) + 1) : ''}`,
        description: `Premium ${name.toLowerCase()} from ${store.title}. Quality you can trust, delivered across Uganda.`,
        price: priceStr(20, 900),
        image: img(pool.kw), images: [img(pool.kw), img(pool.kw + ' detail')],
        stock: rand(3, 120), sku: `SEED-${slugify(store.title)}-P${i + 1}`,
        rating: rand(38, 50) / 10, reviewsCount: rand(0, 240), sold: rand(0, 500), views: rand(20, 5000),
      });
    }
    for (let i = 0; i < 20; i++) {
      const name = pick(pool.services, i);
      services.push({
        userId: owner._id, storeId: store._id, category: cat?._id,
        status: 'active',
        title: `${name}${i >= pool.services.length ? ' ' + (Math.floor(i / pool.services.length) + 1) : ''}`,
        description: `${name} by ${store.title}. Book online and pick a time that suits you.`,
        price: priceStr(15, 400),
        durationMinutes: String([30, 45, 60, 90, 120][rand(0, 4)]),
        images: [img(pool.kw + ' service')],
      });
    }
  }

  await Product.insertMany(products);
  await Service.insertMany(services);
  console.log(`📦 Inserted ${products.length} products and 🛎️  ${services.length} services`);

  console.log('✅ Marketplace seed complete.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
