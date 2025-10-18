// src/app/profile/me/ProfileView.tsx
import Link from 'next/link';
import Image from 'next/image';
import { FaTwitch } from 'react-icons/fa';
import base from '@/styles/Base.module.css';
import s from '@/styles/ProfileEditForm.module.css';
import LinkedAccountsClient from '@/components/profile/LinkedAccountsClient';
import AwardsClient from '@/components/profile/AwardsClient';

const overlayStyle: React.CSSProperties = {
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

function findRankAndRow(rows: any[], name: string) {
  const idx = (rows || []).findIndex(
    (r) => (r.player_name || '').toLowerCase() === name.toLowerCase()
  );
  return idx >= 0
    ? { rank: rows[idx].rank || idx + 1, row: rows[idx] }
    : { rank: null, row: null };
}

export default function ProfileView({
  session,
  userData,
  batch,
}: {
  session: any;
  userData: any;
  batch: { solo?: any; month?: any; lifetime?: any };
}) {
  const soloData = batch?.solo;
  const monthData = batch?.month;
  const lifetimeData = batch?.lifetime;

  const preferredHeightUnit: 'cm' | 'in' =
    userData?.lastProfile?.preferredHeightUnit === 'in'
      ? 'in'
      : userData?.preferredHeightUnit === 'in'
      ? 'in'
      : 'cm';

  const preferredWeightUnit: 'kg' | 'lb' =
    userData?.lastProfile?.preferredWeightUnit === 'lb'
      ? 'lb'
      : userData?.preferredWeightUnit === 'lb'
      ? 'lb'
      : 'kg';

  const heightDisplay = (() => {
    const cmVal =
      userData?.lastProfile?.characterHeightCm ?? userData?.characterHeightCm;
    if (cmVal == null) return '—';
    if (preferredHeightUnit === 'cm') return `${cmVal} cm`;
    const inches = Math.round(Number(cmVal) / 2.54);
    return `${inches} in`;
  })();

  const weightDisplay = (() => {
    const kgVal =
      userData?.lastProfile?.characterWeightKg ?? userData?.characterWeightKg;
    if (kgVal == null) return '—';
    if (preferredWeightUnit === 'kg') return `${kgVal} kg`;
    const lbs = Math.round(Number(kgVal) * 2.2046226218);
    return `${lbs} lb`;
  })();

  const displayName =
    [
      userData?.lastProfile?.firstName,
      userData?.lastProfile?.middleName,
      userData?.lastProfile?.lastName,
    ]
      .filter(Boolean)
      .join(' ') ||
    [userData?.firstName, userData?.middleName, userData?.lastName]
      .filter(Boolean)
      .join(' ') ||
    '—';

  const sesName = userData?.lastProfile?.sesName ?? userData?.sesName ?? '—';

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

  const grade = (() => {
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
    if (Number.isFinite(accuracyNum)) {
      if (accuracyNum >= 75) return 'S';
      if (accuracyNum >= 65) return 'A';
      if (accuracyNum >= 50) return 'B';
      if (accuracyNum >= 35) return 'C';
      return 'D';
    }
    return null;
  })();

  if (!session) {
    return (
      <div className={base.pageContainer}>
        <p>
          Please <a href="/auth">sign in</a> to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className={base.pageContainer} style={{ position: 'relative', zIndex: 0 }}>
      <div style={overlayStyle} />

      <section className="content-section" style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="content-section-title with-border-bottom">Character Sheet</h2>

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
                priority={false}
              />
            </div>

            <Link
              href="/settings"
              className="btn btn-primary"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Edit Profile
            </Link>

            <LinkedAccountsClient twitchUrl={userData?.twitchUrl} />
          </aside>

          {/* Main card stack */}
          <main>
            {/* Identity */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Identity</h3>
              <div className={`${s.grid} cols2`}>
                <div className={`field field-sm ${s.full}`}>
                  <strong className="label">Name</strong>
                  <div
                    style={{
                      color: '#cbd5e1',
                      background: 'rgba(148,163,184,0.12)',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {displayName}
                  </div>
                </div>

                <div className="field field-sm">
                  <strong className="label">S.E.S. (Destroyer) Name</strong>
                  <div
                    style={{
                      color: '#cbd5e1',
                      background: 'rgba(148,163,184,0.12)',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {sesName}
                  </div>
                </div>

                <div className="field field-sm">
                  <strong className="label">Callsign</strong>
                  <div
                    style={{
                      color: '#cbd5e1',
                      background: 'rgba(148,163,184,0.12)',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {userData?.callsign ?? '—'}
                  </div>
                </div>

                <div className="field field-sm">
                  <strong className="label">Rank</strong>
                  <div
                    style={{
                      color: '#cbd5e1',
                      background: 'rgba(148,163,184,0.12)',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {userData?.rankTitle ?? '—'}
                  </div>
                </div>

                <div className="field field-sm">
                  <strong className="label">Homeplanet</strong>
                  <div
                    style={{
                      color: '#cbd5e1',
                      background: 'rgba(148,163,184,0.12)',
                      padding: '6px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {userData?.homeplanet ?? '—'}
                  </div>
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
                    `Solo: ${
                      findRankAndRow(soloData?.results || [], userData.name).rank ?? '—'
                    }`
                  )}
                  {chip(
                    `Monthly: ${
                      findRankAndRow(monthData?.results || [], userData.name).rank ?? '—'
                    }`
                  )}
                  {chip(
                    `Yearly: ${
                      findRankAndRow(lifetimeData?.results || [], userData.name).rank ?? '—'
                    }`
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

            {/* Awards (client island) */}
            <AwardsClient
              challengeSubmissions={userData?.challengeSubmissions ?? []}
              campaignCompletions={
                userData?.campaignCompletions ??
                userData?.lastProfile?.campaignCompletions ??
                []
              }
              challengeLabels={CHALLENGE_LEVEL_LABELS}
              campaignLabels={CAMPAIGN_MISSION_LABELS}
              profileName={userData?.name ?? undefined}
            />

            {/* Activity */}
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Activity</h3>
              {(() => {
                const lastStats =
                  userData?.lastProfile?.lastStats ||
                  userData?.lastProfile?.last_stats ||
                  null;
                const time =
                  lastStats?.time || lastStats?.submittedAt || lastStats?.timestamp;
                if (time) {
                  const dt = new Date(time);
                  return (
                    <div>
                      <p className="text-paragraph">
                        Last stats submission: {dt.toLocaleString()}
                      </p>
                      {'kills' in (lastStats || {}) ||
                      'deaths' in (lastStats || {}) ||
                      'assists' in (lastStats || {}) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {'kills' in lastStats && chip(`Kills: ${lastStats.kills}`)}
                          {'deaths' in lastStats && chip(`Deaths: ${lastStats.deaths}`)}
                          {'assists' in lastStats && chip(`Assists: ${lastStats.assists}`)}
                        </div>
                      ) : null}
                    </div>
                  );
                }
                return <p className="text-paragraph">No stats submissions recorded.</p>;
              })()}
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}
