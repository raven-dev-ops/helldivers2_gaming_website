// src/components/leaderboard/HelldiversLeaderboard.tsx

'use client';

import React from 'react';
import base from '@/styles/Base.module.css';
import lb from '@/styles/LeaderboardPage.module.css';

type SortField =
  | 'Kills'
  | 'Accuracy'
  | 'Shots Fired'
  | 'Shots Hit'
  | 'Deaths'
  | 'Melee Kills'
  | 'Stims Used'
  | 'Strats Used'
  | 'player_name'
  | 'clan_name'
  | 'submitted_at'
  | 'Avg Kills'
  | 'Avg Shots Fired'
  | 'Avg Shots Hit'
  | 'Avg Deaths';

type SortDir = 'asc' | 'desc';

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
  MeleeKills?: number;
  StimsUsed?: number;
  StratsUsed?: number;
  sesTitle?: string | null;
  _avatarUrl?: string | null;
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
}

const sortFieldMap: Record<SortField, keyof LeaderboardRow> = {
  Kills: 'Kills',
  Accuracy: 'Accuracy',
  'Shots Fired': 'ShotsFired',
  'Shots Hit': 'ShotsHit',
  Deaths: 'Deaths',
  'Melee Kills': 'MeleeKills',
  'Stims Used': 'StimsUsed',
  'Strats Used': 'StratsUsed',
  player_name: 'player_name',
  clan_name: 'clan_name',
  submitted_at: 'submitted_at',
  'Avg Kills': 'AvgKills',
  'Avg Shots Fired': 'AvgShotsFired',
  'Avg Shots Hit': 'AvgShotsHit',
  'Avg Deaths': 'AvgDeaths',
};

function sortRows(rows: LeaderboardRow[], sortBy: SortField, sortDir: SortDir): LeaderboardRow[] {
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
    if (aNum !== null && bNum !== null) return aNum - bNum;
    return String(aVal ?? '').localeCompare(String(bVal ?? ''));
  });
  return sortDir === 'asc' ? sorted : sorted.reverse();
}

function HeaderButton(props: { label: string; sortKey: SortField; activeSort: { sortBy: SortField; sortDir: SortDir }; onSort: (f: SortField) => void }) {
  const { label, sortKey, activeSort, onSort } = props;
  const isActive = activeSort.sortBy === sortKey;
  const iconClass = `${lb.sortIcon} ${isActive && activeSort.sortDir === 'asc' ? lb.sortIconAsc : lb.sortIconDesc}`;
  return (
    <button className={lb.sortBtn} onClick={() => onSort(sortKey)} aria-label={`Sort by ${label}`}>
      {label} <i className={iconClass} />
    </button>
  );
}

