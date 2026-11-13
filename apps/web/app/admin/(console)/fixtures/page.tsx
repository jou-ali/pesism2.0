import Link from 'next/link';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminRecordMatchForm } from '@/components/admin-record-match-form';
import { AdminPageHead } from '@/components/admin-page-head';
import { ResponsiveList, type ResponsiveListColumn } from '@/components/admin-responsive-list';
import { listAdminFixtures, listAdminMatches, type AdminMatchRow } from '@/lib/tournax-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'disputed') return 'destructive';
  if (status === 'confirmed' || status === 'resolved' || status === 'forfeit') return 'default';
  return 'secondary';
}

const COLUMNS: ResponsiveListColumn<AdminMatchRow>[] = [
  { key: 'md', header: 'MD', cell: (m) => m.matchday },
  { key: 'home', header: 'Home', cell: (m) => m.homeName },
  {
    key: 'score',
    header: 'Score',
    cell: (m) => <span className="tabular-nums">{m.homeGoals !== null && m.awayGoals !== null ? `${m.homeGoals}–${m.awayGoals}` : '—'}</span>,
  },
  { key: 'away', header: 'Away', cell: (m) => m.awayName },
  { key: 'status', header: 'Status', cell: (m) => <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge> },
  { key: 'stats', header: 'Stats', cell: (m) => (m.hasStats ? 'Yes' : '—') },
  {
    key: 'actions',
    header: '',
    cell: (m) => (
      <Link href={`/admin/fixtures/${m.id}`} className="text-sm font-semibold text-(--color-accent)! hover:underline">
        View / edit
      </Link>
    ),
  },
];

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  let error: string | null = null;
  let fixtures = [] as Awaited<ReturnType<typeof listAdminFixtures>>;
  let matches = [] as Awaited<ReturnType<typeof listAdminMatches>>;

  try {
    fixtures = await listAdminFixtures();
    matches = await listAdminMatches();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load results';
  }

  const disputedCount = matches.filter((m) => m.status === 'disputed').length;
  const visibleMatches = statusFilter === 'disputed' ? matches.filter((m) => m.status === 'disputed') : matches;

  return (
    <>
      <AdminPageHead eyebrow="League results" title="Record a match" />

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New result</CardTitle>
              <CardDescription>
                Pick a fixture that already exists under <Link href="/admin/schedule" className="font-semibold text-(--color-accent)! hover:underline">Fixtures</Link>.
                You cannot enter a score for a pairing that was not scheduled. Results count in the table immediately (admin
                resolved).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AdminRecordMatchForm scheduled={fixtures} />
            </CardContent>
          </Card>

          <AdminPageHead
            eyebrow="Recorded"
            title="Recent results"
            action={
              <div className="flex gap-3 text-sm font-semibold">
                <Link href="/admin/fixtures" className="text-(--color-accent)! aria-[current=page]:underline" aria-current={!statusFilter ? 'page' : undefined}>
                  All
                </Link>
                <Link
                  href="/admin/fixtures?status=disputed"
                  className="text-(--color-accent)! aria-[current=page]:underline"
                  aria-current={statusFilter === 'disputed' ? 'page' : undefined}
                >
                  Disputed only {disputedCount ? `(${disputedCount})` : ''}
                </Link>
              </div>
            }
          />

          <ResponsiveList
            rows={visibleMatches}
            rowKey={(m) => m.id}
            columns={COLUMNS}
            emptyMessage={statusFilter === 'disputed' ? 'No disputed matches.' : 'No results yet.'}
            renderCard={(m) => (
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">MD{m.matchday}</span>
                  <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 pt-3">
                  <p className="font-semibold">
                    {m.homeName} <span className="tabular-nums">{m.homeGoals !== null && m.awayGoals !== null ? `${m.homeGoals}–${m.awayGoals}` : 'vs'}</span> {m.awayName}
                  </p>
                  <p className="text-sm text-muted-foreground">{m.hasStats ? 'Score sheet recorded' : 'No score sheet'}</p>
                </CardContent>
                <div className="flex items-center rounded-b-(--r-xl) border-t border-(--line-hairline) bg-(--color-paper)/35 p-(--card-spacing)">
                  <Link href={`/admin/fixtures/${m.id}`} className="text-sm font-semibold text-(--color-accent)! hover:underline">
                    View / edit
                  </Link>
                </div>
              </Card>
            )}
          />
        </>
      )}
    </>
  );
}
