'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { removeTeamCrestAction, updateTeamAction, uploadTeamCrestAction } from '@/app/admin/actions';
import type { TeamRow } from '@/lib/tournax-api';
import { avatarSvg } from '@/lib/avatar';
import { TeamCrest } from '@/components/team-crest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const CREST_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,image/heic,image/heif';

function useTeamRowState(row: TeamRow) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [teamName, setTeamName] = useState(row.teamName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveTeamName() {
    const trimmed = teamName.trim().slice(0, 30);
    if (!trimmed) {
      setError('Team name cannot be blank.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateTeamAction(row.playerId, { teamName: trimmed });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the team name.');
    } finally {
      setBusy(false);
    }
  }

  async function onCrestFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('crest', file, file.name);
      fd.set('previousCrestUrl', row.crestUrl ?? '');
      await uploadTeamCrestAction(row.playerId, fd);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Crest upload failed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeCrest() {
    if (!row.crestUrl) return;
    setBusy(true);
    setError(null);
    try {
      await removeTeamCrestAction(row.playerId, row.crestUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove the crest.');
    } finally {
      setBusy(false);
    }
  }

  return { fileRef, teamName, setTeamName, busy, error, saveTeamName, onCrestFile, removeCrest };
}

function PlayerAvatar({ row }: { row: TeamRow }) {
  if (row.avatarUrl) {
    return (
      <Image
        src={row.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <span
      className="size-10 shrink-0 overflow-hidden rounded-full"
      dangerouslySetInnerHTML={{ __html: avatarSvg(row.playerName, row.playerId.length) }}
    />
  );
}

function TeamCard({ row }: { row: TeamRow }) {
  const state = useTeamRowState(row);
  const missingName = !row.teamName;
  const missingCrest = !row.hasCrest;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <PlayerAvatar row={row} />
        <div className="flex-1">
          <p className="font-semibold">{row.playerName}</p>
          <div className="mt-1 flex min-h-6 flex-wrap items-center gap-1.5">
            {missingName ? <Badge variant="destructive">Missing team name</Badge> : null}
            {missingCrest ? <Badge variant="secondary">No crest yet</Badge> : null}
            {!missingName && !missingCrest ? <Badge variant="success">Team complete</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="size-auto shrink-0 rounded-full p-0"
            onClick={() => state.fileRef.current?.click()}
            disabled={state.busy}
            title={`Upload crest for ${row.playerName}`}
          >
            <TeamCrest teamName={row.teamName} crestUrl={row.crestUrl} size={56} />
          </Button>
          <input
            ref={state.fileRef}
            type="file"
            accept={CREST_ACCEPT}
            className="sr-only"
            onChange={(e) => state.onCrestFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => state.fileRef.current?.click()} disabled={state.busy}>
              {row.hasCrest ? 'Replace' : 'Upload crest'}
            </Button>
            {row.hasCrest ? (
              <Button type="button" size="sm" variant="ghost" onClick={state.removeCrest} disabled={state.busy}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={state.teamName}
            onChange={(e) => state.setTeamName(e.target.value)}
            maxLength={30}
            placeholder="Team pending"
            disabled={state.busy}
          />
          <Button
            type="button"
            onClick={state.saveTeamName}
            disabled={state.busy || state.teamName.trim() === (row.teamName ?? '')}
          >
            Save
          </Button>
        </div>

        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AdminTeamsPanel({ rows }: { rows: TeamRow[] }) {
  if (!rows.length) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No approved players yet.</p>
        </CardContent>
      </Card>
    );
  }

  const complete = rows.filter((r) => r.teamName && r.hasCrest).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {complete} / {rows.length}
        </span>{' '}
        teams complete
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <TeamCard key={row.playerId} row={row} />
        ))}
      </div>
    </div>
  );
}
