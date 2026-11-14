import { computeStandings, topScorers } from '@tournax/core';
import type { SeasonCompetition } from '@/lib/season-competition';
import { computeMovement, latestPlayedMatchday } from '@/lib/matchday-status';
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
      { teamName: p.teamName, crestUrl: p.crestUrl },
    ]),
  );

  const table = live ? computeStandings(playerIds, matches, points) : [];
  const scorers = live ? topScorers(playerIds, matches) : [];
  const scorersShown = scorersLimit ? scorers.slice(0, scorersLimit) : scorers;
  const movement = live ? computeMovement(playerIds, matches, points) : null;
  const afterMatchday = live ? latestPlayedMatchday(matches) : null;

  return (
    <div className="standings__grid">
      <div className="card" data-reveal>
        <div className="card__head">
          <div className="card__head-title">
            <h3>League table</h3>
            {afterMatchday ? <span className="card__head-eyebrow">After matchday {afterMatchday}</span> : null}
          </div>
          {live ? <span className="pill pill--live">Live</span> : <span className="pill pill--muted">Coming soon</span>}
        </div>
        {live ? (
          <LeagueTable rows={table} qualifiers={qualifiers} playerNames={playerNames} playerCrests={playerCrests} movement={movement} />
        ) : (
          <CompetitionComingSoon label="The table goes live once the first results are in." />
        )}
        <div className="card__foot">
          <span>Top {qualifiers} make the quarter-finals</span>
          {showFootLink ? <a href="/table">See the full table &rarr;</a> : null}
        </div>
      </div>

      <div className="card" data-reveal>
        <div className="card__head">
          <h3>Golden Boot race</h3>
          {live ? <span className="pill pill--live">Live</span> : <span className="pill pill--muted">Coming soon</span>}
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
