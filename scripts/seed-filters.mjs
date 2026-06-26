/**
 * ============================================================================
 * scripts/seed-filters.mjs
 * ----------------------------------------------------------------------------
 * One-time migration: import every per-category filter schema from the JSON
 * files in app/data/filters into the `CategoryFilter` MongoDB collection.
 *
 * After this runs, the app reads filter schemas from the database (dynamically,
 * by category slug) instead of off disk. The JSON files are kept as the source
 * of truth for this migration and can be re-run safely (idempotent upsert).
 *
 * Usage:
 *   MATATU_DB_URI="mongodb+srv://..." node scripts/seed-filters.mjs
 *   # or, with the URI in .env.local / .env:
 *   npm run seed:filters
 * ============================================================================
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env from .env.local first (Next.js convention), then fall back to .env.
dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILTERS_DIR = path.join(__dirname, '..', 'app', 'data', 'filters');

if (!process.env.MATATU_DB_URI) {
  console.error('❌ MATATU_DB_URI is not set. Add it to .env.local or pass it inline.');
  process.exit(1);
}

// Import the shared model so there is a single source of truth for the schema.
const { connectToDatabase } = await import('../app/lib/mongodb.js');
const { CategoryFilter } = await import('../app/models/Marketplace.js');

async function main() {
  console.log('🚀 Seeding category filter schemas into the database…');
  await connectToDatabase();

  const files = (await fs.readdir(FILTERS_DIR)).filter((f) => f.endsWith('.json'));
  console.log(`📂 Found ${files.length} filter files.`);

  let upserted = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    try {
      const raw = await fs.readFile(path.join(FILTERS_DIR, file), 'utf8');
      const json = JSON.parse(raw);

      await CategoryFilter.updateOne(
        { slug },
        {
          $set: {
            slug,
            total: typeof json.total === 'number' ? json.total : 0,
            filterSchema: Array.isArray(json.schema) ? json.schema : [],
            topSelection: json.top_selection ?? null,
          },
        },
        { upsert: true },
      );
      upserted += 1;
    } catch (err) {
      failed += 1;
      console.warn(`⚠️  Skipped ${file}: ${err.message}`);
    }
  }

  console.log(`✅ Done. Upserted ${upserted} category filters${failed ? `, ${failed} failed` : ''}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Filter seed failed:', err);
  process.exit(1);
});
