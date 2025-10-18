// src/lib/helldiversLeaderboard.ts
import { getMongoClientPromise } from '@/lib/mongodb';

export const VALID_SORT_FIELDS = [
  'Kills',
  'Accuracy',
  'Shots Fired',
  'Shots Hit',
  'Deaths',
  'Melee Kills',
  'Stims Used',
  'Strats Used',
  'player_name',
  'clan_name',
  'submitted_at',
  'Avg Kills',
  'Avg Shots Fired',
  'Avg Shots Hit',
  'Avg Deaths',
] as const;

export type SortField = (typeof VALID_SORT_FIELDS)[number];
export type SortDir = 'asc' | 'desc';
export type LeaderboardScope = 'month' | 'week' | 'day' | 'lifetime' | 'solo' | 'squad';

export interface HelldiversLeaderboardRow {
  rank: number;
  id: string;
  player_name: string;
  Kills: number | string;
  Accuracy: string;
  ShotsFired: number;
  ShotsHit: number;
  Deaths: number | string;
  clan_name?: string;
  submitted_by?: string;
  submitted_at?: string | Date | null;
  discord_id?: string | number | null;
  discord_server_id?: string | number | null;
  // Added aggregated average fields for lifetime scope
  AvgKills?: number;
  AvgShotsFired?: number;
  AvgShotsHit?: number;
  AvgDeaths?: number;
}

function getDbName(): string {
  return process.env.MONGODB_DB || 'GPTHellbot';
}

