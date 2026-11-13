import { listRegistrations, type AdminRegistration } from '@/lib/tournax-api';
import { AdminPlayerActions } from '@/components/admin-player-actions';
import { AdminPlayerAvatar } from '@/components/admin-player-avatar';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminPageHead } from '@/components/admin-page-head';
import { ResponsiveList, type ResponsiveListColumn } from '@/components/admin-responsive-list';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const COLUMNS: ResponsiveListColumn<AdminRegistration>[] = [
  { key: 'photo', header: 'Photo', cell: (row) => <AdminPlayerAvatar playerId={row.playerId} name={row.name} avatarUrl={row.avatarUrl ?? null} /> },
  { key: 'name', header: 'Name', cell: (row) => row.name },
  { key: 'gaming', header: 'Gaming', cell: (row) => row.gamingUsername },
  { key: 'efootball', header: 'eFootball', cell: (row) => row.efootballUsername ?? '—' },
  { key: 'city', header: 'City', cell: (row) => row.city },
  { key: 'email', header: 'Email', cell: (row) => row.email },
  { key: 'phone', header: 'Phone', cell: (row) => <span className="tabular-nums">{row.waNumber}</span> },
  {
    key: 'verified',
    header: 'Email verified',
    cell: (row) => <Badge variant={row.emailVerified ? 'default' : 'secondary'}>{row.emailVerified ? 'Verified' : 'Unverified'}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <Badge variant={row.approved ? 'default' : 'secondary'}>{row.approved ? 'Approved' : 'Pending'}</Badge>,
  },
  {
    key: 'actions',
    header: '',
    cell: (row) => <AdminPlayerActions playerId={row.playerId} approved={row.approved} name={row.name} />,
  },
];

export default async function AdminPlayersPage() {
  let rows: AdminRegistration[] | null = null;
  let error: string | null = null;
  try {
    rows = await listRegistrations();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load players';
  }

  return (
    <>
      <AdminPageHead eyebrow="Roster" title="Players & registrations" />

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <ResponsiveList
          rows={rows ?? []}
          rowKey={(row) => row.playerId}
          columns={COLUMNS}
          emptyMessage="No registrations yet."
          renderCard={(row) => (
            <Card>
              <CardHeader className="flex-row items-center gap-3 border-b-0 pb-0">
                <AdminPlayerAvatar playerId={row.playerId} name={row.name} avatarUrl={row.avatarUrl ?? null} />
                <div className="flex-1">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.gamingUsername}</p>
                </div>
                <Badge variant={row.approved ? 'default' : 'secondary'}>{row.approved ? 'Approved' : 'Pending'}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>{row.city} · {row.email}</p>
                <p className="tabular-nums">{row.waNumber}</p>
                <Badge variant={row.emailVerified ? 'default' : 'secondary'} className="w-fit">
                  {row.emailVerified ? 'Email verified' : 'Email unverified'}
                </Badge>
              </CardContent>
              <CardFooter>
                <AdminPlayerActions playerId={row.playerId} approved={row.approved} name={row.name} />
              </CardFooter>
            </Card>
          )}
        />
      )}
    </>
  );
}
