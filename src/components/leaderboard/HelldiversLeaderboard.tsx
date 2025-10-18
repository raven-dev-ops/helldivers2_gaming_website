// src/components/leaderboard/HelldiversLeaderboard.tsx

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import base from '@/styles/Base.module.css';
import lb from '@/styles/LeaderboardPage.module.css';

type SortField =
  | 'Kills'
  | 'Accuracy'
  | 'Shots Fired'
  | 'Shots Hit'
  | 'Deaths'
  | 'player_name'
  | 'clan_name'
  | 'submitted_at'
  | 'Avg Kills'
  | 'Avg Shots Fired'
  | 'Avg Shots Hit'
  | 'Avg Deaths';

type SortDir = 'asc' | 'desc';

function getWeekNumber(d: Date) {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface LeaderboardRow {
  rank: number;
  id: string;
  player_name: string;
  Kills: number | string;
  Accuracy: string;
  ShotsFired: number;
  ShotsHit: number;
  Deaths: number | string;
  clan_name?: string;
  submitted_at?: string | Date | null;
  discord_id?: string | number | null;
  discord_server_id?: string | number | null;
  AvgKills?: number;
  AvgShotsFired?: number;
  AvgShotsHit?: number;
  AvgDeaths?: number;
}

interface LeaderboardPayload {
  day?: { results: LeaderboardRow[]; error?: number };
  week?: { results: LeaderboardRow[]; error?: number };
  month?: { results: LeaderboardRow[]; error?: number };
  lifetime?: { results: LeaderboardRow[]; error?: number };
  solo?: { results: LeaderboardRow[]; error?: number };
  squad?: { results: LeaderboardRow[]; error?: number };
}

const sortFieldMap: Record<SortField, keyof LeaderboardRow> = {
  Kills: 'Kills',
  Accuracy: 'Accuracy',
  'Shots Fired': 'ShotsFired',
  'Shots Hit': 'ShotsHit',
  Deaths: 'Deaths',
  player_name: 'player_name',
  clan_name: 'clan_name',
  submitted_at: 'submitted_at',
  'Avg Kills': 'AvgKills',
  'Avg Shots Fired': 'AvgShotsFired',
  'Avg Shots Hit': 'AvgShotsHit',
  'Avg Deaths': 'AvgDeaths',
};

function sortRows(
  rows: LeaderboardRow[],
  sortBy: SortField,
  sortDir: SortDir
): LeaderboardRow[] {
  const key = sortFieldMap[sortBy];
  const sorted = [...rows].sort((a, b) => {
    const aVal: any = (a as any)[key];
    const bVal: any = (b as any)[key];
    const toNum = (v: any) => {
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v).replace('%', ''));
      return isNaN(n) ? null : n;
    };
    const aNum = toNum(aVal);
    const bNum = toNum(bVal);
    if (aNum !== null && bNum !== null) {
      return aNum - bNum;
    }
    return String(aVal ?? '').localeCompare(String(bVal ?? ''));
  });
  return sortDir === 'asc' ? sorted : sorted.reverse();
}

