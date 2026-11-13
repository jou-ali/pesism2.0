import Link from 'next/link';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminRecordMatchForm } from '@/components/admin-record-match-form';
import { listAdminFixtures, listAdminMatches } from '@/lib/tournax-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'disputed') return 'destructive';
  if (status === 'confirmed' || status === 'resolved' || status === 'forfeit') return 'default';
  return 'secondary';
}

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
      <header className="admin-page-head">
        <div>
          <p className="admin-eyebrow">League results</p>
          <h2>Record a match</h2>
        </div>
      </header>

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <>
          <div className="admin-card admin-card--form">
            <p className="admin-muted">
              Pick a fixture that already exists under <Link href="/admin/schedule" className="admin-link">Fixtures</Link>.
              You cannot enter a score for a pairing that was not scheduled. Results count in the table immediately (admin
              resolved).
            </p>
            <AdminRecordMatchForm scheduled={fixtures} />
          </div>

          <header className="admin-page-head" style={{ marginTop: '2rem' }}>
            <div>
              <p className="admin-eyebrow">Recorded</p>
              <h2>Recent results</h2>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <Link href="/admin/fixtures" className="admin-link" aria-current={!statusFilter ? 'page' : undefined}>
                All
              </Link>
              <Link
                href="/admin/fixtures?status=disputed"
                className="admin-link"
                aria-current={statusFilter === 'disputed' ? 'page' : undefined}
              >
                Disputed only {disputedCount ? `(${disputedCount})` : ''}
              </Link>
            </div>
          </header>

          {!visibleMatches.length ? (
            <Card>
              <CardContent>
                <p className="admin-muted">{statusFilter === 'disputed' ? 'No disputed matches.' : 'No results yet.'}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MD</TableHead>
                      <TableHead>Home</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Away</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead aria-label="Actions" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleMatches.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.matchday}</TableCell>
                        <TableCell>{m.homeName}</TableCell>
                        <TableCell className="admin-mono">
                          {m.homeGoals !== null && m.awayGoals !== null ? `${m.homeGoals}–${m.awayGoals}` : '—'}
                        </TableCell>
                        <TableCell>{m.awayName}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                        </TableCell>
                        <TableCell>{m.hasStats ? 'Yes' : '—'}</TableCell>
                        <TableCell>
                          <Link href={`/admin/fixtures/${m.id}`} className="admin-link">
                            View / edit
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
