import { listRegistrationAudit, type RegistrationAuditRow } from '@/lib/tournax-api';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminPageHead } from '@/components/admin-page-head';
import { ResponsiveList, type ResponsiveListColumn } from '@/components/admin-responsive-list';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function location(row: RegistrationAuditRow) {
  const parts = [row.ipCity, row.ipRegion, row.ipCountry].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function shortUa(ua: string | null) {
  if (!ua) return '—';
  return ua.length > 48 ? `${ua.slice(0, 48)}…` : ua;
}

const COLUMNS: ResponsiveListColumn<RegistrationAuditRow>[] = [
  { key: 'when', header: 'When (IST)', cell: (row) => <span className="tabular-nums whitespace-nowrap">{formatWhen(row.createdAt)}</span> },
  { key: 'event', header: 'Event', cell: (row) => row.eventType },
  { key: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
  { key: 'city', header: 'Form city', cell: (row) => row.formCity ?? '—' },
  { key: 'ip', header: 'IP', cell: (row) => <span className="tabular-nums">{row.ipAddress ?? '—'}</span> },
  { key: 'geo', header: 'Geo', cell: (row) => location(row) },
  {
    key: 'referer',
    header: 'Referer',
    cell: (row) => (
      <span className="block max-w-40 truncate" title={row.referer ?? undefined}>
        {row.referer ?? '—'}
      </span>
    ),
  },
  {
    key: 'ua',
    header: 'UA',
    cell: (row) => (
      <span className="block max-w-40 truncate" title={row.userAgent ?? undefined}>
        {shortUa(row.userAgent)}
      </span>
    ),
  },
  {
    key: 'detail',
    header: 'Detail',
    cell: (row) => (
      <span className="block max-w-40 truncate" title={row.detail ?? undefined}>
        {row.detail ?? '—'}
      </span>
    ),
  },
];

export default async function AdminRegistrationAuditPage() {
  let rows: RegistrationAuditRow[] | null = null;
  let error: string | null = null;
  try {
    rows = await listRegistrationAudit();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load audit log';
  }

  return (
    <>
      <AdminPageHead eyebrow="Sign-ups" title="Registration audit" />

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Append-only log of OTP send, verify attempts, and completed sign-ups. IP and geo come from the browser
        request (Vercel adds country/city in production; local tests may show only IP).
      </p>

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <ResponsiveList
          rows={rows ?? []}
          rowKey={(row) => String(row.id)}
          columns={COLUMNS}
          emptyMessage="No audit events yet."
          renderCard={(row) => (
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <Badge variant="outline">{row.eventType}</Badge>
                <span className="text-xs tabular-nums text-muted-foreground">{formatWhen(row.createdAt)}</span>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>{row.email ?? '—'} · {row.formCity ?? '—'}</p>
                <p className="tabular-nums">{row.ipAddress ?? '—'} · {location(row)}</p>
                <p className="truncate" title={row.referer ?? undefined}>{row.referer ?? '—'}</p>
                <p className="truncate" title={row.detail ?? undefined}>{row.detail ?? '—'}</p>
              </CardContent>
            </Card>
          )}
        />
      )}
    </>
  );
}
