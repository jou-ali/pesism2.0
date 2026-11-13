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
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TeamRowItem({ row }: { row: TeamRow }) {
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

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title={`Upload crest for ${row.playerName}`}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
        >
          <TeamCrest
            teamName={row.teamName}
            crestUrl={row.crestUrl}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            size={40}
          />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onCrestFile(e.target.files?.[0] ?? null)}
        />
      </TableCell>
      <TableCell>{row.playerName}</TableCell>
      <TableCell>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={30}
            placeholder="Team pending"
            disabled={busy}
          />
          <Button type="button" size="sm" onClick={saveTeamName} disabled={busy || teamName.trim() === (row.teamName ?? '')}>
            Save
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            onBlur={saveColors}
            disabled={busy}
            aria-label="Primary colour"
          />
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            onBlur={saveColors}
            disabled={busy}
            aria-label="Secondary colour"
          />
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={row.hasCrest ? 'default' : 'secondary'}>{row.hasCrest ? 'Crest added' : 'Missing'}</Badge>
      </TableCell>
      <TableCell>
        <Button type="button" size="sm" variant="outline" onClick={copySetupLink} disabled={busy}>
          {linkCopied ? 'Copied!' : 'Copy setup link'}
        </Button>
        {error ? <p style={{ color: 'var(--destructive)', fontSize: '.8rem', marginTop: '.35rem' }}>{error}</p> : null}
      </TableCell>
    </TableRow>
  );
}

export function AdminTeamsPanel({ rows }: { rows: TeamRow[] }) {
  if (!rows.length) {
    return (
      <Card>
        <CardContent>
          <p className="admin-muted">No approved players yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
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
              <TeamRowItem key={row.playerId} row={row} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
