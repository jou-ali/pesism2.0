'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { scheduleFixtureAction } from '@/app/admin/actions';
import type { AdminRegistration, MatchStage } from '@/lib/tournax-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    return <p className="text-sm text-muted-foreground">Approve at least two players first.</p>;
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-matchday">Matchday</Label>
          <Input id="sf-matchday" type="number" inputMode="numeric" min={1} required value={matchday} onChange={(e) => setMatchday(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-home">Home (player)</Label>
          <Select value={homeId} onValueChange={setHomeId}>
            <SelectTrigger id="sf-home" className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {approved.map((p) => (
                <SelectItem key={p.playerId} value={p.playerId}>
                  {p.name} ({p.gamingUsername})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-away">Away (player)</Label>
          <Select value={awayId} onValueChange={setAwayId}>
            <SelectTrigger id="sf-away" className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {approved.map((p) => (
                <SelectItem key={p.playerId} value={p.playerId}>
                  {p.name} ({p.gamingUsername})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-stage">Stage</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as MatchStage)}>
            <SelectTrigger id="sf-stage" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {saved ? <p className="text-sm" style={{ color: 'var(--color-success)' }}>{saved}</p> : null}
      {error ? <p className="admin-login-error">{error}</p> : null}

      <Button type="submit" variant="outline" disabled={busy} className="self-start">
        {busy ? 'Saving…' : 'Add one fixture'}
      </Button>
    </form>
  );
}