function HeaderButton({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string;
  sortKey: SortField;
  activeSort: { sortBy: SortField; sortDir: SortDir };
  onSort: (field: SortField) => void;
}) {
  const isActive = activeSort.sortBy === sortKey;
  const iconClass = `${lb.sortIcon} ${isActive && activeSort.sortDir === 'asc' ? lb.sortIconAsc : lb.sortIconDesc}`;
  return (
    <button
      className={lb.sortBtn}
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label}`}
      aria-pressed={isActive}
    >
      {label} <i className={iconClass} />
    </button>
  );
}

function LeaderboardTableSection({
  title,
  rows,
  loading,
  error,
  activeSort,
  onSort,
  showAverages,
  showTotals = true,
  searchTerm,
  onSearch,
  sectionId,
  tabsNode,
}: {
  title: string;
  rows: LeaderboardRow[];
  loading: boolean;
  error: string | null;
  activeSort: { sortBy: SortField; sortDir: SortDir };
  onSort: (f: SortField) => void;
  showAverages?: boolean;
  showTotals?: boolean;
  searchTerm: string;
  onSearch: (v: string) => void;
  sectionId?: string;
  tabsNode?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    row: LeaderboardRow;
    profile?: {
      name?: string | null;
      callsign?: string | null;
      rankTitle?: string | null;
      motto?: string | null;
      avatarUrl?: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    let abort = new AbortController();
    const row = hover?.row;
    if (row) {
      const qs = row.discord_id
        ? `discordId=${encodeURIComponent(String(row.discord_id))}`
        : `name=${encodeURIComponent(row.player_name)}`;
      fetch(`/api/users/lookup?${qs}`, {
        signal: abort.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (!json) return;
          setHover((prev) => (prev ? { ...prev, profile: json } : prev));
        })
        .catch(() => {});
    }
    return () => abort.abort();
  }, [hover?.row?.player_name, hover?.row?.discord_id]);

  const hasAverages =
    showAverages &&
    rows.length > 0 &&
    (typeof rows[0].AvgKills === 'number' ||
      typeof rows[0].AvgShotsFired === 'number' ||
      typeof rows[0].AvgShotsHit === 'number' ||
      typeof rows[0].AvgDeaths === 'number');

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredRows = normalizedQuery
    ? rows.filter((r) => (r.player_name || '').toLowerCase().includes(normalizedQuery))
    : rows;

  const totalColumns =
    2 +
    1 +
    (showTotals ? 4 : 0) +
    (hasAverages ? 4 : 0);

  return (
    <section id={sectionId} className={base.section}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      {tabsNode}
      <div className={lb.card}>
        <div className={lb.toolbar}>
          <input
            aria-label={`Search ${title} by player name`}
            placeholder="Search by player name..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className={lb.search}
            style={{ maxWidth: 320 }}
          />
        </div>
        {error && <p style={{ padding: 12, color: 'var(--color-error)' }}>Error: {error}</p>}
        {loading ? (
          <p style={{ padding: 12 }}>Loading leaderboard…</p>
        ) : (
          <div className={`${lb.tableWrap} ${lb.hoverCardContainer}`} ref={wrapRef}>
            <table className={lb.table}>
              <thead className={lb.thead}>
                <tr>
                  <th className={`${lb.th} ${lb.rankCol}`} style={{ width: 64, textAlign: 'right' }}>#</th>
                  <th className={`${lb.th} ${lb.nameCol}`}>
                    <HeaderButton label="Player" sortKey="player_name" activeSort={activeSort} onSort={onSort} />
                  </th>
                  {showTotals && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Kills" sortKey="Kills" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {hasAverages && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Avg Kills" sortKey="Avg Kills" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                    <HeaderButton label="Accuracy" sortKey="Accuracy" activeSort={activeSort} onSort={onSort} />
                  </th>
                  {showTotals && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Shots Fired" sortKey="Shots Fired" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {hasAverages && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Avg Shots Fired" sortKey="Avg Shots Fired" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {showTotals && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Shots Hit" sortKey="Shots Hit" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {hasAverages && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Avg Shots Hit" sortKey="Avg Shots Hit" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {showTotals && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Deaths" sortKey="Deaths" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                  {hasAverages && (
                    <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                      <HeaderButton label="Avg Deaths" sortKey="Avg Deaths" activeSort={activeSort} onSort={onSort} />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onMouseEnter={(e) => {
                      const container = wrapRef.current;
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      const rowRect = (e.currentTarget as HTMLTableRowElement).getBoundingClientRect();
                      const x = Math.max(8, Math.min(rowRect.left - rect.left + 16, rect.width - 340));
                      const y = Math.max(8, rowRect.top - rect.top + rowRect.height + 6 - 60);
                      setHover({ x, y, row, profile: null });
                    }}
                    onMouseLeave={() => setHover(null)}
                    className={lb.tr}
                  >
                    <td className={`${lb.td} ${lb.rankCol}`} style={{ textAlign: 'right' }}>{row.rank}</td>
                    <td className={`${lb.td} ${lb.nameCol}`}>
                      <span className={lb.playerCell}>
                        <span className={lb.avatar} aria-hidden>?</span>
                        {row.player_name}
                      </span>
                    </td>
                    {showTotals && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Kills}</td>
                    )}
                    {hasAverages && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                        {typeof row.AvgKills === 'number' ? row.AvgKills.toFixed(1) : ''}
                      </td>
                    )}
                    <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Accuracy}</td>
                    {showTotals && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.ShotsFired}</td>
                    )}
                    {hasAverages && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                        {typeof row.AvgShotsFired === 'number' ? row.AvgShotsFired.toFixed(1) : ''}
                      </td>
                    )}
                    {showTotals && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.ShotsHit}</td>
                    )}
                    {hasAverages && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                        {typeof row.AvgShotsHit === 'number' ? row.AvgShotsHit.toFixed(1) : ''}
                      </td>
                    )}
                    {showTotals && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Deaths}</td>
                    )}
                    {hasAverages && (
                      <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>
                        {typeof row.AvgDeaths === 'number' ? row.AvgDeaths.toFixed(1) : ''}
                      </td>
                    )}
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr>
                    <td className={lb.td} colSpan={totalColumns}>No matching players.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {hover && (
              <div
                className={lb.hoverCard}
                style={{ ['--x' as any]: `${hover.x}px`, ['--y' as any]: `${hover.y}px` }}
              >
                <div className={lb.hoverHeader}>
                  {hover.profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hover.profile.avatarUrl} alt="Avatar" className={lb.hoverAvatar} />
                  ) : (
                    <div className={lb.hoverAvatar}>?</div>
                  )}
                  <div>
                    <div className={lb.hoverName}>{hover.profile?.name || hover.row.player_name}</div>
                    <div className={lb.hoverSub}>
                      {hover.profile?.callsign || 'Unknown'}
                      {hover.profile?.rankTitle ? ` • ${hover.profile.rankTitle}` : ''}
                      {hover.row.clan_name ? ` • ${hover.row.clan_name}` : ''}
                    </div>
                  </div>
                </div>
                <div className={lb.hoverGrid}>
                  <div className={lb.hoverStat}>
                    <div className={lb.hoverStatLabel}>Kills</div>
                    <div className={lb.hoverStatValue}>{hover.row.Kills}</div>
                  </div>
                  <div className={lb.hoverStat}>
                    <div className={lb.hoverStatLabel}>Deaths</div>
                    <div className={lb.hoverStatValue}>{hover.row.Deaths}</div>
                  </div>
                  <div className={lb.hoverStat}>
                    <div className={lb.hoverStatLabel}>Accuracy</div>
                    <div className={lb.hoverStatValue}>{hover.row.Accuracy}</div>
                  </div>
                  <div className={lb.hoverStat}>
                    <div className={lb.hoverStatLabel}>K/D</div>
                    <div className={lb.hoverStatValue}>
                      {(() => {
                        const k = Number(hover.row.Kills);
                        const d = Number(hover.row.Deaths);
                        if (!isFinite(k) || !isFinite(d) || d === 0) return '—';
                        return (k / d).toFixed(2);
                      })()}
                    </div>
                  </div>
                </div>
                {hover.row.submitted_at ? (
                  <div className={lb.hoverSub} style={{ marginTop: 6 }}>
                    Last submitted: {new Date(hover.row.submitted_at).toLocaleString()}
                  </div>
                ) : null}
                {hover.profile?.motto ? (
                  <div style={{ marginTop: 8 }} className={lb.hoverSub}>
                    “{hover.profile.motto}”
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HelldiversLeaderboard({
  initialData,
}: {
  initialData: LeaderboardPayload;
}) {
  const [sortBy, setSortBy] = useState<SortField>('Kills');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const monthData = useMemo(
    () => sortRows(initialData.month?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );
  const weekData = useMemo(
    () => sortRows(initialData.week?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );
  const dayData = useMemo(
    () => sortRows(initialData.day?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );
  const yearlyData = useMemo(
    () => sortRows(initialData.lifetime?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );
  const soloData = useMemo(
    () => sortRows(initialData.solo?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );
  const squadData = useMemo(
    () => sortRows(initialData.squad?.results || [], sortBy, sortDir),
    [initialData, sortBy, sortDir]
  );

  const monthError = initialData.month?.error ? `Request failed: ${initialData.month.error}` : null;
  const weekError = initialData.week?.error ? `Request failed: ${initialData.week.error}` : null;
  const dayError = initialData.day?.error ? `Request failed: ${initialData.day.error}` : null;
  const yearlyError = initialData.lifetime?.error ? `Request failed: ${initialData.lifetime.error}` : null;
  const soloError = initialData.solo?.error ? `Request failed: ${initialData.solo.error}` : null;
  const squadError = initialData.squad?.error ? `Request failed: ${initialData.squad.error}` : null;

  const isLoading = false;

  const [monthSearch, setMonthSearch] = useState<string>('');
  const [yearlyTotalsSearch, setYearlyTotalsSearch] = useState<string>('');
  const [weekSearch, setWeekSearch] = useState<string>('');
  const [daySearch, setDaySearch] = useState<string>('');
  const [soloSearch, setSoloSearch] = useState<string>('');
  const [squadSearch, setSquadSearch] = useState<string>('');

  const toggleSort = (field: SortField) => {
    if (field === sortBy) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'player_name' || field === 'clan_name' ? 'asc' : 'desc');
    }
  };

  const activeSort = { sortBy, sortDir };

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'solo' | 'squad'>('daily');

  useEffect(() => {
    const setTabFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (
        hash === 'daily' ||
        hash === 'weekly' ||
        hash === 'monthly' ||
        hash === 'yearly' ||
        hash === 'solo' ||
        hash === 'squad'
      ) {
        setActiveTab(hash as typeof activeTab);
      }
    };
    setTabFromHash();
    window.addEventListener('hashchange', setTabFromHash);
    return () => window.removeEventListener('hashchange', setTabFromHash);
  }, []);
  useEffect(() => {
    const hash = `#${activeTab}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [activeTab]);

  const now = new Date();
  const yearlyTitle = 'Yearly Leaderboard - 2025';
  const monthTitle = `Monthly Leaderboard - ${now.toLocaleString('default', { month: 'long' })} ${now.getUTCFullYear()}`;
  const dayTitle = `Daily Leaderboard - ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
  const weekTitle = `Weekly Leaderboard - Week ${getWeekNumber(now)} of ${now.getUTCFullYear()}`;
  const soloTitle = 'Solo Leaderboard';
  const squadTitle = 'Squad Leaderboard';

  return (
    <div className={lb.card}>
      {(() => {
        const tabs = (
          <div className={lb.tabs} role="tablist" aria-label="Scope">
            <button
              className={`${lb.tab} ${activeTab === 'daily' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('daily')}
              aria-pressed={activeTab === 'daily'}
              role="tab"
            >
              Day
            </button>
            <button
              className={`${lb.tab} ${activeTab === 'weekly' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('weekly')}
              aria-pressed={activeTab === 'weekly'}
              role="tab"
            >
              Week
            </button>
            <button
              className={`${lb.tab} ${activeTab === 'monthly' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('monthly')}
              aria-pressed={activeTab === 'monthly'}
              role="tab"
            >
              Month
            </button>
            <button
              className={`${lb.tab} ${activeTab === 'yearly' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('yearly')}
              aria-pressed={activeTab === 'yearly'}
              role="tab"
            >
              Lifetime
            </button>
            <button
              className={`${lb.tab} ${activeTab === 'solo' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('solo')}
              aria-pressed={activeTab === 'solo'}
              role="tab"
            >
              Solo
            </button>
            <button
              className={`${lb.tab} ${activeTab === 'squad' ? lb.tabActive : ''}`}
              onClick={() => setActiveTab('squad')}
              aria-pressed={activeTab === 'squad'}
              role="tab"
            >
              Squad
            </button>
          </div>
        );
        return (
          <>
            {activeTab === 'daily' && (
              <LeaderboardTableSection
                title={dayTitle}
                rows={dayData}
                loading={isLoading}
                error={dayError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={daySearch}
                onSearch={setDaySearch}
                sectionId="daily"
                tabsNode={tabs}
              />
            )}

            {activeTab === 'weekly' && (
              <LeaderboardTableSection
                title={weekTitle}
                rows={weekData}
                loading={isLoading}
                error={weekError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={weekSearch}
                onSearch={setWeekSearch}
                sectionId="weekly"
                tabsNode={tabs}
              />
            )}

            {activeTab === 'monthly' && (
              <LeaderboardTableSection
                title={monthTitle}
                rows={monthData}
                loading={isLoading}
                error={monthError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={monthSearch}
                onSearch={setMonthSearch}
                sectionId="monthly"
                tabsNode={tabs}
              />
            )}

            {activeTab === 'yearly' && (
              <LeaderboardTableSection
                title={yearlyTitle}
                rows={yearlyData}
                loading={isLoading}
                error={yearlyError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={yearlyTotalsSearch}
                onSearch={setYearlyTotalsSearch}
                sectionId="yearly"
                tabsNode={tabs}
              />
            )}

            {activeTab === 'solo' && (
              <LeaderboardTableSection
                title={soloTitle}
                rows={soloData}
                loading={isLoading}
                error={soloError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={soloSearch}
                onSearch={setSoloSearch}
                sectionId="solo"
                tabsNode={tabs}
              />
            )}

            {activeTab === 'squad' && (
              <LeaderboardTableSection
                title={squadTitle}
                rows={squadData}
                loading={isLoading}
                error={squadError}
                activeSort={activeSort}
                onSort={toggleSort}
                showAverages={false}
                showTotals={true}
                searchTerm={squadSearch}
                onSearch={setSquadSearch}
                sectionId="squad"
                tabsNode={tabs}
              />
            )}
          </>
        );
      })()}
    </div>
  );
}
