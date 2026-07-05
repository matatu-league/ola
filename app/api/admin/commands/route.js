// Admin CRUD for AI storefront-generation commands.
//   GET    → list all (seeds the default global + store commands on first run)
//   POST   → upsert one { scope, target, label, command, active }
//   DELETE → ?target=<t> (the global/store defaults are protected)
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AiCommand } from '@/models/Marketplace';

export const dynamic = 'force-dynamic';

const DEFAULTS = [
  {
    scope: 'global', target: 'global', label: 'Global — applies to every storefront',
    command: 'Design a bespoke, award-level storefront tailored to this exact brand. Obsess over hierarchy, spacing, motion and mobile UX. Use the brand logo/colour as the creative anchor and real, on-category photography. Never ship a generic template.',
  },
  {
    scope: 'store', target: 'store', label: 'Products stores — unified (all product shops)',
    command: 'Build a conversion-focused e-commerce experience: a strong hero, a shoppable product grid with working search/filter, clear "Add to Cart" CTAs, trust signals, and a cohesive category-appropriate aesthetic.',
  },
];

async function ensureDefaults() {
  for (const d of DEFAULTS) {
    await AiCommand.updateOne(
      { target: d.target },
      { $setOnInsert: { scope: d.scope, target: d.target, label: d.label, command: d.command, active: true } },
      { upsert: true },
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    await ensureDefaults();
    const commands = await AiCommand.find().sort({ scope: 1, target: 1 }).lean();
    return NextResponse.json({ success: true, commands });
  } catch (e) {
    console.error('[admin/commands GET]', e);
    return NextResponse.json({ success: false, error: 'Failed to load commands' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const scope  = ['global', 'store', 'category', 'service'].includes(body.scope) ? body.scope : 'category';
    const target = String(body.target || '').trim().toLowerCase();
    if (!target) return NextResponse.json({ success: false, error: 'target is required' }, { status: 400 });

    const doc = await AiCommand.findOneAndUpdate(
      { target },
      { $set: { scope, label: body.label || '', command: body.command || '', active: body.active !== false } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return NextResponse.json({ success: true, command: doc });
  } catch (e) {
    console.error('[admin/commands POST]', e);
    return NextResponse.json({ success: false, error: 'Failed to save command' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    const target = new URL(request.url).searchParams.get('target');
    if (!target) return NextResponse.json({ success: false, error: 'target is required' }, { status: 400 });
    if (target === 'global' || target === 'store') {
      return NextResponse.json({ success: false, error: 'The global and store commands cannot be deleted (edit them instead).' }, { status: 400 });
    }
    await AiCommand.deleteOne({ target });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin/commands DELETE]', e);
    return NextResponse.json({ success: false, error: 'Failed to delete command' }, { status: 500 });
  }
}
