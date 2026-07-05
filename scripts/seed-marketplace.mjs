/**
 * ============================================================================
 * scripts/seed-marketplace.mjs
 * ----------------------------------------------------------------------------
 * Seeds demo marketplace data so a fresh install has something real to show:
 *   • 5 hybrid stores (products + services)
 *   • 100 products (REAL titles + images from the open DummyJSON dataset)
 *   • 100 services (generated, with real keyword photos via LoremFlickr)
 *
 * IMAGES: source.unsplash.com was discontinued (404s), so products use real
 * photos from https://dummyjson.com/products (a free open store API) and
 * services use https://loremflickr.com keyword photos.
 *
 * IDEMPOTENT: all demo data is owned by one seed vendor (seed-vendor@ola.ug).
 * Every run WIPES that vendor's previous stores/products/services (and any
 * leftover SEED- products) before recreating. Real data is never touched.
 *
 * Usage:
 *   MATATU_DB_URI="mongodb+srv://..." npm run seed:marketplace
 * ============================================================================
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

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
const USD_TO_UGX = 3800;

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr, i) => arr[i % arr.length];
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// LoremFlickr keyword photo, deterministic via a lock hash (no flicker).
function lf(keywords, w = 600, h = 600) {
  const kw = String(keywords || 'product').trim().split(/\s+/).map(encodeURIComponent).join(',');
  let lock = 0; const s = String(keywords);
  for (let i = 0; i < s.length; i++) lock = (lock * 31 + s.charCodeAt(i)) % 100000;
  return `https://loremflickr.com/${w}/${h}/${kw}?lock=${lock}`;
}

const BASE_CATEGORIES = [
  { name: 'Electronics',        slug: 'electronics' },
  { name: 'Fashion',            slug: 'fashion' },
  { name: 'Beauty & Cosmetics', slug: 'beauty' },
  { name: 'Home & Furniture',   slug: 'home-furniture' },
  { name: 'Food & Grocery',     slug: 'food-grocery' },
  { name: 'Sports & Fitness',   slug: 'sports-fitness' },
];

const SERVICE_POOLS = {
  electronics: { kw: 'electronics repair', names: ['Phone Screen Repair', 'Laptop Diagnostics', 'Home Network Setup', 'Data Recovery', 'CCTV Installation', 'Smart Home Setup', 'PC Custom Build', 'Device Trade-in Valuation'] },
  fashion:     { kw: 'tailoring fashion',  names: ['Bespoke Tailoring', 'Personal Styling', 'Wardrobe Consultation', 'Alterations & Repairs', 'Bridal Fitting', 'Fashion Photoshoot', 'Custom Embroidery', 'Shoe Restoration'] },
  beauty:      { kw: 'salon spa',          names: ['Classic Facial', 'Gel Manicure', 'Hair Colour & Style', 'Bridal Makeup', 'Deep Tissue Massage', 'Lash Extensions', 'Spa Day Package', 'Skin Consultation'] },
  home:        { kw: 'home service',       names: ['Interior Design Consultation', 'Furniture Assembly', 'Custom Carpentry', 'Home Deep Cleaning', 'Curtain & Blinds Fitting', 'Painting & Decorating', 'Space Planning', 'Upholstery Repair'] },
  food:        { kw: 'catering chef',      names: ['Private Chef Experience', 'Event Catering', 'Weekly Meal Prep', 'Cake & Bakery Orders', 'Barista Training', 'Grocery Delivery', 'Cooking Class', 'Cocktail Bartending'] },
  sports:      { kw: 'fitness training',   names: ['Personal Training', 'Group Fitness Class', 'Nutrition Coaching', 'Physio Session', 'Bike Servicing', 'Sports Massage', 'Yoga Session', 'Running Clinic'] },
  generic:     { kw: 'professional service', names: ['Consultation', 'Installation', 'Maintenance Plan', 'Custom Order', 'Express Service', 'On-site Visit', 'Support Package', 'Setup & Onboarding'] },
};

function keyForCategory(name) {
  const n = (name || '').toLowerCase();
  if (/electronic|tech|gadget|computer|phone|laptop|tablet|device|digital|appliance/.test(n)) return 'electronics';
  if (/beauty|cosmet|skincare|skin-care|makeup|fragrance|salon|spa|hair/.test(n)) return 'beauty';
  if (/food|grocer|restaurant|cafe|bakery|drink|beverage|coffee|kitchen/.test(n)) return 'food';
  if (/furnitur|home|decor|interior|homeware/.test(n)) return 'home';
  if (/sport|fitness|gym|outdoor|athletic|motorcycle|vehicle/.test(n)) return 'sports';
  if (/fashion|cloth|apparel|wear|boutique|shoe|shirt|top|watch|sunglass|jewel|accessor|women|men/.test(n)) return 'fashion';
  return 'generic';
}

async function fetchDummyProducts() {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=100&select=title,price,description,category,thumbnail,images,rating,stock');
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j?.products) && j.products.length ? j.products : null;
  } catch { return null; }
}

async function main() {
  console.log('🚀 Seeding marketplace demo data…');
  await connectToDatabase();

  // 1. Seed vendor
  let owner = await User.findOne({ email: SEED_EMAIL });
  if (!owner) {
    owner = await User.create({ email: SEED_EMAIL, displayName: 'Ola Demo Vendor', role: 'seller', status: 'active', authProviders: ['email'] });
    console.log('👤 Created seed vendor');
  }

  // 2. Categories — ensure a usable set, then use whatever exists.
  if (await Category.countDocuments() < 5) {
    for (const c of BASE_CATEGORIES) {
      await Category.updateOne({ slug: c.slug }, { $setOnInsert: { name: c.name, slug: c.slug } }, { upsert: true });
    }
    console.log('🏷️  Upserted base categories');
  }
  const categories = await Category.find().limit(24).lean();
  if (!categories.length) throw new Error('No categories available to attach data to.');
  const catByKey = (k) => categories.find(c => keyForCategory(c.name) === k) || categories[0];

  // 3. WIPE previous demo data (idempotent).
  const del = await Promise.all([
    Product.deleteMany({ $or: [{ userId: owner._id }, { sku: { $regex: '^SEED-' } }] }),
    Service.deleteMany({ userId: owner._id }),
    Store.deleteMany({ userId: owner._id }),
  ]);
  console.log(`🧹 Wiped previous demo data (products:${del[0].deletedCount} services:${del[1].deletedCount} stores:${del[2].deletedCount})`);

  // 4. Five hybrid stores.
  const STORE_DEFS = [
    { title: 'VoltEdge Electronics', key: 'electronics' },
    { title: 'Atelier Mode',         key: 'fashion' },
    { title: 'Lumière Beauty',       key: 'beauty' },
    { title: 'Nest & Grain Home',    key: 'home' },
    { title: 'Fresh Harvest Market', key: 'food' },
  ];
  const stores = [];
  for (const def of STORE_DEFS) {
    const cat = catByKey(def.key);
    const store = await Store.create({
      userId: owner._id,
      title: def.title,
      domain: `${slugify(def.title)}.ola.ug`,
      businessType: 'both',
      industry: cat?.name || def.key,
      description: `${def.title} — quality ${(cat?.name || def.key).toLowerCase()} products and services, delivered across Uganda.`,
      themeColor: '#161823',
      layoutStyle: 'Modern',
      verified: true,
      years: rand(1, 6),
      logo: lf(`${def.key} logo`, 200, 200),
      banner: lf(SERVICE_POOLS[def.key]?.kw || def.key, 1600, 600),
      contact: { email: `hello@${slugify(def.title)}.ola.ug`, phone: `+2567${rand(10, 99)}${rand(100000, 999999)}` },
      location: { isOnlineOnly: false, address: 'Kampala, Uganda' },
    });
    stores.push({ store, cat, key: def.key });
  }
  console.log(`🏬 Created ${stores.length} hybrid stores`);

  // 5. 100 products — real data from DummyJSON when reachable, else generated.
  const dummy = await fetchDummyProducts();
  const products = [];
  if (dummy) {
    console.log(`🌐 Using ${dummy.length} real products from DummyJSON`);
    dummy.slice(0, 100).forEach((dp, i) => {
      const { store } = stores[i % stores.length];
      const key = keyForCategory(dp.category);
      const cat = catByKey(key);
      products.push({
        userId: owner._id, storeId: store._id, categoryId: cat?._id, status: 'active',
        title: dp.title,
        description: dp.description || `${dp.title} available at ${store.title}.`,
        price: String(Math.max(1000, Math.round((dp.price || 10) * USD_TO_UGX))),
        image: dp.thumbnail || dp.images?.[0] || lf(dp.category || 'product'),
        images: (dp.images && dp.images.length ? dp.images : [dp.thumbnail]).filter(Boolean),
        stock: dp.stock ?? rand(3, 120), sku: `SEED-P${i + 1}`,
        rating: dp.rating ? Math.round(dp.rating * 10) / 10 : rand(38, 50) / 10,
        reviewsCount: rand(0, 240), sold: rand(0, 500), views: rand(20, 5000),
      });
    });
  } else {
    console.log('⚠️  DummyJSON unreachable — generating products with LoremFlickr images');
    stores.forEach(({ store, cat, key }) => {
      for (let i = 0; i < 20; i++) {
        const kw = SERVICE_POOLS[key]?.kw || 'product';
        products.push({
          userId: owner._id, storeId: store._id, categoryId: cat?._id, status: 'active',
          title: `${store.title.split(' ')[0]} ${key} #${i + 1}`,
          description: `Quality ${key} item from ${store.title}.`,
          price: String(rand(20, 900) * 1000),
          image: lf(`${kw} ${i}`), images: [lf(`${kw} ${i}`)],
          stock: rand(3, 120), sku: `SEED-${slugify(store.title)}-P${i + 1}`,
          rating: rand(38, 50) / 10, reviewsCount: rand(0, 240), sold: rand(0, 500), views: rand(20, 5000),
        });
      }
    });
  }

  // 6. 100 services (20 per store).
  const services = [];
  stores.forEach(({ store, cat, key }) => {
    const pool = SERVICE_POOLS[key] || SERVICE_POOLS.generic;
    for (let i = 0; i < 20; i++) {
      const name = pick(pool.names, i);
      services.push({
        userId: owner._id, storeId: store._id, category: cat?._id, status: 'active',
        title: `${name}${i >= pool.names.length ? ' ' + (Math.floor(i / pool.names.length) + 1) : ''}`,
        description: `${name} by ${store.title}. Book online and pick a time that suits you.`,
        price: String(rand(15, 400) * 1000),
        durationMinutes: String([30, 45, 60, 90, 120][rand(0, 4)]),
        images: [lf(`${pool.kw} ${i}`)],
      });
    }
  });

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
