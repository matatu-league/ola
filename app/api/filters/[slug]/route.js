/**
 * ============================================================================
 * FILE: app/api/filters/[slug]/route.js
 * DESCRIPTION: Reads dynamic category schema JSON files from the local server directory.
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'app', 'data', 'filters', `${slug}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsedData = JSON.parse(fileContents);

    return NextResponse.json({ success: true, schema: parsedData.schema || [] });
  } catch (error) {
    console.error(`Error reading filter schema for slug:`, error);
    // If file isn't found or is invalid, safely return an empty schema
    return NextResponse.json({ success: false, schema: [] }, { status: 404 });
  }
}