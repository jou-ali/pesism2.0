import { fetchSeasonCompetition } from '@/lib/season-competition';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminSeasonControl } from '@/components/admin-season-control';
import { AdminPageHead } from '@/components/admin-page-head';

export const dynamic = 'force-dynamic';

export default async function AdminSeasonPage() {
  const competition = await fetchSeasonCompetition();

  return (
    <>
      <AdminPageHead eyebrow="Season control" title="Phases & matchdays" />

      {!competition ? (
        <AdminApiStatus error="Could not load the season." />
      ) : (
        <AdminSeasonControl
          status={competition.status}
          currentMatchday={competition.currentMatchday}
          totalMatchdays={competition.totalMatchdays}
        />
      )}
    </>
  );
}
