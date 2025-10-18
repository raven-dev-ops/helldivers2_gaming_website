// src/app/api/alliance/config/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AllianceConfig from '@/models/AllianceConfig';

function json(data: any, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800' },
  });
}

const DEFAULT_AWARDS = [
  { key: 'valor', label: 'Valor', order: 1 },
  { key: 'tactics', label: 'Tactics', order: 2 },
  { key: 'teamwork', label: 'Teamwork', order: 3 },
  { key: 'logistics', label: 'Logistics', order: 4 },
  { key: 'rescue', label: 'Rescue', order: 5 },
  { key: 'intel', label: 'Intel', order: 6 },
];

export async function GET(_req: NextRequest) {
  try {
    await dbConnect();
    const cfg = await AllianceConfig.findOne({ slug: 'default' }).lean();
    const awards = (cfg?.awards?.length ? cfg.awards : DEFAULT_AWARDS)
      .filter((a: any) => a?.active !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    return json({ awards });
  } catch (err) {
    return json({ awards: DEFAULT_AWARDS, error: 'fallback' });
  }
}

