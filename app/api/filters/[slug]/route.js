/**
 * ============================================================================
 * FILE: app/api/filters/[slug]/route.js
 * DESCRIPTION: Returns the dynamic, per-category filter schema for a given
 *              category slug. The schema is stored in the database
 *              (CategoryFilter collection) and looked up dynamically when a
 *              category is selected — replacing the previous on-disk JSON reads
 *              which are unreliable on serverless runtimes.
 *              Run `npm run seed:filters` once to populate the collection from
 *              the JSON files in app/data/filters.
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CategoryFilter } from '@/models/Marketplace';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    await connectToDatabase();

    const doc = await CategoryFilter.findOne({ slug }).select('filterSchema').lean();

    return NextResponse.json(
      { success: true, schema: doc?.filterSchema ?? [] },
      {
        status: 200,
        headers: {
          // Filter schemas change rarely — cache at the edge for 5 minutes.
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('Error reading filter schema for slug:', error);
    // On any failure, safely return an empty schema so the UI degrades gracefully.
    return NextResponse.json({ success: false, schema: [] }, { status: 200 });
  }
}
