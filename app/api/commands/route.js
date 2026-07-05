// GET /api/commands?category=<slug>&serviceType=<t>&businessType=<products|services|both>
// Resolves the effective AI command for a store by layering:
//   [ global (cuts across) ]  +  [ most-specific: serviceType → category slug → store ]
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AiCommand } from '@/models/Marketplace';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const sp = new URL(request.url).searchParams;
    const category    = (sp.get('category') || '').trim().toLowerCase();
    const serviceType = (sp.get('serviceType') || '').trim().toLowerCase();

    const all = await AiCommand.find({ active: true }).lean();
    const byTarget = new Map(all.map(c => [c.target, c]));

    const global   = byTarget.get('global');
    // Most specific wins: a service command, else a category command, else the store command.
    const specific =
      (serviceType && byTarget.get(serviceType)) ||
      (category && byTarget.get(category)) ||
      byTarget.get('store') ||
      null;

    const command = [global?.command, specific?.command].filter(Boolean).join('\n\n');
    return NextResponse.json({
      success: true,
      command,
      resolved: { global: global?.target || null, specific: specific?.target || null },
    });
  } catch (e) {
    console.error('[commands GET]', e);
    return NextResponse.json({ success: false, error: 'Failed to resolve command', command: '' }, { status: 500 });
  }
}
