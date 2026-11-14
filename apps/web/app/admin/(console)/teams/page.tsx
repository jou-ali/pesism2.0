import { listTeams } from '@/lib/tournax-api';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminTeamsPanel } from '@/components/admin-teams-panel';
import { AdminPageHead } from '@/components/admin-page-head';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  let rows: Awaited<ReturnType<typeof listTeams>> = [];
  let error: string | null = null;
  try {
    rows = await listTeams();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load teams';
  }

  return (
    <>
      <AdminPageHead eyebrow="Teams" title="Team names & crests" />

      {error ? <AdminApiStatus error={error} /> : <AdminTeamsPanel rows={rows} />}
    </>
  );
}
