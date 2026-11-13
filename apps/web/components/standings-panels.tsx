import { computeStandings, topScorers } from '@tournax/core';
import type { SeasonCompetition } from '@/lib/season-competition';
import { CompetitionComingSoon } from './competition-coming-soon';
import { LeagueTable } from './league-table';
import { TopScorers } from './top-scorers';

type Props = {
  competition: SeasonCompetition | null;
  scorersLimit?: number;
  showFootLink?: boolean;
};

export function StandingsPanels({ competition, scorersLimit, showFootLink = false }: Props) {
  const qualifiers = competition?.knockoutQualifiers ?? 8;
  const playerIds = competition?.players.map((p) => p.id) ?? [];
  const playerNames = competition?.playerNames ?? {};
  const points = competition?.points;
  const matches = competition?.matches ?? [];
  const live = competition?.hasResults === true;
  const playerCrests = Object.fromEntries(
    (competition?.players ?? []).map((p) => [
      p.id,
      { teamName: p.teamName, crestUrl: p.crestUrl, primaryColor: p.primaryColor, secondaryColor: p.secondaryColor },
    ]),
  );

  const table = live ? computeStandings(playerIds, matches, points) : [];
  const scorers = live ? topScorers(playerIds, matches) : [];
  const scorersShown = scorersLimit ? scorers.slice(0, scorersLimit) : scorers;

  return (
    <div className="standings__grid">
      <div className="panel" data-reveal>
        <div className="panel__head">
          <h3>League table</h3>
          {live ? <span className="chip chip--live">Live</span> : <span className="chip">Coming soon</span>}
        </div>
        {live ? (
          <LeagueTable rows={table} qualifiers={qualifiers} playerNames={playerNames} playerCrests={playerCrests} />
        ) : (
          <CompetitionComingSoon label="The table goes live once the first results are in." />
        )}
        <p className="panel__foot">
          Top {qualifiers} make the quarter-finals. Everyone else goes home and reflects.
          {showFootLink ? (
            <>
              {' '}
              <a href="/table">See the full table</a>
            </>
          ) : null}
        </p>
      </div>

      <div className="panel" data-reveal>
        <div className="panel__head">
          <h3>Golden Boot race</h3>
          {live ? <span className="chip chip--live">Live</span> : <span className="chip">Coming soon</span>}
        </div>
        {live ? (
          <TopScorers scorers={scorersShown} playerNames={playerNames} playerCrests={playerCrests} />
        ) : (
          <CompetitionComingSoon label="No goals yet. The strikers are warming up." />
        )}
      </div>
    </div>
  );
}
