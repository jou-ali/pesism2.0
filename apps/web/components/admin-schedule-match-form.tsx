'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { scheduleFixtureAction } from '@/app/admin/actions';
import type { AdminRegistration, MatchStage } from '@/lib/tournax-api';

const STAGES: { value: MatchStage; label: string }[] = [
  { value: 'league', label: 'League' },
  { value: 'quarter_final', label: 'Quarter-final' },
  { value: 'semi_final', label: 'Semi-final' },
  { value: 'grand_final', label: 'Final' },
];

export function AdminScheduleMatchForm({ approved }: { approved: AdminRegistration[] }) {
  const router = useRouter();
  const [matchday, setMatchday] = useState('1');
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [stage, setStage] = useState<MatchStage>('league');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    if (!homeId || !awayId) {
      setError('Pick home and away players.');
      return;
    }
    if (homeId === awayId) {
      setError('Home and away must be different.');
      return;
    }
    setBusy(true);
    try {
      const row = await scheduleFixtureAction({
        matchday: Number(matchday),
        homePlayerId: homeId,
        awayPlayerId: awayId,
        stage,
      });
      setSaved(`Scheduled: MD${row.matchday} ${row.homeName} vs ${row.awayName}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule fixture');
    } finally {
      setBusy(false);
    }
  }

  if (approved.length < 2) {
    return <p className="admin-muted">Approve at least two players first.</p>;
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form__row">
        <label>
          Matchday
          <input type="number" min={1} required value={matchday} onChange={(e) => setMatchday(e.target.value)} />
        </label>
        <label>
          Home (player)
          <select required value={homeId} onChange={(e) => setHomeId(e.target.value)}>
            <option value="">Select…</option>
            {approved.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name} ({p.gamingUsername})
              </option>
            ))}
          </select>
        </label>
        <label>
          Away (player)
          <select required value={awayId} onChange={(e) => setAwayId(e.target.value)}>
            <option value="">Select…</option>
            {approved.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name} ({p.gamingUsername})
              </option>
            ))}
          </select>
        </label>
        <label>
          Stage
          <select value={stage} onChange={(e) => setStage(e.target.value as MatchStage)}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {saved ? <p className="admin-muted" style={{ color: '#7dffb0' }}>{saved}</p> : null}
      {error ? <p className="admin-login-error">{error}</p> : null}

      <button type="submit" className="admin-btn admin-btn--ghost" disabled={busy}>
        {busy ? 'Saving…' : 'Add one fixture'}
      </button>
    </form>
  );
}
