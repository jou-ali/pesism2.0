import { getAdminDashboard } from '@/lib/tournax-api';
import { AdminRegistrationActions } from '@/components/admin-registration-actions';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminPageHead } from '@/components/admin-page-head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function formatInstant(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export default async function AdminOverviewPage() {
  let dashboard;
  let error: string | null = null;
  try {
    dashboard = await getAdminDashboard();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not reach API';
  }

  if (error || !dashboard) {
    return <AdminApiStatus error={error ?? 'Unknown error'} />;
  }

  return (
    <>
      <AdminPageHead
        eyebrow={`Season ${dashboard.season}`}
        title={dashboard.name}
        action={<AdminRegistrationActions registrationOpen={dashboard.registrationOpen} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="card--accent">
          <CardContent>
            <span className="text-sm font-semibold opacity-80">Registered</span>
            <strong className="mt-1 block text-3xl tabular-nums">{dashboard.totalRegistrations}</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <span className="text-sm text-muted-foreground">Approved</span>
            <strong className="mt-1 block text-3xl tabular-nums">{dashboard.approvedCount}</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <span className="text-sm text-muted-foreground">Pending</span>
            <strong className="mt-1 block text-3xl tabular-nums">{dashboard.pendingCount}</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <span className="text-sm text-muted-foreground">Slots</span>
            <strong className="mt-1 block text-3xl tabular-nums">
              {dashboard.maxPlayers != null
                ? `${dashboard.totalRegistrations} / ${dashboard.maxPlayers}`
                : dashboard.totalRegistrations}
            </strong>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration window</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="font-semibold">{dashboard.registrationOpen ? 'Open' : 'Closed'}</dd>
            <dt className="text-sm text-muted-foreground">Phase</dt>
            <dd className="font-semibold">{dashboard.status}</dd>
            <dt className="text-sm text-muted-foreground">Opens</dt>
            <dd className="font-semibold">{formatInstant(dashboard.registrationOpensAt)}</dd>
            <dt className="text-sm text-muted-foreground">Closes</dt>
            <dd className="font-semibold">{formatInstant(dashboard.registrationClosesAt)}</dd>
          </dl>
          {!dashboard.registrationOpen ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Closing registration switches the tournament to the <strong>league</strong> phase. Use{' '}
              <strong>Reopen registration</strong> above to accept new sign-ups again (extends the window by 30 days).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
