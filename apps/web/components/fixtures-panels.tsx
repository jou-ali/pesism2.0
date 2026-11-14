import type { SeasonCompetition, SeasonPlayer } from '@/lib/season-competition';
import { matchdayChipsByNumber } from '@/lib/matchday-status';
import { CompetitionComingSoon } from './competition-coming-soon';
import { MatchCard, type MatchCardSide } from './match-card';

export function groupByMatchday(competition: SeasonCompetition) {
  const days = new Map<number, SeasonCompetition['matches']>();
  for (const match of competition.matches) {
    const list = days.get(match.matchday) ?? [];
    list.push(match);
    days.set(match.matchday, list);
  }
  return [...days.entries()].sort((a, b) => a[0] - b[0]);
}

function toSide(byId: Map<string, SeasonPlayer>, playerNames: Record<string, string>, playerId: string): MatchCardSide {
  const p = byId.get(playerId);
  return {
    playerId,
    playerName: p?.name ?? playerNames[playerId] ?? playerId,
    avatarUrl: p?.avatarUrl ?? null,
    teamName: p?.teamName ?? null,
    crestUrl: p?.crestUrl ?? null,
  };
}

export function FixturesPanels({ competition }: { competition: SeasonCompetition | null }) {
  const leagueMatches = competition?.matches ?? [];
  const hasSchedule = leagueMatches.length > 0;

  if (!hasSchedule) {
    return (
      <div className="panel" data-reveal>
        <div className="panel__head">
          <h3>League stage</h3>
          <span className="pill pill--muted">To be announced</span>
        </div>
        <CompetitionComingSoon label="Fixtures will appear here once the organiser publishes the league schedule." />
      </div>
    );
  }

  const matchdays = groupByMatchday(competition!);
  const chips = matchdayChipsByNumber(matchdays);
  const byId = new Map((competition!.players ?? []).map((p) => [p.id, p]));
  const playerNames = competition!.playerNames;

  return (
    <div className="fixtures">
      {matchdays.map(([matchday, matches]) => {
        const chip = chips.get(matchday) ?? { label: 'Scheduled' as const, className: 'pill pill--muted' };
        return (
          <div className="panel fixture-day" data-reveal key={matchday}>
            <div className="panel__head">
              <h3>Matchday {matchday}</h3>
              <span className={chip.className}>{chip.label}</span>
            </div>
            <div className="match-cards">
              {matches.map((match, i) => (
                <MatchCard
                  key={match.id}
                  match={{ ...match, index: i + 1, deadline: null }}
                  home={toSide(byId, playerNames, match.homeId)}
                  away={toSide(byId, playerNames, match.awayId)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
