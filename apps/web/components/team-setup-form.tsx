'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TeamSetupForm({ token, initialTeamName }: { token: string; initialTeamName: string | null }) {
  const [teamName, setTeamName] = useState(initialTeamName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/team-setup/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? 'Could not save your team name.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your team name.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p style={{ color: 'var(--color-success)' }}>Team name saved. See you on matchday.</p>;
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field field--full">
        <label htmlFor="team-name">Team name</label>
        <input
          id="team-name"
          type="text"
          required
          maxLength={30}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Kochi Kings"
        />
        <p className="field__hint">The club you&rsquo;ll play with all season.</p>
      </div>
      {error ? <p className="field--full admin-login-error" style={{ margin: 0 }}>{error}</p> : null}
      <div className="form__foot field--full">
        <Button className="btn btn--primary" type="submit" disabled={busy || !teamName.trim()}>
          {busy ? 'Saving…' : 'Save team name'}
        </Button>
      </div>
    </form>
  );
}
