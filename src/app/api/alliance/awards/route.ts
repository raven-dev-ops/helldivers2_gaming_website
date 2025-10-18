// src/app/api/alliance/awards/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import AllianceProfile from '@/models/AllianceProfile';
import { Types } from 'mongoose';

function json(data: any, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: { 'Cache-Control': 'private, max-age=60', Vary: 'Cookie' },
  });
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const self = url.searchParams.get('self');
    const name = url.searchParams.get('name');
    const userId = url.searchParams.get('userId');
    const discordId = url.searchParams.get('discordId');

    let uid: Types.ObjectId | null = null;
    let did: string | null = null;

    if (self === '1') {
      const session = await getServerSession(getAuthOptions());
      if (!session?.user?.id) return json({ error: 'unauthorized' }, { status: 401 });
      uid = new Types.ObjectId(session.user.id);
    } else if (userId && Types.ObjectId.isValid(userId)) {
      uid = new Types.ObjectId(userId);
    } else if (discordId) {
      did = discordId;
    } else if (name) {
      const user = await User.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
        .select('_id providerAccountId')
        .lean();
      if (!user) return json({ awards: {} });
      uid = user._id as Types.ObjectId;
      did = (user as any).providerAccountId || null;
    } else {
      return json({ error: 'bad_request' }, { status: 400 });
    }

    const prof = await AllianceProfile.findOne(
      uid ? { userId: uid } : { discordId: did }
    )
      .select('awards updatedAt')
      .lean();

    return json({ awards: prof?.awards || {}, updatedAt: prof?.updatedAt || null });
  } catch (err) {
    return json({ error: 'internal_error' }, { status: 500 });
  }
}

