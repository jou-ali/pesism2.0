import Link from 'next/link';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminPageHead } from '@/components/admin-page-head';
import { ResponsiveList, type ResponsiveListColumn } from '@/components/admin-responsive-list';
import { listAdminGrievances, type GrievanceStatus } from '@/lib/tournax-api';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { VariantProps } from 'class-variance-authority';

export const dynamic = 'force-dynamic';

type GrievanceRow = Awaited<ReturnType<typeof listAdminGrievances>>[number];

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const STATUS_VARIANT: Record<GrievanceStatus, NonNullable<VariantProps<typeof badgeVariants>['variant']>> = {
  open: 'outline',
  in_review: 'secondary',
  resolved: 'success',
  rejected: 'destructive',
};

const COLUMNS: ResponsiveListColumn<GrievanceRow>[] = [
  { key: 'when', header: 'When', cell: (g) => <span className="tabular-nums">{new Date(g.createdAt).toLocaleDateString('en-IN')}</span> },
  { key: 'player', header: 'Player', cell: (g) => g.playerName },
  { key: 'category', header: 'Category', cell: (g) => g.category },
  { key: 'subject', header: 'Subject', cell: (g) => g.subject },
  { key: 'status', header: 'Status', cell: (g) => <Badge variant={STATUS_VARIANT[g.status]}>{STATUS_LABEL[g.status]}</Badge> },
  { key: 'notes', header: 'Notes', cell: (g) => g.commentCount },
  {
    key: 'actions',
    header: '',
    cell: (g) => (
      <Link href={`/admin/grievances/${g.id}`} className="text-sm font-semibold text-(--color-accent)! hover:underline">
        Review
      </Link>
    ),
  },
];

export default async function AdminGrievancesPage() {
  let rows: GrievanceRow[] = [];
  let error: string | null = null;
  try {
    rows = await listAdminGrievances();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load grievances';
  }

  return (
    <>
      <AdminPageHead eyebrow="Member issues" title="Grievances" />

      {error ? (
        <AdminApiStatus error={error} />
      ) : (
        <ResponsiveList
          rows={rows}
          rowKey={(g) => g.id}
          columns={COLUMNS}
          emptyMessage="No grievances yet. Players file from the public Grievances page."
          renderCard={(g) => (
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground tabular-nums">{new Date(g.createdAt).toLocaleDateString('en-IN')}</span>
                <Badge variant={STATUS_VARIANT[g.status]}>{STATUS_LABEL[g.status]}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pt-3">
                <p className="font-semibold">{g.subject}</p>
                <p className="text-sm text-muted-foreground">{g.playerName} · {g.category} · {g.commentCount} note{g.commentCount === 1 ? '' : 's'}</p>
              </CardContent>
              <div className="flex items-center rounded-b-(--r-xl) border-t border-(--line-hairline) bg-(--color-paper)/35 p-(--card-spacing)">
                <Link href={`/admin/grievances/${g.id}`} className="text-sm font-semibold text-(--color-accent)! hover:underline">
                  Review
                </Link>
              </div>
            </Card>
          )}
        />
      )}
    </>
  );
}
