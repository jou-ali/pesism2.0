import { fetchSeasonCompetition } from '@/lib/season-competition';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminSeasonControl } from '@/components/admin-season-control';

export const dynamic = 'force-dynamic';

export default async function AdminSeasonPage() {
  const competition = await fetchSeasonCompetition();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Season control</p>
          <h2>Phases &amp; matchdays</h2>
        </div>
      </header>

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
