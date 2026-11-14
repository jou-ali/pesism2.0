import type { Metadata } from 'next';
import { fetchSeasonCompetition } from '@/lib/season-competition';
import { StandingsPanels } from '@/components/standings-panels';
import { ShareImageActions } from '@/components/share-image-actions';
import { latestPlayedMatchday } from '@/lib/matchday-status';
import { getMatchdayTableData, posterVersion } from '@/lib/share/data';

export const metadata: Metadata = { title: 'Standings · TOURNAX Season 3' };

export default async function TablePage() {
  const competition = await fetchSeasonCompetition();
  const lastMd = competition ? latestPlayedMatchday(competition.matches) : null;
  const tableData = lastMd ? await getMatchdayTableData(lastMd, false) : null;

  return (
    <section className="section standings" style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      <div className="container">
        <div className="section__head">
          <h2 className="h2">Full table.</h2>
          <p className="lead">
            Points, goal difference, goals scored, then head to head (in that order). Only confirmed, resolved and forfeit matches count.
          </p>
          {tableData ? (
            <ShareImageActions
              imageUrl={`/api/share/matchday/${lastMd}/table?v=${posterVersion(tableData)}`}
              caption={`Table after Matchday ${String(lastMd).padStart(2, '0')}. Numbers don't do banter. tournax.auradev.in/table`}
              filename={`matchday-${lastMd}-table.png`}
            />
          ) : null}
        </div>

        <StandingsPanels competition={competition} />
      </div>
    </section>
  );
}
