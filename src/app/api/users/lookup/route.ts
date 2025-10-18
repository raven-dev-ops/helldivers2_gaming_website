// src/app/api/users/lookup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const discordId = url.searchParams.get('discordId');

    if (!name && !discordId) {
      return NextResponse.json({ error: 'Missing name or discordId' }, { status: 400 });
    }

    await dbConnect();

    const query: any = {};
    if (discordId) {
      // In this app, we don't persist discordId directly on User, but keep for future.
      // Fall back to name lookup when discordId is not available.
      query.providerAccountId = discordId;
    }
    if (name) {
      // Case-insensitive name match
      query.name = { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    }

    const user = await User.findOne(query)
      .select('name callsign rankTitle motto sesName customAvatarDataUrl image')
      .lean();

    if (!user) {
      return NextResponse.json({}, { status: 200 });
    }

    const avatarUrl = user.customAvatarDataUrl || user.image || null;
    return NextResponse.json(
      {
        name: user.name ?? null,
        callsign: user.callsign ?? null,
        rankTitle: user.rankTitle ?? null,
        motto: user.motto ?? null,
        sesName: (user as any).sesName ?? null,
        avatarUrl,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
