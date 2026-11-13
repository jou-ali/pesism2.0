import type { SeasonCompetition, SeasonPlayer } from '@/lib/season-competition';
import { isCountedMatch, matchdayChipsByNumber } from '@/lib/matchday-status';
import { CompetitionComingSoon } from './competition-coming-soon';
import { TeamCrest } from './team-crest';

export function groupByMatchday(competition: SeasonCompetition) {
  const days = new Map<number, SeasonCompetition['matches']>();
  for (const match of competition.matches) {
    const list = days.get(match.matchday) ?? [];
    list.push(match);
    days.set(match.matchday, list);
  }
  return [...days.entries()].sort((a, b) => a[0] - b[0]);
}

export function FixturesPanels({ competition }: { competition: SeasonCompetition | null }) {
  const leagueMatches = competition?.matches ?? [];
  const names = competition?.playerNames ?? {};
  const hasSchedule = leagueMatches.length > 0;

  if (!hasSchedule) {
    return (
      <div className="panel" data-reveal>
        <div className="panel__head">
          <h3>League stage</h3>
          <span className="chip">To be announced</span>
        </div>
        <CompetitionComingSoon label="Fixtures will appear here once the organiser publishes the league schedule." />
      </div>
    );
  }

  const matchdays = groupByMatchday(competition!);
  const chips = matchdayChipsByNumber(matchdays);
  const byId = new Map((competition!.players ?? []).map((p) => [p.id, p]));

  return (
    <div className="fixtures">
      {matchdays.map(([matchday, matches]) => {
        const chip = chips.get(matchday) ?? { label: 'Scheduled' as const, className: 'chip' };
        return (
          <div className="panel fixture-day" data-reveal key={matchday}>
            <div className="panel__head">
              <h3>Matchday {matchday}</h3>
              <span className={chip.className}>{chip.label}</span>
            </div>
            <ul className="fixture-list">
              {matches.map((match) => {
                const played = isCountedMatch(match);
                return (
                  <li className="fixture-row" key={match.id}>
                    <span className="fixture-row__side fixture-row__side--home">
                      <FixtureName playerId={match.homeId} byId={byId} names={names} />
                    </span>
                    <span className="fixture-row__score">
                      {played ? `${match.homeGoals} – ${match.awayGoals}` : 'vs'}
                    </span>
                    <span className="fixture-row__side">
                      <FixtureName playerId={match.awayId} byId={byId} names={names} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function FixtureName({
  playerId,
  byId,
  names,
}: {
  playerId: string;
  byId: Map<string, SeasonPlayer>;
  names: Record<string, string>;
}) {
  const player = byId.get(playerId);
  return (
    <a href={`/players/${playerId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
      {player ? (
        <TeamCrest
          teamName={player.teamName}
          crestUrl={player.crestUrl}
          primaryColor={player.primaryColor}
          secondaryColor={player.secondaryColor}
          size={18}
        />
      ) : null}
      {names[playerId] ?? playerId}
    </a>
  );
}
