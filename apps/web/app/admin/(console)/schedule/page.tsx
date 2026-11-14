import Link from 'next/link';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminScheduleMatchForm } from '@/components/admin-schedule-match-form';
import { AdminPageHead } from '@/components/admin-page-head';
import { ResponsiveList, type ResponsiveListColumn } from '@/components/admin-responsive-list';
import { FIXTURE_HOME_AWAY_NOTE } from '@/lib/fixture-sides';
import { listAdminFixtures, listRegistrations, type AdminMatchRow } from '@/lib/tournax-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function formatScore(home: number | null, away: number | null, status: string) {
  if (home !== null && away !== null && status !== 'scheduled') {
    return `${home}–${away}`;
  }
  return 'vs';
}

const COLUMNS: ResponsiveListColumn<AdminMatchRow>[] = [
  { key: 'md', header: 'MD', cell: (f) => f.matchday },
  { key: 'home', header: 'Home', cell: (f) => f.homeName },
  { key: 'score', header: 'Score', cell: (f) => <span className="tabular-nums">{formatScore(f.homeGoals, f.awayGoals, f.status)}</span> },
  { key: 'away', header: 'Away', cell: (f) => f.awayName },
  { key: 'status', header: 'Status', cell: (f) => <Badge variant={f.status === 'scheduled' ? 'secondary' : 'default'}>{f.status}</Badge> },
  {
    key: 'actions',
    header: '',
    cell: (f) => (
      <Link href={f.status !== 'scheduled' ? `/admin/fixtures/${f.id}` : '/admin/fixtures'} className="text-sm font-semibold text-(--color-accent)! hover:underline">
        {f.status !== 'scheduled' ? 'Edit' : 'Enter result'}
      </Link>
    ),
  },
];

export default async function AdminSchedulePage() {
  let error: string | null = null;
  let approved: Awaited<ReturnType<typeof listRegistrations>> = [];
  let fixtures: Awaited<ReturnType<typeof listAdminFixtures>> = [];

  try {
    const rows = await listRegistrations();
    approved = rows.filter((r) => r.approved);
    fixtures = await listAdminFixtures();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load fixtures';
  }

  const scheduled = fixtures.filter((f) => f.status === 'scheduled');

  return (
    <>
      <AdminPageHead eyebrow="League stage" title="Fixtures" />

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add a fixture</CardTitle>
              <CardDescription>
                Pick matchday, home, and away. Published rows show on the public fixtures page. {FIXTURE_HOME_AWAY_NOTE}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminScheduleMatchForm approved={approved} />
            </CardContent>
          </Card>

          <AdminPageHead
            eyebrow="Published"
            title="League schedule"
            action={
              <Link href="/fixtures" className="text-sm font-semibold text-(--color-accent)! hover:underline" target="_blank" rel="noopener noreferrer">
                View public page
              </Link>
            }
          />

          <ResponsiveList
            rows={fixtures}
            rowKey={(f) => f.id}
            columns={COLUMNS}
            emptyMessage="No league fixtures yet. Add one above, then record scores under Results."
            renderCard={(f) => (
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">MD{f.matchday}</span>
                  <Badge variant={f.status === 'scheduled' ? 'secondary' : 'default'}>{f.status}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <p className="font-semibold">
                    {f.homeName} <span className="tabular-nums">{formatScore(f.homeGoals, f.awayGoals, f.status)}</span> {f.awayName}
                  </p>
                </CardContent>
                <div className="flex items-center rounded-b-(--r-xl) border-t border-(--line-hairline) bg-(--color-paper)/35 p-(--card-spacing)">
                  <Link href={f.status !== 'scheduled' ? `/admin/fixtures/${f.id}` : '/admin/fixtures'} className="text-sm font-semibold text-(--color-accent)! hover:underline">
                    {f.status !== 'scheduled' ? 'Edit' : 'Enter result'}
                  </Link>
                </div>
              </Card>
            )}
          />

          {scheduled.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {scheduled.length} unplayed. Scores:{' '}
              <Link href="/admin/fixtures" className="font-semibold text-(--color-accent)! hover:underline">
                Results
              </Link>{' '}
              (same matchday and players).
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
