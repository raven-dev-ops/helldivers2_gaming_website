// src/app/profile/me/_client/AwardsClient.tsx
'use client';

import React from 'react';
import s from '@/styles/ProfileEditForm.module.css';

type AllianceAwards = Record<string, boolean>;

export default function AwardsClient({
  challengeSubmissions,
  campaignCompletions,
  challengeLabels,
  campaignLabels,
  profileName,
}: {
  challengeSubmissions: any[];
  campaignCompletions: string[];
  challengeLabels: string[];
  campaignLabels: string[];
  profileName?: string;
}) {
  const [allianceAwards, setAllianceAwards] = React.useState<AllianceAwards | null>(null);
  const [awardDefs, setAwardDefs] = React.useState<Array<{ key: string; label: string }>>([]);
  React.useEffect(() => {
    let active = true;
    const url = profileName
      ? `/api/alliance/awards?name=${encodeURIComponent(profileName)}`
      : '/api/alliance/awards?self=1';
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json) return;
        setAllianceAwards(json.awards || {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profileName]);

  React.useEffect(() => {
    let active = true;
    fetch('/api/alliance/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json) return;
        const defs = (json.awards || []) as Array<{ key: string; label: string }>;
        setAwardDefs(defs);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const challengeCount = (() => {
    let c = 0;
    for (let i = 1; i <= 7; i++) {
      const sub = challengeSubmissions.find((x: any) => x.level === i);
      if (sub && (sub.youtubeUrl || sub.witnessName || sub.witnessDiscordId)) c++;
    }
    return c;
  })();

  const campSet = new Set(campaignCompletions);

  const chip = (label: string, complete = false) => (
    <span
      key={label}
      style={{
        padding: '0.35rem 0.6rem',
        borderRadius: 8,
        border: '1px solid #334155',
        background: complete ? 'rgba(180, 140, 0, 0.2)' : 'rgba(0,0,0,0.2)',
        color: complete ? '#f59e0b' : '#94a3b8',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>Awards</h3>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ color: '#f59e0b' }}>Challenges</strong>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>
              {challengeCount}/{challengeLabels.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {challengeLabels.map((label, i) => {
              const lvl = i + 1;
              const sub = (challengeSubmissions || []).find((x: any) => x.level === lvl);
              const complete = !!(
                sub && (sub.youtubeUrl || sub.witnessName || sub.witnessDiscordId)
              );
              return chip(label, complete);
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ color: '#f59e0b' }}>Campaign</strong>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>
              {new Set(campaignCompletions).size}/{campaignLabels.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {campaignLabels.map((label) => chip(label, campSet.has(label)))}
          </div>
        </div>

        {/* Alliance Awards */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ color: '#f59e0b' }}>Alliance Awards</strong>
            {allianceAwards && awardDefs.length ? (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                {
                  awardDefs.reduce(
                    (acc, a) => (allianceAwards?.[a.key] ? acc + 1 : acc),
                    0
                  )
                }
                /{awardDefs.length}
              </span>
            ) : (
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Loading…</span>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12,
            }}
          >
            {(awardDefs.length ? awardDefs.map((d) => d.key) : ['valor','tactics','teamwork','logistics','rescue','intel']).map((key) => (
              <div
                key={key}
                aria-label={`${key} award`}
                style={{
                  display: 'grid',
                  gap: 6,
                  justifyItems: 'center',
                  padding: '12px 8px',
                  borderRadius: 10,
                  border: allianceAwards?.[key] ? '1px solid #f59e0b' : '1px solid #334155',
                  background: allianceAwards?.[key]
                    ? 'linear-gradient(180deg, rgba(245, 158, 11, .18), rgba(0,0,0,.25))'
                    : 'rgba(0,0,0,0.25)',
                  boxShadow: allianceAwards?.[key]
                    ? '0 0 22px rgba(245, 158, 11, 0.25)'
                    : 'none',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    border: allianceAwards?.[key] ? '2px solid #f59e0b' : '2px solid #4b5563',
                    display: 'grid',
                    placeItems: 'center',
                    background: allianceAwards?.[key]
                      ? 'linear-gradient(180deg, rgba(245, 158, 11, .25), rgba(0,0,0,.2))'
                      : 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.1))',
                    color: allianceAwards?.[key] ? '#f59e0b' : '#64748b',
                    fontWeight: 800,
                    fontSize: 20,
                  }}
                >
                  {allianceAwards?.[key] ? '★' : '?'}
                </div>
                <div style={{ fontSize: 12, color: allianceAwards?.[key] ? '#f59e0b' : '#94a3b8' }}>
                  {(awardDefs.find((d) => d.key === key)?.label) || key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