export function getMonthRange(monthZeroIndexed: number, year: number) {
  const start = new Date(Date.UTC(year, monthZeroIndexed, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthZeroIndexed + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function fetchHelldiversLeaderboard(options?: {
  sortBy?: SortField;
  sortDir?: SortDir;
  limit?: number;
  scope?: LeaderboardScope;
  month?: number; // 1-12, optional when scope==='month'
  year?: number; // 4-digit year, optional when scope==='month'
}): Promise<{
  sortBy: SortField;
  sortDir: SortDir;
  limit: number;
  results: HelldiversLeaderboardRow[];
}> {
  const sortBy = (
    options?.sortBy && VALID_SORT_FIELDS.includes(options.sortBy)
      ? options.sortBy
      : 'Kills'
  ) as SortField;
  const sortDir: SortDir = options?.sortDir === 'asc' ? 'asc' : 'desc';
  const limit =
    options?.limit && options.limit > 0 ? Math.min(options.limit, 1000) : 100;
  const scope: LeaderboardScope =
    options?.scope === 'lifetime'
      ? 'lifetime'
      : options?.scope === 'solo'
        ? 'solo'
        : options?.scope === 'squad'
          ? 'squad'
          : options?.scope === 'week'
            ? 'week'
            : options?.scope === 'day'
              ? 'day'
              : 'month';

  const client = await getMongoClientPromise();
  const db = client.db(getDbName());

  const pipeline: any[] = [
    {
      $addFields: {
        numericKills: {
          $toDouble: {
            $ifNull: [{ $getField: { field: 'Kills', input: '$$ROOT' } }, 0],
          },
        },
        numericDeaths: {
          $toDouble: {
            $ifNull: [{ $getField: { field: 'Deaths', input: '$$ROOT' } }, 0],
          },
        },
        numericShotsFired: {
          $toDouble: {
            $ifNull: [
              { $getField: { field: 'Shots Fired', input: '$$ROOT' } },
              0,
            ],
          },
        },
        numericShotsHit: {
          $toDouble: {
            $ifNull: [
              { $getField: { field: 'Shots Hit', input: '$$ROOT' } },
              0,
            ],
          },
        },
        numericMeleeKills: {
          $toDouble: {
            $ifNull: [
              { $getField: { field: 'Melee Kills', input: '$$ROOT' } },
              0,
            ],
          },
        },
        numericStimsUsed: {
          $toDouble: {
            $ifNull: [
              { $getField: { field: 'Stims Used', input: '$$ROOT' } },
              0,
            ],
          },
        },
        numericStratsUsed: {
          $toDouble: {
            $ifNull: [
              { $getField: { field: 'Strats Used', input: '$$ROOT' } },
              0,
            ],
          },
        },
        numericAccuracy: {
          $toDouble: {
            $replaceAll: {
              input: {
                $toString: {
                  $ifNull: [
                    { $getField: { field: 'Accuracy', input: '$$ROOT' } },
                    '0',
                  ],
                },
              },
              find: '%',
              replacement: '',
            },
          },
        },
        submittedAtDate: {
          $toDate: {
            $ifNull: [
              { $getField: { field: 'submitted_at', input: '$$ROOT' } },
              null,
            ],
          },
        },
        memberKey: { $toString: { $ifNull: ['$discord_id', '$player_name'] } },
        sesTitle: { $ifNull: [{ $getField: { field: 'SES', input: '$$ROOT' } }, null] },
      },
    },
  ];

  if (scope === 'month') {
    const now = new Date();
    const monthProvided =
      options?.month && options.month >= 1 && options.month <= 12
        ? options.month
        : now.getUTCMonth() + 1;
    const yearProvided =
      options?.year && options.year >= 1970
        ? options.year
        : now.getUTCFullYear();
    const { start, end } = getMonthRange(monthProvided - 1, yearProvided);
    pipeline.push({ $match: { submittedAtDate: { $gte: start, $lt: end } } });

    pipeline.push({
      $group: {
        _id: '$memberKey',
        player_name: { $first: '$player_name' },
        clan_name: { $first: '$clan_name' },
        discord_id: { $first: '$discord_id' },
        discord_server_id: { $first: '$discord_server_id' },
        lastSubmittedAt: { $max: '$submittedAtDate' },
        totalKills: { $sum: '$numericKills' },
        totalDeaths: { $sum: '$numericDeaths' },
        totalShotsFired: { $sum: '$numericShotsFired' },
        totalShotsHit: { $sum: '$numericShotsHit' },
        totalMeleeKills: { $sum: '$numericMeleeKills' },
        totalStimsUsed: { $sum: '$numericStimsUsed' },
        totalStratsUsed: { $sum: '$numericStratsUsed' },
        sesTitle: { $last: '$sesTitle' },
      },
    });
    pipeline.push({
      $addFields: {
        accuracyPct: {
          $cond: [
            { $gt: ['$totalShotsFired', 0] },
            { $multiply: [{ $divide: ['$totalShotsHit', '$totalShotsFired'] }, 100] },
            0,
          ],
        },
      },
    });

    const sortStage: Record<string, 1 | -1> = {};
    const dir: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'Kills':
        sortStage['totalKills'] = dir;
        break;
      case 'Accuracy':
        sortStage['accuracyPct'] = dir;
        break;
      case 'Shots Fired':
        sortStage['totalShotsFired'] = dir;
        break;
      case 'Shots Hit':
        sortStage['totalShotsHit'] = dir;
        break;
      case 'Deaths':
        sortStage['totalDeaths'] = dir;
        break;
      case 'Melee Kills':
        sortStage['totalMeleeKills'] = dir;
        break;
      case 'Stims Used':
        sortStage['totalStimsUsed'] = dir;
        break;
      case 'Strats Used':
        sortStage['totalStratsUsed'] = dir;
        break;
      case 'player_name':
        sortStage['player_name'] = dir;
        break;
      case 'clan_name':
        sortStage['clan_name'] = dir;
        break;
      case 'submitted_at':
        sortStage['lastSubmittedAt'] = dir;
        break;
      default:
        sortStage['totalKills'] = dir;
        break;
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $limit: limit });
    pipeline.push({
      $project: {
        _id: 1,
        player_name: 1,
        clan_name: 1,
        discord_id: 1,
        discord_server_id: 1,
        submitted_at: '$lastSubmittedAt',
        Kills: '$totalKills',
        Deaths: '$totalDeaths',
        'Shots Fired': '$totalShotsFired',
        'Shots Hit': '$totalShotsHit',
        MeleeKills: '$totalMeleeKills',
        StimsUsed: '$totalStimsUsed',
        StratsUsed: '$totalStratsUsed',
        accuracyPct: 1,
        sesTitle: 1,
      },
    });
  } else if (scope === 'day') {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 1);
    pipeline.push({ $match: { submittedAtDate: { $gte: start, $lt: end } } });

    pipeline.push({
      $group: {
        _id: '$memberKey',
        player_name: { $first: '$player_name' },
        clan_name: { $first: '$clan_name' },
        discord_id: { $first: '$discord_id' },
        discord_server_id: { $first: '$discord_server_id' },
        lastSubmittedAt: { $max: '$submittedAtDate' },
        totalKills: { $sum: '$numericKills' },
        totalDeaths: { $sum: '$numericDeaths' },
        totalShotsFired: { $sum: '$numericShotsFired' },
        totalShotsHit: { $sum: '$numericShotsHit' },
        totalMeleeKills: { $sum: '$numericMeleeKills' },
        totalStimsUsed: { $sum: '$numericStimsUsed' },
        totalStratsUsed: { $sum: '$numericStratsUsed' },
        sesTitle: { $last: '$sesTitle' },
      },
    });
    pipeline.push({
      $addFields: {
        accuracyPct: {
          $cond: [
            { $gt: ['$totalShotsFired', 0] },
            { $multiply: [{ $divide: ['$totalShotsHit', '$totalShotsFired'] }, 100] },
            0,
          ],
        },
      },
    });

    const sortStage: Record<string, 1 | -1> = {};
    const dir: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'Kills':
        sortStage['totalKills'] = dir;
        break;
      case 'Accuracy':
        sortStage['accuracyPct'] = dir;
        break;
      case 'Shots Fired':
        sortStage['totalShotsFired'] = dir;
        break;
      case 'Shots Hit':
        sortStage['totalShotsHit'] = dir;
        break;
      case 'Deaths':
        sortStage['totalDeaths'] = dir;
        break;
      case 'Melee Kills':
        sortStage['totalMeleeKills'] = dir;
        break;
      case 'Stims Used':
        sortStage['totalStimsUsed'] = dir;
        break;
      case 'Strats Used':
        sortStage['totalStratsUsed'] = dir;
        break;
      case 'player_name':
        sortStage['player_name'] = dir;
        break;
      case 'clan_name':
        sortStage['clan_name'] = dir;
        break;
      case 'submitted_at':
        sortStage['lastSubmittedAt'] = dir;
        break;
      default:
        sortStage['totalKills'] = dir;
        break;
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $limit: limit });
    pipeline.push({
      $project: {
        _id: 1,
        player_name: 1,
        clan_name: 1,
        discord_id: 1,
        discord_server_id: 1,
        submitted_at: '$lastSubmittedAt',
        Kills: '$totalKills',
        Deaths: '$totalDeaths',
        'Shots Fired': '$totalShotsFired',
        'Shots Hit': '$totalShotsHit',
        MeleeKills: '$totalMeleeKills',
        StimsUsed: '$totalStimsUsed',
        StratsUsed: '$totalStratsUsed',
        accuracyPct: 1,
        sesTitle: 1,
      },
    });
  } else if (scope === 'week') {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 7);
    pipeline.push({ $match: { submittedAtDate: { $gte: start, $lt: end } } });

    pipeline.push({
      $group: {
        _id: '$memberKey',
        player_name: { $first: '$player_name' },
        clan_name: { $first: '$clan_name' },
        discord_id: { $first: '$discord_id' },
        discord_server_id: { $first: '$discord_server_id' },
        lastSubmittedAt: { $max: '$submittedAtDate' },
        totalKills: { $sum: '$numericKills' },
        totalDeaths: { $sum: '$numericDeaths' },
        totalShotsFired: { $sum: '$numericShotsFired' },
        totalShotsHit: { $sum: '$numericShotsHit' },
        totalMeleeKills: { $sum: '$numericMeleeKills' },
        totalStimsUsed: { $sum: '$numericStimsUsed' },
        totalStratsUsed: { $sum: '$numericStratsUsed' },
        sesTitle: { $last: '$sesTitle' },
      },
    });
    pipeline.push({
      $addFields: {
        accuracyPct: {
          $cond: [
            { $gt: ['$totalShotsFired', 0] },
            { $multiply: [{ $divide: ['$totalShotsHit', '$totalShotsFired'] }, 100] },
            0,
          ],
        },
      },
    });

    const sortStage: Record<string, 1 | -1> = {};
    const dir: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'Kills':
        sortStage['totalKills'] = dir;
        break;
      case 'Accuracy':
        sortStage['accuracyPct'] = dir;
        break;
      case 'Shots Fired':
        sortStage['totalShotsFired'] = dir;
        break;
      case 'Shots Hit':
        sortStage['totalShotsHit'] = dir;
        break;
      case 'Deaths':
        sortStage['totalDeaths'] = dir;
        break;
      case 'player_name':
        sortStage['player_name'] = dir;
        break;
      case 'clan_name':
        sortStage['clan_name'] = dir;
        break;
      case 'submitted_at':
        sortStage['lastSubmittedAt'] = dir;
        break;
      default:
        sortStage['totalKills'] = dir;
        break;
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $limit: limit });
    pipeline.push({
      $project: {
        _id: 1,
        player_name: 1,
        clan_name: 1,
        discord_id: 1,
        discord_server_id: 1,
        submitted_at: '$lastSubmittedAt',
        Kills: '$totalKills',
        Deaths: '$totalDeaths',
        'Shots Fired': '$totalShotsFired',
        'Shots Hit': '$totalShotsHit',
        MeleeKills: '$totalMeleeKills',
        StimsUsed: '$totalStimsUsed',
        StratsUsed: '$totalStratsUsed',
        accuracyPct: 1,
        sesTitle: 1,
      },
    });
  } else if (scope === 'solo') {
    // Solo scope: aggregate per member across Solo_Stats
    pipeline.push({ $sort: { submittedAtDate: 1 } });
    pipeline.push({
      $group: {
        _id: '$memberKey',
        player_name: { $last: '$player_name' },
        clan_name: { $last: '$clan_name' },
        discord_id: { $last: '$discord_id' },
        discord_server_id: { $last: '$discord_server_id' },
        submitted_by: { $last: '$submitted_by' },
        lastSubmittedAt: { $last: '$submittedAtDate' },
        totalKills: { $sum: '$numericKills' },
        totalShotsFired: { $sum: '$numericShotsFired' },
        totalShotsHit: { $sum: '$numericShotsHit' },
        totalDeaths: { $sum: '$numericDeaths' },
        totalMeleeKills: { $sum: '$numericMeleeKills' },
        totalStimsUsed: { $sum: '$numericStimsUsed' },
        totalStratsUsed: { $sum: '$numericStratsUsed' },
        sesTitle: { $last: '$sesTitle' },
        submissionsCount: { $sum: 1 },
      },
    });
    pipeline.push({
      $addFields: {
        accuracyPct: {
          $cond: [
            { $gt: ['$totalShotsFired', 0] },
            { $multiply: [{ $divide: ['$totalShotsHit', '$totalShotsFired'] }, 100] },
            0,
          ],
        },
      },
    });

    const sortStage: Record<string, 1 | -1> = {};
    const dir: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'Kills':
        sortStage['totalKills'] = dir;
        break;
      case 'Accuracy':
        sortStage['accuracyPct'] = dir;
        break;
      case 'Shots Fired':
        sortStage['totalShotsFired'] = dir;
        break;
      case 'Shots Hit':
        sortStage['totalShotsHit'] = dir;
        break;
      case 'Deaths':
        sortStage['totalDeaths'] = dir;
        break;
      case 'Melee Kills':
        sortStage['totalMeleeKills'] = dir;
        break;
      case 'Stims Used':
        sortStage['totalStimsUsed'] = dir;
        break;
      case 'Strats Used':
        sortStage['totalStratsUsed'] = dir;
        break;
      case 'player_name':
        sortStage['player_name'] = dir;
        break;
      case 'clan_name':
        sortStage['clan_name'] = dir;
        break;
      case 'submitted_at':
        sortStage['lastSubmittedAt'] = dir;
        break;
      default:
        sortStage['totalKills'] = dir;
        break;
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $limit: limit });
    pipeline.push({
      $project: {
        _id: 1,
        player_name: 1,
        clan_name: 1,
        discord_id: 1,
        discord_server_id: 1,
        submitted_by: 1,
        submitted_at: '$lastSubmittedAt',
        Kills: '$totalKills',
        'Shots Fired': '$totalShotsFired',
        'Shots Hit': '$totalShotsHit',
        Deaths: '$totalDeaths',
        MeleeKills: '$totalMeleeKills',
        StimsUsed: '$totalStimsUsed',
        StratsUsed: '$totalStratsUsed',
        accuracyPct: 1,
        avgKills: 1,
        avgShotsFired: 1,
        avgShotsHit: 1,
        avgDeaths: 1,
      },
    });
  } else {
    // Lifetime scope: union of configured month collections + current month 'User_Stats'
    // Default months: April, May, June 2025 per requirements
    const defaultMonths = ['User_Stats_2025_04', 'User_Stats_2025_05', 'User_Stats_2025_06'];
    const envList = (process.env.LIFETIME_MONTH_COLLECTIONS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const monthCollections = envList.length ? envList : defaultMonths;

    // Build union pipeline: start from current month 'User_Stats'
    // Note: We'll execute the aggregate against 'User_Stats' at the end of this function
    //       and add $unionWith stages for the archival monthly collections.
    const lifetimePipeline: any[] = [];
    // Append our normalization stage for the base collection already defined as 'pipeline[0]'
    lifetimePipeline.push(...pipeline);

    // Add unionWith for each archival month collection
    for (const coll of monthCollections) {
      lifetimePipeline.push({
        $unionWith: {
          coll,
          pipeline: pipeline, // reuse the same $addFields normalization
        },
      });
    }

    lifetimePipeline.push({ $sort: { submittedAtDate: 1 } });
    lifetimePipeline.push({
      $group: {
        _id: '$memberKey',
        player_name: { $last: '$player_name' },
        clan_name: { $last: '$clan_name' },
        discord_id: { $last: '$discord_id' },
        discord_server_id: { $last: '$discord_server_id' },
        submitted_by: { $last: '$submitted_by' },
        lastSubmittedAt: { $last: '$submittedAtDate' },
        totalKills: { $sum: '$numericKills' },
        totalShotsFired: { $sum: '$numericShotsFired' },
        totalShotsHit: { $sum: '$numericShotsHit' },
        totalDeaths: { $sum: '$numericDeaths' },
        totalMeleeKills: { $sum: '$numericMeleeKills' },
        totalStimsUsed: { $sum: '$numericStimsUsed' },
        totalStratsUsed: { $sum: '$numericStratsUsed' },
        sesTitle: { $last: '$sesTitle' },
        submissionsCount: { $sum: 1 },
      },
    });
    lifetimePipeline.push({
      $addFields: {
        avgKills: {
          $cond: [
            { $gt: ['$submissionsCount', 0] },
            { $divide: ['$totalKills', '$submissionsCount'] },
            0,
          ],
        },
        avgShotsFired: {
          $cond: [
            { $gt: ['$submissionsCount', 0] },
            { $divide: ['$totalShotsFired', '$submissionsCount'] },
            0,
          ],
        },
        avgShotsHit: {
          $cond: [
            { $gt: ['$submissionsCount', 0] },
            { $divide: ['$totalShotsHit', '$submissionsCount'] },
            0,
          ],
        },
        avgDeaths: {
          $cond: [
            { $gt: ['$submissionsCount', 0] },
            { $divide: ['$totalDeaths', '$submissionsCount'] },
            0,
          ],
        },
        accuracyPct: {
          $cond: [
            { $gt: ['$totalShotsFired', 0] },
            {
              $multiply: [
                { $divide: ['$totalShotsHit', '$totalShotsFired'] },
                100,
              ],
            },
            0,
          ],
        },
      },
    });

    const sortStageLifetime: Record<string, 1 | -1> = {};
    const dir: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'Kills':
        sortStageLifetime['totalKills'] = dir;
        break;
      case 'Accuracy':
        sortStageLifetime['accuracyPct'] = dir;
        break;
      case 'Shots Fired':
        sortStageLifetime['totalShotsFired'] = dir;
        break;
      case 'Shots Hit':
        sortStageLifetime['totalShotsHit'] = dir;
        break;
      case 'Deaths':
        sortStageLifetime['totalDeaths'] = dir;
        break;
      case 'Melee Kills':
        sortStageLifetime['totalMeleeKills'] = dir;
        break;
      case 'Stims Used':
        sortStageLifetime['totalStimsUsed'] = dir;
        break;
      case 'Strats Used':
        sortStageLifetime['totalStratsUsed'] = dir;
        break;
      case 'player_name':
        sortStageLifetime['player_name'] = dir;
        break;
      case 'clan_name':
        sortStageLifetime['clan_name'] = dir;
        break;
      case 'submitted_at':
        sortStageLifetime['lastSubmittedAt'] = dir;
        break;
      case 'Avg Kills':
        sortStageLifetime['avgKills'] = dir;
        break;
      case 'Avg Shots Fired':
        sortStageLifetime['avgShotsFired'] = dir;
        break;
      case 'Avg Shots Hit':
        sortStageLifetime['avgShotsHit'] = dir;
        break;
      case 'Avg Deaths':
        sortStageLifetime['avgDeaths'] = dir;
        break;
      default:
        sortStageLifetime['totalKills'] = dir;
        break;
    }

    lifetimePipeline.push({ $sort: sortStageLifetime });
    lifetimePipeline.push({ $limit: limit });
    lifetimePipeline.push({
      $project: {
        _id: 1,
        player_name: 1,
        clan_name: 1,
        discord_id: 1,
        discord_server_id: 1,
        submitted_by: 1,
        submitted_at: '$lastSubmittedAt',
        Kills: '$totalKills',
        'Shots Fired': '$totalShotsFired',
        'Shots Hit': '$totalShotsHit',
        Deaths: '$totalDeaths',
        MeleeKills: '$totalMeleeKills',
        StimsUsed: '$totalStimsUsed',
        StratsUsed: '$totalStratsUsed',
        accuracyPct: 1,
        avgKills: 1,
        avgShotsFired: 1,
        avgShotsHit: 1,
        avgDeaths: 1,
      },
    });

    // Execute against 'User_Stats' (base), with unions for archival months
    const cursor = db.collection('User_Stats').aggregate(lifetimePipeline, { allowDiskUse: true });
    const results = await cursor.toArray();

    const formatted: HelldiversLeaderboardRow[] = results.map(
      (doc: any, index: number) => ({
        rank: index + 1,
        id: String(doc._id),
        player_name: doc.player_name || '',
        Kills: doc.Kills ?? 0,
        Accuracy:
          typeof doc.accuracyPct === 'number'
            ? `${doc.accuracyPct.toFixed(1)}%`
            : typeof doc.Accuracy === 'string'
              ? doc.Accuracy
              : typeof doc.numericAccuracy === 'number'
                ? `${doc.numericAccuracy.toFixed(1)}%`
                : '',
        ShotsFired: doc['Shots Fired'] ?? 0,
        ShotsHit: doc['Shots Hit'] ?? 0,
        Deaths: doc.Deaths ?? 0,
        MeleeKills: doc.MeleeKills ?? doc['Melee Kills'] ?? 0,
        StimsUsed: doc.StimsUsed ?? doc['Stims Used'] ?? 0,
        StratsUsed: doc.StratsUsed ?? doc['Strats Used'] ?? 0,
        discord_id: doc.discord_id || null,
        discord_server_id: doc.discord_server_id || null,
        clan_name: doc.clan_name || '',
        submitted_by: doc.submitted_by || '',
        submitted_at: doc.submitted_at || null,
        sesTitle: doc.sesTitle || null,
        AvgKills:
          typeof doc.avgKills === 'number' ? Number(doc.avgKills) : undefined,
        AvgShotsFired:
          typeof doc.avgShotsFired === 'number'
            ? Number(doc.avgShotsFired)
            : undefined,
        AvgShotsHit:
          typeof doc.avgShotsHit === 'number'
            ? Number(doc.avgShotsHit)
            : undefined,
        AvgDeaths:
          typeof doc.avgDeaths === 'number' ? Number(doc.avgDeaths) : undefined,
      })
    );

    return { sortBy, sortDir, limit, results: formatted };
  }

  const collectionName =
    scope === 'lifetime'
      ? 'User_Stats'
      : scope === 'solo'
        ? 'Solo_Stats'
        : scope === 'squad'
          ? 'Squad_Stats'
          : 'User_Stats';
  const cursor = db
    .collection(collectionName)
    .aggregate(pipeline, { allowDiskUse: true });
  const results = await cursor.toArray();

  const formatted: HelldiversLeaderboardRow[] = results.map(
    (doc: any, index: number) => ({
      rank: index + 1,
      id: String(doc._id),
      player_name: doc.player_name || '',
      Kills: doc.Kills ?? 0,
      Accuracy:
        typeof doc.accuracyPct === 'number'
          ? `${doc.accuracyPct.toFixed(1)}%`
          : typeof doc.Accuracy === 'string'
            ? doc.Accuracy
            : typeof doc.numericAccuracy === 'number'
              ? `${doc.numericAccuracy.toFixed(1)}%`
              : '',
      ShotsFired: doc['Shots Fired'] ?? 0,
      ShotsHit: doc['Shots Hit'] ?? 0,
      Deaths: doc.Deaths ?? 0,
      MeleeKills: doc.MeleeKills ?? doc['Melee Kills'] ?? 0,
      StimsUsed: doc.StimsUsed ?? doc['Stims Used'] ?? 0,
      StratsUsed: doc.StratsUsed ?? doc['Strats Used'] ?? 0,
      discord_id: doc.discord_id || null,
      discord_server_id: doc.discord_server_id || null,
      clan_name: doc.clan_name || '',
      submitted_by: doc.submitted_by || '',
      submitted_at: doc.submitted_at || null,
      sesTitle: doc.sesTitle || null,
      AvgKills:
        typeof doc.avgKills === 'number' ? Number(doc.avgKills) : undefined,
      AvgShotsFired:
        typeof doc.avgShotsFired === 'number'
          ? Number(doc.avgShotsFired)
          : undefined,
      AvgShotsHit:
        typeof doc.avgShotsHit === 'number'
          ? Number(doc.avgShotsHit)
          : undefined,
      AvgDeaths:
        typeof doc.avgDeaths === 'number' ? Number(doc.avgDeaths) : undefined,
    })
  );

  return { sortBy, sortDir, limit, results: formatted };
}
