// src/app/api/leaderboard/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { jsonWithETag } from '@/lib/httpCache';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import {
  fetchHelldiversLeaderboard,
  VALID_SORT_FIELDS,
  type SortField,
  type LeaderboardScope,
} from '@/lib/helldiversLeaderboard';
import { logger } from '@/lib/logger';

// Acceptable scopes for this single-scope endpoint
const VALID_SCOPES = new Set<LeaderboardScope>([
  'day',
  'week',
  'month',
  'lifetime',
  'solo',
  'squad',
]);

function parseIntSafe(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // sortBy (default Kills), sortDir (default desc), limit (default 100)
    const sortByRaw = (url.searchParams.get('sortBy') || 'Kills') as SortField;
    const sortBy: SortField = VALID_SORT_FIELDS.includes(sortByRaw) ? sortByRaw : 'Kills';

    const sortDirParam = (url.searchParams.get('sortDir') || 'desc').toLowerCase();
    const sortDir: 'asc' | 'desc' = sortDirParam === 'asc' ? 'asc' : 'desc';

    const limitReq = parseIntSafe(url.searchParams.get('limit')) ?? 100;
    const limit = Math.min(Math.max(limitReq, 1), 1000);

    // scope (default month)
    const scopeRaw = (url.searchParams.get('scope') || 'month').toLowerCase() as LeaderboardScope;
    const scope: LeaderboardScope = VALID_SCOPES.has(scopeRaw) ? scopeRaw : 'month';

    // optional month/year for "month" scope
    let month = parseIntSafe(url.searchParams.get('month'));
    let year = parseIntSafe(url.searchParams.get('year'));

    // sanitize month/year
    if (month !== undefined) month = Math.min(Math.max(month, 1), 12);
    if (year !== undefined) year = Math.min(Math.max(year, 1970), 9999);

    // Only pass month/year to the fetcher when the scope is month
    const data = await fetchHelldiversLeaderboard({
      sortBy,
      sortDir,
      limit,
      scope,
      month: scope === 'month' ? month : undefined,
      year: scope === 'month' ? year : undefined,
    });
    // Enrich with avatar URL and SES name using discord_id, with name fallback
    try {
      if (data?.results?.length) {
        await dbConnect();
        const rows = data.results as any[];
        const discordIds = Array.from(
          new Set(
            rows
              .map((r) => (r.discord_id != null ? String(r.discord_id) : null))
              .filter(Boolean)
          )
        ) as string[];
        const names = Array.from(
          new Set(rows.map((r) => String(r.player_name || '')).filter(Boolean))
        );

        const usersByDiscord = new Map<string, any>();
        if (discordIds.length) {
          const u = await UserModel.find({ providerAccountId: { $in: discordIds } })
            .select('providerAccountId customAvatarDataUrl image sesName name')
            .lean();
          for (const usr of u) usersByDiscord.set(String(usr.providerAccountId), usr);
        }

        const usersByName = new Map<string, any>();
        const chunkSize = 40;
        for (let i = 0; i < names.length; i += chunkSize) {
          const slice = names.slice(i, i + chunkSize);
          const or = slice.map((n) => ({ name: { $regex: `^${n.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' } }));
          if (!or.length) continue;
          const u = await UserModel.find({ $or: or })
            .select('name customAvatarDataUrl image sesName providerAccountId')
            .lean();
          for (const usr of u) usersByName.set(String((usr as any).name).toLowerCase(), usr);
        }

        for (const r of rows) {
          let avatarUrl: string | null = null;
          let sesName: string | null = null;
          const did = r.discord_id != null ? String(r.discord_id) : null;
          if (did && usersByDiscord.has(did)) {
            const usr = usersByDiscord.get(did);
            avatarUrl = usr?.customAvatarDataUrl || usr?.image || null;
            sesName = usr?.sesName || null;
          } else {
            const key = String(r.player_name || '').toLowerCase();
            const usr = usersByName.get(key);
            if (usr) {
              avatarUrl = usr?.customAvatarDataUrl || usr?.image || null;
              sesName = usr?.sesName || null;
            }
          }
          if (!avatarUrl && did) {
            const idx = Math.abs(Number.parseInt(did, 10) || 0) % 5;
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
          }
          if (avatarUrl) (r as any)._avatarUrl = avatarUrl;
          if (sesName && !r.sesTitle) r.sesTitle = sesName;
        }
      }
    } catch (e) {
      // Best-effort enrichment; ignore failures
    }

    return jsonWithETag(req, data, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching helldivers leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
