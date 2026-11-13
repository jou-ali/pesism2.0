import { listTeams } from '@/lib/tournax-api';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminTeamsPanel } from '@/components/admin-teams-panel';

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
      <header className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Teams</p>
          <h2>Crests &amp; colours</h2>
        </div>
      </header>

      {error ? <AdminApiStatus error={error} /> : <AdminTeamsPanel rows={rows} />}
    </>
  );
}
