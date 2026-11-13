'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeMatchdayAction, setTournamentStatusAction, startMatchdayAction } from '@/app/admin/actions';
import type { TournamentStatusValue } from '@/lib/tournax-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STATUSES: { value: TournamentStatusValue; label: string }[] = [
  { value: 'draft', label: 'Draft (not public yet)' },
  { value: 'registration', label: 'Registration' },
  { value: 'league', label: 'League' },
  { value: 'knockout', label: 'Knockout' },
  { value: 'finished', label: 'Finished' },
];

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminSeasonControl({
  status,
  currentMatchday,
  totalMatchdays,
}: {
  status: TournamentStatusValue;
  currentMatchday: number | null;
  totalMatchdays: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [matchdayNumber, setMatchdayNumber] = useState(String((currentMatchday ?? 0) + 1));
  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [deadline, setDeadline] = useState(toLocalInputValue(defaultDeadline));

  async function onStatusChange(next: TournamentStatusValue) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await setTournamentStatusAction(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the phase.');
    } finally {
      setBusy(false);
    }
  }

  async function onStartMatchday(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const deadlineIso = new Date(deadline).toISOString();
      const result = await startMatchdayAction(Number(matchdayNumber), deadlineIso);
      setNotice(
        result.missingCrestPlayerNames.length
          ? `Matchday ${result.matchday} started. Missing crests: ${result.missingCrestPlayerNames.join(', ')}.`
          : `Matchday ${result.matchday} started.`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the matchday.');
    } finally {
      setBusy(false);
    }
  }

  async function onCloseMatchday() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await closeMatchdayAction();
      setNotice(
        result.disputedCount
          ? `Matchday ${result.matchday} closed. ${result.disputedCount} unplayed match(es) moved to disputed.`
          : `Matchday ${result.matchday} closed. Everything was played.`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not close the matchday.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <Card>
        <CardHeader>
          <CardTitle>Phase</CardTitle>
          <CardDescription>
            Currently <strong>{status}</strong>
            {currentMatchday ? ` · Matchday ${currentMatchday} of ${totalMatchdays || currentMatchday}` : null}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={status} onValueChange={(v) => onStatusChange(v as TournamentStatusValue)} disabled={busy}>
            <SelectTrigger style={{ maxWidth: '20rem' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Start a matchday</CardTitle>
          <CardDescription>
            Blocks if any approved player is missing a team name (matchday 1 only); warns about missing crests but
            does not block.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onStartMatchday} style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label htmlFor="md-number" className="admin-eyebrow" style={{ display: 'block', marginBottom: '.35rem' }}>
                Matchday
              </label>
              <Input
                id="md-number"
                type="number"
                min={1}
                value={matchdayNumber}
                onChange={(e) => setMatchdayNumber(e.target.value)}
                style={{ width: '7rem' }}
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="md-deadline" className="admin-eyebrow" style={{ display: 'block', marginBottom: '.35rem' }}>
                Deadline
              </label>
              <Input
                id="md-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button type="submit" disabled={busy}>
              Start matchday
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Close current matchday</CardTitle>
          <CardDescription>Unplayed matches on the current matchday are marked disputed.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={busy || !currentMatchday}>
                Close matchday {currentMatchday ?? ''}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close matchday {currentMatchday}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Any match still scheduled or awaiting confirmation will be marked disputed for the admin to resolve.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction type="button" variant="destructive" onClick={onCloseMatchday}>
                  Close matchday
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {notice ? <p style={{ color: 'var(--color-success)' }}>{notice}</p> : null}
      {error ? <p style={{ color: 'var(--destructive)' }}>{error}</p> : null}
    </div>
  );
}
