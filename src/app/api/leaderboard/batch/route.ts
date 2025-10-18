// src/app/api/leaderboard/batch/route.ts
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

// --- Simple in-memory LRU cache -------------------------------------------
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute
const MAX_CACHE_ENTRIES = 100;

function getCache(): Map<string, CacheEntry> {
  const g = globalThis as unknown as {
    __helldivers_batch_cache__?: Map<string, CacheEntry>;
  };
  if (!g.__helldivers_batch_cache__) g.__helldivers_batch_cache__ = new Map();
  return g.__helldivers_batch_cache__;
}

function getFromCache(key: string) {
  const cache = getCache();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    // refresh recency
    cache.delete(key);
    cache.set(key, entry);
    return entry.data;
  }
  if (entry) cache.delete(entry as any);
  return null;
}

function setCache(key: string, data: any) {
  const cache = getCache();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function parseIntSafe(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // scopes=day,week,month,lifetime,solo,squad
    const scopesParam = (url.searchParams.get('scopes') || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Dedupe and type as LeaderboardScope (cast is OK if your fetcher validates)
    const scopes = Array.from(new Set(scopesParam)) as LeaderboardScope[];
    if (scopes.length === 0) {
      return NextResponse.json({ error: 'No scopes provided' }, { status: 400 });
    }

    // sortBy, sortDir, limit, month, year
    const sortByRaw = (url.searchParams.get('sortBy') || 'Kills') as SortField;
    const sortBy: SortField = VALID_SORT_FIELDS.includes(sortByRaw) ? sortByRaw : 'Kills';

    const sortDir: 'asc' | 'desc' =
      (url.searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const limitReq = parseIntSafe(url.searchParams.get('limit')) ?? 100;
    const limit = Math.min(Math.max(limitReq, 1), 1000);

    let month = parseIntSafe(url.searchParams.get('month'));
    if (month !== undefined) month = Math.min(Math.max(month, 1), 12);

    let year = parseIntSafe(url.searchParams.get('year'));
    if (year !== undefined) year = Math.min(Math.max(year, 1970), 9999);

    // Prepare output and cache lookups
    const out: Record<string, any> = {};
    const errors: Record<string, string> = {};
    const fetches: { scope: LeaderboardScope; key: string }[] = [];

    for (const scope of scopes) {
      const key = JSON.stringify({ sortBy, sortDir, limit, scope, month, year });
      const cached = getFromCache(key);
      if (cached) {
        out[scope] = cached;
      } else {
        fetches.push({ scope, key });
      }
    }

    if (fetches.length > 0) {
      const results = await Promise.allSettled(
        fetches.map(({ scope }) =>
          fetchHelldiversLeaderboard({
            sortBy,
            sortDir,
            limit,
            scope,
            month,
            year,
          })
        )
      );

      // Enrich results with avatar + SES (profile sesName)
      const enrich = async (payload: { results: any[] }) => {
        if (!payload?.results?.length) return payload;
        await dbConnect();
        const rows = payload.results;
        const discordIds = Array.from(
          new Set(
            rows
              .map((r: any) => (r.discord_id != null ? String(r.discord_id) : null))
              .filter(Boolean)
          )
        ) as string[];
        const names = Array.from(
          new Set(rows.map((r: any) => String(r.player_name || '')).filter(Boolean))
        );

        const usersByDiscord = new Map<string, any>();
        if (discordIds.length) {
          const u = await UserModel.find({ providerAccountId: { $in: discordIds } })
            .select('providerAccountId customAvatarDataUrl image sesName name')
            .lean();
          for (const usr of u) usersByDiscord.set(String(usr.providerAccountId), usr);
        }

        // Fallback fetch by name (case-insensitive) in chunks to avoid huge $or
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
          if (avatarUrl) (r as any)._avatarUrl = avatarUrl;
          if (sesName && !r.sesTitle) r.sesTitle = sesName;
        }
        return payload;
      };

      const enrichedPromises: Promise<void>[] = [];

      results.forEach((res, i) => {
        const { scope, key } = fetches[i];
        if (res.status === 'fulfilled') {
          enrichedPromises.push(
            (async () => {
              const val = await enrich(res.value);
              out[scope] = val;
              setCache(key, val);
            })()
          );
        } else {
          errors[scope] = res.reason?.message ?? 'Fetch failed';
          logger.error?.('leaderboard scope fetch failed', { scope, error: String(res.reason) });
        }
      });

      if (enrichedPromises.length) await Promise.allSettled(enrichedPromises);
    }

    const payload = Object.keys(errors).length ? { ...out, errors } : out;

    return jsonWithETag(req, payload, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    logger.error('Error fetching helldivers leaderboard batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard batch' },
      { status: 500 }
    );
  }
}