function SectionTable(props: { title: string; rows: LeaderboardRow[]; activeSort: { sortBy: SortField; sortDir: SortDir }; onSort: (f: SortField) => void; searchTerm: string; onSearch: (v: string) => void; showAverages?: boolean; showTotals?: boolean; tabsNode?: React.ReactNode }) {
  const { title, rows, activeSort, onSort, searchTerm, onSearch, showAverages = false, showTotals = true, tabsNode } = props;
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredRows = normalizedQuery ? rows.filter((r) => (r.player_name || '').toLowerCase().includes(normalizedQuery)) : rows;
  const hasAverages = showAverages && filteredRows[0] && (filteredRows[0].AvgKills || filteredRows[0].AvgShotsFired || filteredRows[0].AvgShotsHit || filteredRows[0].AvgDeaths);
  const totalColumns = 2 + 1 + (showTotals ? 7 : 0) + (hasAverages ? 4 : 0);
  const agg = filteredRows.reduce(
    (acc, r) => {
      acc.k += Number(r.Kills) || 0;
      acc.d += Number(r.Deaths) || 0;
      acc.sf += Number(r.ShotsFired) || 0;
      acc.sh += Number(r.ShotsHit) || 0;
      acc.mk += Number(r.MeleeKills || 0);
      acc.st += Number(r.StimsUsed || 0);
      acc.sr += Number(r.StratsUsed || 0);
      return acc;
    },
    { k: 0, d: 0, sf: 0, sh: 0, mk: 0, st: 0, sr: 0 }
  );
  // Compute average accuracy by averaging each row's percentage where available
  let accSum = 0;
  let accCount = 0;
  for (const r of filteredRows) {
    const v = typeof r.Accuracy === 'string' ? parseFloat(r.Accuracy.replace('%', '')) : NaN;
    if (!Number.isNaN(v)) {
      accSum += v;
      accCount += 1;
    }
  }
  const count = filteredRows.length;
  const avg = count > 0
    ? {
        k: agg.k / count,
        d: agg.d / count,
        sf: agg.sf / count,
        sh: agg.sh / count,
        mk: agg.mk / count,
        st: agg.st / count,
        sr: agg.sr / count,
      }
    : { k: 0, d: 0, sf: 0, sh: 0, mk: 0, st: 0, sr: 0 };
  const accPct = accCount > 0 ? `${(accSum / accCount).toFixed(1)}%` : '0.0%';

  return (
    <section className={base.section}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      {tabsNode}
      <div className={lb.card}>
        <div className={lb.toolbar}>
          <input className={lb.search} placeholder="Search by player name..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>
        <div className={lb.tableWrap}>
          <table className={lb.table}>
            <thead className={lb.thead}>
              <tr>
                <th className={`${lb.th} ${lb.rankCol}`} style={{ width: 64, textAlign: 'right' }}>#</th>
                <th className={`${lb.th} ${lb.nameCol}`}>
                  <HeaderButton label="Player" sortKey="player_name" activeSort={activeSort} onSort={onSort} />
                </th>
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Kills" sortKey="Kills" activeSort={activeSort} onSort={onSort} /></th>)}
                {hasAverages && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Avg Kills" sortKey="Avg Kills" activeSort={activeSort} onSort={onSort} /></th>)}
                <th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Accuracy" sortKey="Accuracy" activeSort={activeSort} onSort={onSort} /></th>
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Shots Fired" sortKey="Shots Fired" activeSort={activeSort} onSort={onSort} /></th>)}
                {hasAverages && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Avg Shots Fired" sortKey="Avg Shots Fired" activeSort={activeSort} onSort={onSort} /></th>)}
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Shots Hit" sortKey="Shots Hit" activeSort={activeSort} onSort={onSort} /></th>)}
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Melee Kills" sortKey="Melee Kills" activeSort={activeSort} onSort={onSort} /></th>)}
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Stims Used" sortKey="Stims Used" activeSort={activeSort} onSort={onSort} /></th>)}
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Strats Used" sortKey="Strats Used" activeSort={activeSort} onSort={onSort} /></th>)}
                {hasAverages && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Avg Shots Hit" sortKey="Avg Shots Hit" activeSort={activeSort} onSort={onSort} /></th>)}
                {showTotals && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Deaths" sortKey="Deaths" activeSort={activeSort} onSort={onSort} /></th>)}
                {hasAverages && (<th className={`${lb.th} ${lb.statCol}`} style={{ textAlign: 'right' }}><HeaderButton label="Avg Deaths" sortKey="Avg Deaths" activeSort={activeSort} onSort={onSort} /></th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className={lb.tr}>
                  <td className={`${lb.td} ${lb.rankCol}`} style={{ textAlign: 'right' }}>{row.rank}</td>
                  <td className={`${lb.td} ${lb.nameCol}`}>
                    <span className={lb.playerCell}>
                      {row._avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row._avatarUrl} alt="Avatar" className={lb.avatar} />
                      ) : (
                        <span className={lb.avatar} aria-hidden>?</span>
                      )}
                      {row.player_name}
                    </span>
                  </td>
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Kills}</td>)}
                  {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{typeof row.AvgKills === 'number' ? row.AvgKills.toFixed(1) : ''}</td>)}
                  <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Accuracy}</td>
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.ShotsFired}</td>)}
                  {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{typeof row.AvgShotsFired === 'number' ? row.AvgShotsFired.toFixed(1) : ''}</td>)}
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.ShotsHit}</td>)}
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.MeleeKills ?? ''}</td>)}
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.StimsUsed ?? ''}</td>)}
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.StratsUsed ?? ''}</td>)}
                  {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{typeof row.AvgShotsHit === 'number' ? row.AvgShotsHit.toFixed(1) : ''}</td>)}
                  {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{row.Deaths}</td>)}
                  {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right' }}>{typeof row.AvgDeaths === 'number' ? row.AvgDeaths.toFixed(1) : ''}</td>)}
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td className={lb.td} colSpan={totalColumns}>No matching players.</td>
                </tr>
              )}
            </tbody>
            <tfoot className={lb.tfoot}>
              <tr>
                <td className={`${lb.td} ${lb.rankCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>—</td>
                <td className={`${lb.td} ${lb.nameCol}`} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Fleet Average</td>
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.k)}</td>)}
                {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} />)}
                <td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{accPct}</td>
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.sf)}</td>)}
                {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} />)}
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.sh)}</td>)}
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.mk)}</td>)}
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.st)}</td>)}
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.sr)}</td>)}
                {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} />)}
                {showTotals && (<td className={`${lb.td} ${lb.statCol}`} style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(avg.d)}</td>)}
                {hasAverages && (<td className={`${lb.td} ${lb.statCol}`} />)}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function HelldiversLeaderboard({ initialData }: { initialData: LeaderboardPayload }) {
  const [sortBy, setSortBy] = React.useState<SortField>('Kills');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [activeTab, setActiveTab] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [daySearch, setDaySearch] = React.useState('');
  const [weekSearch, setWeekSearch] = React.useState('');
  const [monthSearch, setMonthSearch] = React.useState('');
  const [yearSearch, setYearSearch] = React.useState('');

  React.useEffect(() => {
    const setTabFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'daily' || hash === 'weekly' || hash === 'monthly' || hash === 'yearly') setActiveTab(hash as any);
    };
    setTabFromHash();
    window.addEventListener('hashchange', setTabFromHash);
    return () => window.removeEventListener('hashchange', setTabFromHash);
  }, []);
  React.useEffect(() => { window.history.replaceState(null, '', `#${activeTab}`); }, [activeTab]);

  const toggleSort = (field: SortField) => {
    if (field === sortBy) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir(field === 'player_name' || field === 'clan_name' ? 'asc' : 'desc');
    }
  };

  const dayRows = React.useMemo(() => sortRows(initialData.day?.results || [], sortBy, sortDir), [initialData, sortBy, sortDir]);
  const weekRows = React.useMemo(() => sortRows(initialData.week?.results || [], sortBy, sortDir), [initialData, sortBy, sortDir]);
  const monthRows = React.useMemo(() => sortRows(initialData.month?.results || [], sortBy, sortDir), [initialData, sortBy, sortDir]);
  const yearRows = React.useMemo(() => sortRows(initialData.lifetime?.results || [], sortBy, sortDir), [initialData, sortBy, sortDir]);

  const now = new Date();
  const titles = {
    daily: `Daily Leaderboard - ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
    weekly: `Weekly Leaderboard - Week ${getWeekNumber(now)} of ${now.getUTCFullYear()}`,
    monthly: `Monthly Leaderboard - ${now.toLocaleString('default', { month: 'long' })} ${now.getUTCFullYear()}`,
    yearly: 'Yearly Leaderboard - 2025',
  } as const;

  const tabs = (
    <div className={lb.tabs} role="tablist" aria-label="Scope">
      <button className={`${lb.tab} ${activeTab === 'daily' ? lb.tabActive : ''}`} onClick={() => setActiveTab('daily')} role="tab">Day</button>
      <button className={`${lb.tab} ${activeTab === 'weekly' ? lb.tabActive : ''}`} onClick={() => setActiveTab('weekly')} role="tab">Week</button>
      <button className={`${lb.tab} ${activeTab === 'monthly' ? lb.tabActive : ''}`} onClick={() => setActiveTab('monthly')} role="tab">Month</button>
      <button className={`${lb.tab} ${activeTab === 'yearly' ? lb.tabActive : ''}`} onClick={() => setActiveTab('yearly')} role="tab">Lifetime</button>
    </div>
  );

  return (
    <div className={lb.card}>
      {activeTab === 'daily' && (
        <SectionTable title={titles.daily} rows={dayRows} activeSort={{ sortBy, sortDir }} onSort={toggleSort} searchTerm={daySearch} onSearch={setDaySearch} showTotals tabsNode={tabs} />
      )}
      {activeTab === 'weekly' && (
        <SectionTable title={titles.weekly} rows={weekRows} activeSort={{ sortBy, sortDir }} onSort={toggleSort} searchTerm={weekSearch} onSearch={setWeekSearch} showTotals tabsNode={tabs} />
      )}
      {activeTab === 'monthly' && (
        <SectionTable title={titles.monthly} rows={monthRows} activeSort={{ sortBy, sortDir }} onSort={toggleSort} searchTerm={monthSearch} onSearch={setMonthSearch} showTotals tabsNode={tabs} />
      )}
      {activeTab === 'yearly' && (
        <SectionTable title={titles.yearly} rows={yearRows} activeSort={{ sortBy, sortDir }} onSort={toggleSort} searchTerm={yearSearch} onSearch={setYearSearch} showTotals tabsNode={tabs} />
      )}
    </div>
  );
}
