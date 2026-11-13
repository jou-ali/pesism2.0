'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamCrest } from '@/components/team-crest';

const MAX_LEN = 30;

export function TeamSetupForm({
  token,
  playerName,
  initialTeamName,
  initialCrestUrl,
  initialPrimaryColor,
  initialSecondaryColor,
  locked,
}: {
  token: string;
  playerName: string;
  initialTeamName: string | null;
  initialCrestUrl: string | null;
  initialPrimaryColor: string | null;
  initialSecondaryColor: string | null;
  locked: boolean;
}) {
  const [teamName, setTeamName] = useState(initialTeamName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(Boolean(initialTeamName));
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(t);
  }, [showToast]);

  const trimmed = teamName.trim();
  const pill = locked
    ? { label: 'Locked', className: 'pill--yellow' }
    : hasSaved
      ? { label: 'Saved', className: 'pill--success' }
      : { label: 'Not set', className: 'pill--muted' };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/team-setup/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? 'Could not save your team name.');
      }
      setHasSaved(true);
      setShowToast(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your team name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="card__head">
        <span className="card__head-eyebrow">Your club</span>
        <span className={`pill ${pill.className}`}>{pill.label}</span>
      </div>

      <div style={{ padding: '1.5rem 1.5rem 0' }}>
        <div className="team-setup__preview">
          <TeamCrest
            teamName={trimmed || null}
            crestUrl={initialCrestUrl}
            primaryColor={initialPrimaryColor}
            secondaryColor={initialSecondaryColor}
            size={56}
          />
          <div className="team-setup__preview-text">
            <span className="team-setup__preview-name">{trimmed || 'Team pending'}</span>
            <span className="team-setup__preview-player">{playerName}</span>
          </div>
        </div>

        {showToast ? <p className="team-setup__toast">Saved. See you on matchday.</p> : null}

        <div className="field team-setup__field">
          <label htmlFor="team-name">Team name</label>
          <input
            id="team-name"
            type="text"
            required
            maxLength={MAX_LEN}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Kochi Kings"
            disabled={locked || busy}
          />
          <div className="team-setup__counter">
            {teamName.length}/{MAX_LEN}
          </div>
          <p className="field__hint">
            {locked
              ? 'Team names are locked once registration closes.'
              : 'The club you’ll play as all season. Admins add the crest.'}
          </p>
        </div>
        {error ? <p className="admin-login-error" style={{ margin: '.75rem 0 0' }}>{error}</p> : null}
      </div>

      <div className="card__foot">
        <span>Need a different link? Ask an admin.</span>
        <Button className="btn btn--primary" type="submit" disabled={locked || busy || !trimmed}>
          {busy ? 'Saving…' : 'Save team name'}
        </Button>
      </div>
    </form>
  );
}
