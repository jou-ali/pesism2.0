'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { recordMatchAction } from '@/app/admin/actions';
import type { AdminMatchRow, MatchStatsInput } from '@/lib/tournax-api';
import { MatchStatsFields } from '@/components/match-stats-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminRecordMatchForm({ scheduled }: { scheduled: AdminMatchRow[] }) {
  const router = useRouter();
  const unplayed = useMemo(() => scheduled.filter((m) => m.status === 'scheduled'), [scheduled]);

  const [matchId, setMatchId] = useState('');
  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [stats, setStats] = useState<MatchStatsInput>({});
  const [includeStats, setIncludeStats] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const selected = unplayed.find((m) => m.id === matchId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);
    if (!selected) {
      setError('Pick a scheduled fixture from the list.');
      return;
    }
    setBusy(true);
    try {
      const row = await recordMatchAction({
        matchId: selected.id,
        matchday: selected.matchday,
        homePlayerId: selected.homePlayerId,
        awayPlayerId: selected.awayPlayerId,
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        stats: includeStats ? stats : undefined,
      });
      setSaved(`Saved: MD${row.matchday} ${row.homeName} ${row.homeGoals}–${row.awayGoals} ${row.awayName}`);
      router.refresh();
      setMatchId('');
      setHomeGoals('0');
      setAwayGoals('0');
      setStats({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save result');
    } finally {
      setBusy(false);
    }
  }

  function setStat(key: keyof MatchStatsInput, value: string) {
    setStats((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else {
        next[key] = Number(value);
      }
      return next;
    });
  }

  if (!unplayed.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No unplayed fixtures. Add pairings under <a href="/admin/schedule" className="font-semibold text-(--color-accent)! hover:underline">Fixtures</a> first, then enter scores here.
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rm-fixture">Scheduled fixture</Label>
        <Select value={matchId} onValueChange={setMatchId}>
          <SelectTrigger id="rm-fixture" className="w-full">
            <SelectValue placeholder="Select a fixture…" />
          </SelectTrigger>
          <SelectContent>
            {unplayed.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                MD{m.matchday}: {m.homeName} vs {m.awayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rm-home">Home goals{selected ? ` (${selected.homeName})` : ''}</Label>
          <Input id="rm-home" type="number" inputMode="numeric" min={0} required value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rm-away">Away goals{selected ? ` (${selected.awayName})` : ''}</Label>
          <Input id="rm-away" type="number" inputMode="numeric" min={0} required value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)} />
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={includeStats} onChange={(e) => setIncludeStats(e.target.checked)} className="size-4" />
        Include in-game score sheet stats
      </label>

      {includeStats ? (
        <MatchStatsFields
          stats={stats}
          onChange={setStat}
          homeLabel={selected?.homeName}
          awayLabel={selected?.awayName}
        />
      ) : null}

      {saved ? <p className="text-sm" style={{ color: 'var(--color-success)' }}>{saved}</p> : null}
      {error ? <p className="admin-login-error">{error}</p> : null}

      <Button type="submit" disabled={busy || !matchId} className="self-start">
        {busy ? 'Saving…' : 'Save result'}
      </Button>
    </form>
  );
}
