'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { issueTeamSetupLinkAction, updateTeamAction, uploadTeamCrestAction } from '@/app/admin/actions';
import type { TeamRow } from '@/lib/tournax-api';
import { cropToSquareAndCompress } from '@/lib/image-crop';
import { sampleDominantColors } from '@/lib/dominant-color';
import { TeamCrest } from '@/components/team-crest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function useTeamRowState(row: TeamRow) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [teamName, setTeamName] = useState(row.teamName ?? '');
  const [primaryColor, setPrimaryColor] = useState(row.primaryColor ?? '#DED002');
  const [secondaryColor, setSecondaryColor] = useState(row.secondaryColor ?? '#9938D4');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  async function saveTeamName() {
    const trimmed = teamName.trim();
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
      setError(e instanceof Error ? e.message : 'Could not save team name.');
    } finally {
      setBusy(false);
    }
  }

  async function onCrestFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropToSquareAndCompress(file);
      const [p1, p2] = await sampleDominantColors(cropped);
      setPrimaryColor(p1);
      setSecondaryColor(p2);

      const fd = new FormData();
      fd.set('crest', cropped, 'crest.webp');
      fd.set('primaryColor', p1);
      fd.set('secondaryColor', p2);
      await uploadTeamCrestAction(row.playerId, fd);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Crest upload failed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function saveColors() {
    setBusy(true);
    setError(null);
    try {
      await updateTeamAction(row.playerId, { primaryColor, secondaryColor });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save colours.');
    } finally {
      setBusy(false);
    }
  }

  async function copySetupLink() {
    setBusy(true);
    setError(null);
    try {
      const { token } = await issueTeamSetupLinkAction(row.playerId);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${origin}/team-setup/${token}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a setup link.');
    } finally {
      setBusy(false);
    }
  }

  return {
    fileRef,
    teamName,
    setTeamName,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    busy,
    error,
    linkCopied,
    saveTeamName,
    onCrestFile,
    saveColors,
    copySetupLink,
  };
}

function CrestButton({ row, state, size }: { row: TeamRow; state: ReturnType<typeof useTeamRowState>; size: number }) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="size-auto rounded-full p-0"
        onClick={() => state.fileRef.current?.click()}
        disabled={state.busy}
        title={`Upload crest for ${row.playerName}`}
      >
        <TeamCrest
          teamName={row.teamName}
          crestUrl={row.crestUrl}
          primaryColor={state.primaryColor}
          secondaryColor={state.secondaryColor}
          size={size}
        />
      </Button>
      <input
        ref={state.fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => state.onCrestFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}

function ColorSwatches({ state }: { state: ReturnType<typeof useTeamRowState> }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={state.primaryColor}
        onChange={(e) => state.setPrimaryColor(e.target.value)}
        onBlur={state.saveColors}
        disabled={state.busy}
        aria-label="Primary colour"
        className="size-8 cursor-pointer rounded-[8px] border border-(--line-card) bg-transparent p-0.5"
      />
      <input
        type="color"
        value={state.secondaryColor}
        onChange={(e) => state.setSecondaryColor(e.target.value)}
        onBlur={state.saveColors}
        disabled={state.busy}
        aria-label="Secondary colour"
        className="size-8 cursor-pointer rounded-[8px] border border-(--line-card) bg-transparent p-0.5"
      />
    </div>
  );
}

function NameField({ row, state }: { row: TeamRow; state: ReturnType<typeof useTeamRowState> }) {
  return (
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
        size="sm"
        onClick={state.saveTeamName}
        disabled={state.busy || state.teamName.trim() === (row.teamName ?? '')}
      >
        Save
      </Button>
    </div>
  );
}

function TeamDesktopRow({ row }: { row: TeamRow }) {
  const state = useTeamRowState(row);
  return (
    <TableRow>
      <TableCell>
        <CrestButton row={row} state={state} size={40} />
      </TableCell>
      <TableCell>{row.playerName}</TableCell>
      <TableCell>
        <NameField row={row} state={state} />
      </TableCell>
      <TableCell>
        <ColorSwatches state={state} />
      </TableCell>
      <TableCell>
        <Badge variant={row.hasCrest ? 'default' : 'secondary'}>{row.hasCrest ? 'Crest added' : 'Missing'}</Badge>
      </TableCell>
      <TableCell>
        <Button type="button" size="sm" variant="outline" onClick={state.copySetupLink} disabled={state.busy}>
          {state.linkCopied ? 'Copied!' : 'Copy setup link'}
        </Button>
        {state.error ? <p className="mt-1 text-xs text-destructive">{state.error}</p> : null}
      </TableCell>
    </TableRow>
  );
}

function TeamCard({ row }: { row: TeamRow }) {
  const state = useTeamRowState(row);
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <CrestButton row={row} state={state} size={40} />
        <div className="flex-1">
          <p className="font-semibold">{row.playerName}</p>
          <p className="text-sm text-muted-foreground">{row.teamName ?? 'Team pending'}</p>
        </div>
        <Badge variant={row.hasCrest ? 'default' : 'secondary'}>{row.hasCrest ? 'Crest added' : 'Missing'}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-3">
        <NameField row={row} state={state} />
        <ColorSwatches state={state} />
        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </CardContent>
      <CardFooter>
        <Button type="button" size="sm" variant="outline" onClick={state.copySetupLink} disabled={state.busy}>
          {state.linkCopied ? 'Copied!' : 'Copy setup link'}
        </Button>
      </CardFooter>
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

  return (
    <>
      <Card className="hidden md:block">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crest</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team name</TableHead>
                <TableHead>Colours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Setup link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TeamDesktopRow key={row.playerId} row={row} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <TeamCard key={row.playerId} row={row} />
        ))}
      </div>
    </>
  );
}
