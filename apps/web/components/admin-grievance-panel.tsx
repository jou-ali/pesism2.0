'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addGrievanceCommentAction, updateGrievanceStatusAction } from '@/app/admin/actions';
import type { GrievanceDetail, GrievanceStatus } from '@/lib/tournax-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const STATUS: { value: GrievanceStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function AdminGrievancePanel({ grievance }: { grievance: GrievanceDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState<GrievanceStatus>(grievance.status);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(grievance.status);
  }, [grievance.status]);

  async function saveStatus() {
    setBusy(true);
    setError(null);
    try {
      await updateGrievanceStatusAction(grievance.id, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status');
    } finally {
      setBusy(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addGrievanceCommentAction(grievance.id, comment.trim());
      setComment('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add comment');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{grievance.playerName}</strong> · {grievance.playerEmail} · {grievance.playerWaNumber}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Filed {formatWhen(grievance.createdAt)} · Category: {grievance.category}
          </p>
          <h3 className="mt-5 font-heading! text-lg uppercase tracking-(--tracking-headline)">{grievance.subject}</h3>
          <p className="leading-relaxed whitespace-pre-wrap">{grievance.message}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="grievance-status">Committee decision</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as GrievanceStatus)} disabled={busy}>
              <SelectTrigger id="grievance-status" className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={busy || status === grievance.status} onClick={saveStatus}>
            Update status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin comments</CardTitle>
        </CardHeader>
        <CardContent>
          {grievance.comments.length ? (
            <ul className="flex flex-col gap-3">
              {grievance.comments.map((c) => (
                <li key={c.id} className="rounded-[10px] border border-(--line-card) bg-black/20 p-3">
                  <time className="text-xs text-muted-foreground" dateTime={c.createdAt}>
                    {formatWhen(c.createdAt)}
                  </time>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No committee notes yet.</p>
          )}

          <form onSubmit={postComment} className="mt-4 grid gap-2.5">
            <Label htmlFor="grievance-comment">Add comment (visible to admins only for now)</Label>
            <Textarea
              id="grievance-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={busy}
            />
            <Button type="submit" variant="ghost" disabled={busy || !comment.trim()}>
              {busy ? 'Saving…' : 'Post comment'}
            </Button>
          </form>
          {error ? <p className="admin-login-error">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
