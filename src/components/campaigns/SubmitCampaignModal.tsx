'use client';

import { useState, type CSSProperties } from 'react';

interface MissionOption {
  id: string;
  title: string;
}

export default function SubmitCampaignModal({
  isOpen,
  onClose,
  onSubmitted,
  missions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  missions: MissionOption[];
}) {
  const [campaignId, setCampaignId] = useState<string>('');
  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const modalStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  };
  const cardStyle: CSSProperties = {
    background: '#0b1220',
    color: '#fff',
    width: 'min(92vw, 640px)',
    borderRadius: 12,
    border: '1px solid #334155',
    padding: 16,
  };

  const handleSubmit = async () => {
    if (!campaignId || !youtubeLink.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campaign',
          interest: campaignId,
          about: youtubeLink,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : { message: await res.text() };
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      onSubmitted(data.message || 'Campaign submitted');
      setCampaignId('');
      setYoutubeLink('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit';
      onSubmitted(message);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <div
      style={modalStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Submit Campaign"
    >
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontWeight: 700 }}>
          Submit Campaign
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="label">Campaign</span>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">Select a campaign</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">YouTube Link</span>
            <input
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={saving || !campaignId || !youtubeLink.trim()}
            >
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
