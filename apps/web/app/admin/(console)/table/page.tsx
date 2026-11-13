import { computeStandings, topScorers } from '@tournax/core';
import { fetchSeasonCompetition } from '@/lib/season-competition';
import { AdminStandingsView } from '@/components/admin-standings-view';
import { AdminFairPlayView } from '@/components/admin-fair-play-view';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminPageHead } from '@/components/admin-page-head';
import { listFairPlay } from '@/lib/tournax-api';

export const dynamic = 'force-dynamic';

export default async function AdminTablePage() {
  const competition = await fetchSeasonCompetition();
  let fairPlay: Awaited<ReturnType<typeof listFairPlay>> = [];
  let fairPlayError: string | null = null;
  try {
    fairPlay = await listFairPlay();
  } catch (e) {
    fairPlayError = e instanceof Error ? e.message : 'Could not load fair play stats';
  }
  const preview =
    competition?.hasResults === true
      ? {
          table: computeStandings(competition.players.map((p) => p.id), competition.matches, competition.points),
          scorers: topScorers(competition.players.map((p) => p.id), competition.matches),
        }
      : null;

  return (
    <>
      <AdminPageHead eyebrow="Computed standings" title="League table & scorers" />

      {!competition ? (
        <AdminApiStatus error="Could not reach the API. Start the Spring backend and check TOURNAX_API_URL in apps/web/.env.local." />
      ) : (
        <>
          <AdminStandingsView competition={competition} />
          {fairPlayError ? (
            <p className="mt-5 text-sm text-destructive">
              Fair play data unavailable ({fairPlayError}). Restart the backend after pulling latest code.
            </p>
          ) : (
            <AdminFairPlayView rows={fairPlay} />
          )}
          {preview ? (
            <p className="mt-5 text-sm text-muted-foreground">
              {preview.table.length} players · {preview.scorers.reduce((n, s) => n + s.goals, 0)} goals counted in live
              matches.
            </p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Public site shows coming soon until you record the first result under Results.
            </p>
          )}
        </>
      )}
    </>
  );
}
