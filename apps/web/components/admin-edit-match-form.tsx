'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateMatchAction } from '@/app/admin/actions';
import type { AdminMatchDetail, MatchStatsInput } from '@/lib/tournax-api';
import { MatchStatsFields } from '@/components/match-stats-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function statMapFromDetail(stats: MatchStatsInput | null | undefined): MatchStatsInput {
  return stats ? { ...stats } : {};
}

export function AdminEditMatchForm({ match }: { match: AdminMatchDetail }) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState(String(match.homeGoals));
  const [awayGoals, setAwayGoals] = useState(String(match.awayGoals));
  const [stats, setStats] = useState<MatchStatsInput>(() => statMapFromDetail(match.stats));
  const [includeStats, setIncludeStats] = useState(match.stats != null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateMatchAction(match.id, {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        stats: includeStats ? stats : undefined,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        MD{match.matchday} · {match.homeName} vs {match.awayName}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="em-home">{match.homeName} goals</Label>
          <Input
            id="em-home"
            type="number"
            inputMode="numeric"
            min={0}
            required
            value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="em-away">{match.awayName} goals</Label>
          <Input
            id="em-away"
            type="number"
            inputMode="numeric"
            min={0}
            required
            value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)}
          />
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={includeStats} onChange={(e) => setIncludeStats(e.target.checked)} className="size-4" />
        Include / edit score sheet stats
      </label>

      {includeStats ? (
        <MatchStatsFields stats={stats} onChange={setStat} homeLabel={match.homeName} awayLabel={match.awayName} />
      ) : (
        <p className="text-sm text-muted-foreground">Unchecking removes stored stats for this match.</p>
      )}

      {saved ? <p className="text-sm" style={{ color: 'var(--color-success)' }}>Saved.</p> : null}
      {error ? <p className="admin-login-error">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/admin/fixtures">Back to results</Link>
        </Button>
      </div>
    </form>
  );
}
