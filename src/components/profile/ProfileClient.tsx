// src/components/profile/ProfileClient.tsx
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { FaTwitch } from 'react-icons/fa';
import AwardsClient from '@/components/profile/AwardsClient';
import base from '@/styles/Base.module.css';
import s from '@/styles/ProfileEditForm.module.css';

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(16, 20, 31, 0.35)',
  zIndex: -1,
};

const CHALLENGE_LEVEL_LABELS = [
  'Sabotage Proficiency',
  'Resource Denial',
  'ICBM Control',
  'Flawless ICBM',
  'Perfect Survey',
  'Eagle Ace',
  'The Purist',
];

const CAMPAIGN_MISSION_LABELS = [
  'Terminid Spawn Camp',
  'Automaton Hell Strike',
  'Lethal Pacifist',
  'Total Area Scorching',
];

const fetcher = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((r) => r.json());

export default function ProfileClient() {
  const { data: session, status } = useSession();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const savedRankingOnce = useRef(false);

  // Leaderboard batch (client)
  const now = new Date();
  const qsBatch = new URLSearchParams({
    scopes: 'solo,month,lifetime',
    sortBy: 'Kills',
    sortDir: 'desc',
    limit: '1000',
    month: String(now.getUTCMonth() + 1),
    year: String(now.getUTCFullYear()),
  }).toString();

  const { data: batchData } = useSWR(
    `/api/leaderboard/batch?${qsBatch}`,
    fetcher
  );
  const soloData = batchData?.solo;
  const monthData = batchData?.month;
  const lifetimeData = batchData?.lifetime;

  // Load user data (avatar + submissions) on client
  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      setLoading(true);
      const res = await fetch('/api/users/me?include=avatar,submissions', {
        cache: 'no-store',
      });
      const data = res.ok ? await res.json() : null;
      setUserData(data);
      setLoading(false);
    })();
  }, [status]);

  // Awards UI moved to reusable AwardsClient (dynamic via config)

  const findRankAndRow = (rows: any[], name: string) => {
    const idx = (rows || []).findIndex(
      (r) =>
        String(r?.player_name ?? '').toLowerCase() ===
        String(name ?? '').toLowerCase()
    );
    return idx >= 0
      ? { rank: rows[idx].rank || idx + 1, row: rows[idx] }
      : { rank: null, row: null };
  };

  // NOTE: this is a VALUE, not a function. Use as {grade ?? '—'}
  const grade = useMemo<string | null>(() => {
    if (!userData?.name) return null;
    const total = findRankAndRow(lifetimeData?.results || [], userData.name).row;
    const month = findRankAndRow(monthData?.results || [], userData.name).row;
    const solo = findRankAndRow(soloData?.results || [], userData.name).row;
    const row = total || month || solo;
    if (!row) return null;

    const accuracyRaw = row.Accuracy as string | undefined;
    const accuracyNum = accuracyRaw
      ? parseFloat(accuracyRaw.replace('%', ''))
      : Number.NaN;

    if (!Number.isFinite(accuracyNum)) return null;
    if (accuracyNum >= 75) return 'S';
    if (accuracyNum >= 65) return 'A';
    if (accuracyNum >= 50) return 'B';
    if (accuracyNum >= 35) return 'C';
    return 'D';
  }, [userData?.name, lifetimeData, monthData, soloData]);

  // Preferred units from user data
  const preferredHeightUnit: 'cm' | 'in' =
    userData?.preferredHeightUnit === 'in' ? 'in' : 'cm';
  const preferredWeightUnit: 'kg' | 'lb' =
    userData?.preferredWeightUnit === 'lb' ? 'lb' : 'kg';

  const heightDisplay = useMemo(() => {
    const cmVal = userData?.characterHeightCm;
    if (cmVal == null) return '—';
    if (preferredHeightUnit === 'cm') return `${cmVal} cm`;
    const inches = Math.round(Number(cmVal) / 2.54);
    return `${inches} in`;
  }, [userData?.characterHeightCm, preferredHeightUnit]);

  const weightDisplay = useMemo(() => {
    const kgVal = userData?.characterWeightKg;
    if (kgVal == null) return '—';
    if (preferredWeightUnit === 'kg') return `${kgVal} kg`;
    const lbs = Math.round(Number(kgVal) * 2.2046226218);
    return `${lbs} lb`;
  }, [userData?.characterWeightKg, preferredWeightUnit]);

  // Persist one snapshot of ranking to server (best-effort; client)
  useEffect(() => {
    const name = userData?.name;
    if (!name || savedRankingOnce.current) return;
    const solo = findRankAndRow(soloData?.results || [], name);
    const month = findRankAndRow(monthData?.results || [], name);
    const total = findRankAndRow(lifetimeData?.results || [], name);
    const entries = [
      { scope: 'solo', rank: solo.rank, stats: solo.row },
      { scope: 'month', rank: month.rank, stats: month.row },
      { scope: 'lifetime', rank: total.rank, stats: total.row },
    ].filter((e) => e.rank != null && e.stats);
    if (entries.length > 0) {
      savedRankingOnce.current = true;
      fetch('/api/users/profile/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      }).catch(() => {});
    }
  }, [userData?.name, soloData, monthData, lifetimeData]);

  if (status === 'loading' || loading) {
    return <div className={base.pageContainer}>Loading profile…</div>;
  }
  if (!session) {
    return (
      <div className={base.pageContainer}>
        <p>
          Please <a href="/auth">sign in</a> to view your profile.
        </p>
      </div>
    );
  }

  const displayName =
    [userData?.firstName, userData?.middleName, userData?.lastName]
      .filter(Boolean)
      .join(' ') || '—';
  const sesName = userData?.sesName ?? '—';

  const chip = (label: string) => (
    <span
      key={label}
      style={{
        padding: '0.35rem 0.6rem',
        borderRadius: 8,
        border: '1px solid #334155',
        background: 'rgba(0,0,0,0.2)',
        color: '#94a3b8',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );

  return (
        <div className={s.layout}>
          {/* Sidebar */}
          <aside className={s.sidebar}>
            <div className={s.avatar}>
              <Image
                src={
                  userData?.customAvatarDataUrl ||
                  userData?.image ||
                  '/images/avatar-default.png'
                }
                alt="Avatar"
                width={160}
                height={160}
                className={s.avatarImg ?? ''}
                sizes="160px"
              />
            </div>

            <Link
              href="/settings"
              className="btn btn-primary"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Edit Profile
            </Link>

            <section className={s.section}>
              <h3 className={s.sectionTitle}>Linked</h3>
              {userData?.twitchUrl ? (
                <a
                  href={userData.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <FaTwitch size={20} color="#a970ff" /> Twitch
                </a>
              ) : (
                <p className="text-paragraph">No accounts linked.</p>
              )}
            </section>
          </aside>

          {/* Main */}
          <main>
            {/* Identity */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Identity</h3>
              <div className={`${s.grid} cols2`}>
                <div className={`field field-sm ${s.full}`}>
                  <strong className="label">Name</strong>
                  <div className="text-paragraph">{displayName}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">S.E.S. (Destroyer) Name</strong>
                  <div className="text-paragraph">{sesName}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Callsign</strong>
                  <div className="text-paragraph">{userData?.callsign ?? '—'}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Rank</strong>
                  <div className="text-paragraph">{userData?.rankTitle ?? '—'}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Homeplanet</strong>
                  <div className="text-paragraph">{userData?.homeplanet ?? '—'}</div>
                </div>
              </div>
            </section>

            {/* Character Stats */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Character Stats</h3>
              <div className={`${s.grid} cols3`}>
                <div className="field field-sm">
                  <strong className="label">Height</strong>
                  <div className="text-paragraph">{heightDisplay}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Weight</strong>
                  <div className="text-paragraph">{weightDisplay}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Favored Enemy</strong>
                  <div className="text-paragraph">{userData?.favoredEnemy ?? '—'}</div>
                </div>
              </div>
            </section>

            {/* Loadout & Motto */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Loadout & Motto</h3>
              <div className={`${s.grid} cols3`}>
                <div className="field field-sm">
                  <strong className="label">Favorite Weapon</strong>
                  <div className="text-paragraph">{userData?.favoriteWeapon ?? '—'}</div>
                </div>
                <div className="field field-sm">
                  <strong className="label">Armor</strong>
                  <div className="text-paragraph">{userData?.armor ?? '—'}</div>
                </div>
                <div className={`field field-sm ${s.full}`}>
                  <strong className="label">Motto</strong>
                  <div className="text-paragraph">{userData?.motto ?? '—'}</div>
                </div>
              </div>
            </section>

            {/* Career & Rankings */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Career & Rankings</h3>
              {userData?.name ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {chip(
                    `Solo: ${findRankAndRow(soloData?.results || [], userData.name).rank ?? '—'}`
                  )}
                  {chip(
                    `Monthly: ${findRankAndRow(monthData?.results || [], userData.name).rank ?? '—'}`
                  )}
                  {chip(
                    `Yearly: ${findRankAndRow(lifetimeData?.results || [], userData.name).rank ?? '—'}`
                  )}
                  {chip(`Grade: ${grade ?? '—'}`)}
                  {chip(`Clearance: ${userData?.rankTitle ?? '—'}`)}
                </div>
              ) : (
                <p className="text-paragraph">
                  Set your profile name to see your leaderboard rankings.
                </p>
              )}
            </section>

            {/* Awards (dynamic via config) */}
            <AwardsClient
              challengeSubmissions={userData?.challengeSubmissions ?? []}
              campaignCompletions={userData?.campaignCompletions ?? []}
              challengeLabels={CHALLENGE_LEVEL_LABELS}
              campaignLabels={CAMPAIGN_MISSION_LABELS}
              profileName={userData?.name ?? undefined}
            />

            {/* Activity */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Activity</h3>
              <p className="text-paragraph">
                Last stats submission:{' '}
                {userData?.lastStats?.submittedAt
                  ? new Date(userData.lastStats.submittedAt).toLocaleString()
                  : '—'}
              </p>
            </section>
          </main>
        </div>
  );
}
