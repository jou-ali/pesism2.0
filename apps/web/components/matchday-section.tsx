import type { CSSProperties } from 'react';
import Link from 'next/link';
import { computeStandings } from '@tournax/core';
import { fetchRegistrationWindow, registrationWindowSummary, spotsLabel } from '@/lib/registration-window';
import {
  fetchSeasonCompetition,
  type KnockoutMatch,
  type SeasonCompetition,
  type SeasonPlayer,
} from '@/lib/season-competition';
import type { TournamentStatusValue } from '@/lib/tournax-api';
import { computeMovement, isCountedMatch, latestPlayedMatchday, matchdayChipsByNumber } from '@/lib/matchday-status';
import { computeLastSeasonRecap, type LastSeasonRecap } from '@/lib/last-season';
import { groupByMatchday } from './fixtures-panels';
import { SplitHeading } from './split-heading';
import { Button } from './ui/button';
import { TeamCrest } from './team-crest';
import { MatchCard, type MatchCardSide } from './match-card';
import { LeagueTable } from './league-table';
import { ShareImageActions } from './share-image-actions';
import { getMatchdayPreviewData, posterVersion } from '@/lib/share/data';

const VALID_STATUSES = new Set(['draft', 'registration', 'league', 'knockout', 'finished']);

/** Home page section after the hero — phase-driven, straight from the tournament's own status. */
export async function MatchdaySection({ phase, md }: { phase?: string; md?: number } = {}) {
  const competition = await fetchSeasonCompetition();
  if (!competition) {
    return <LastSeason recap={null} />;
  }

  const status: TournamentStatusValue =
    phase && VALID_STATUSES.has(phase) ? (phase as TournamentStatusValue) : competition.status;

  if (status === 'registration') {
    return <RegistrationPhase competition={competition} />;
  }
  if (status === 'league') {
    return <LeaguePhase competition={competition} overrideMatchday={md} />;
  }
  if (status === 'knockout') {
    return <KnockoutPhase competition={competition} />;
  }
  if (status === 'finished') {
    return <FinishedPhase competition={competition} />;
  }

  // draft, or anything unrecognised — same fallback the site always used before phases existed.
  let recap: LastSeasonRecap | null = null;
  const previousSeason = competition.season - 1;
  const previous = previousSeason > 0 ? await fetchSeasonCompetition(previousSeason) : null;
  recap = previous ? computeLastSeasonRecap(previous) : null;
  return <LastSeason recap={recap} />;
}

function toSide(byId: Map<string, SeasonPlayer>, playerNames: Record<string, string>, playerId: string): MatchCardSide {
  const p = byId.get(playerId);
  return {
    playerId,
    playerName: p?.name ?? playerNames[playerId] ?? playerId,
    avatarUrl: p?.avatarUrl ?? null,
    teamName: p?.teamName ?? null,
    crestUrl: p?.crestUrl ?? null,
    primaryColor: p?.primaryColor ?? null,
    secondaryColor: p?.secondaryColor ?? null,
  };
}

function formatCountdown(deadlineIso: string | null): string | null {
  if (!deadlineIso) return null;
  const diff = new Date(deadlineIso).getTime() - Date.now();
  if (diff <= 0) return 'Deadline passed';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m left`;
}

async function RegistrationPhase({ competition }: { competition: SeasonCompetition }) {
  const windowData = await fetchRegistrationWindow(competition.season);
  const left = spotsLabel(windowData);
  const summary = registrationWindowSummary(windowData);

  return (
    <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
      <div className="container">
        <div className="section__head">
          <p className="matchday__eyebrow">Registration · Open</p>
          <SplitHeading id="matchday-title" lines={['Lock in your', 'spot now.']} />
          <p className="lead" data-reveal>
            {[left, summary].filter(Boolean).join(' · ') || 'Registration details are loading.'}
          </p>
        </div>

        {!competition.players.length ? (
          <div className="panel" data-reveal>
            <div className="competition-soon">
              <p className="competition-soon__text">Nobody&rsquo;s signed up yet. Be the first to talk trash.</p>
            </div>
          </div>
        ) : (
          <div className="reg-players" data-stagger>
            {competition.players.map((p) => (
              <div className="reg-player" data-reveal key={p.id}>
                <TeamCrest
                  teamName={p.teamName}
                  crestUrl={p.crestUrl}
                  primaryColor={p.primaryColor}
                  secondaryColor={p.secondaryColor}
                  size={48}
                />
                <span className="reg-player__name">{p.teamName ?? 'Team pending'}</span>
                <span className="player__tag" style={{ fontSize: '.75rem' }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="matchday__cta" data-reveal>
          <Button className="btn btn--primary" type="button" data-open-register>
            Claim your spot
          </Button>
        </div>
      </div>
    </section>
  );
}

async function LeaguePhase({ competition, overrideMatchday }: { competition: SeasonCompetition; overrideMatchday?: number }) {
  const matchdays = groupByMatchday(competition);
  const byId = new Map(competition.players.map((p) => [p.id, p]));

  if (!matchdays.length) {
    return (
      <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
        <div className="container">
          <div className="section__head">
            <p className="matchday__eyebrow">Matchday · Live</p>
            <SplitHeading id="matchday-title" lines={['No hiding', 'this week.']} />
          </div>
          <div className="panel" data-reveal>
            <div className="competition-soon">
              <p className="competition-soon__text">Fixtures aren&rsquo;t published yet.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const totalMatchdays = Math.max(competition.totalMatchdays, matchdays[matchdays.length - 1][0]);
  const defaultMd = competition.currentMatchday ?? matchdays[matchdays.length - 1][0];
  const selectedMd = overrideMatchday && matchdays.some(([n]) => n === overrideMatchday) ? overrideMatchday : defaultMd;
  const selected = matchdays.find(([n]) => n === selectedMd);
  const matches = selected ? selected[1] : [];
  const played = matches.filter(isCountedMatch).length;
  const countdown = selectedMd === competition.currentMatchday ? formatCountdown(competition.currentMatchdayDeadlineAt) : null;

  const playerIds = competition.players.map((p) => p.id);
  const table = competition.hasResults ? computeStandings(playerIds, competition.matches, competition.points) : [];
  const movement = competition.hasResults ? computeMovement(playerIds, competition.matches, competition.points) : null;
  const afterMatchday = competition.hasResults ? latestPlayedMatchday(competition.matches) : null;
  const playerCrests = Object.fromEntries(
    competition.players.map((p) => [
      p.id,
      { teamName: p.teamName, crestUrl: p.crestUrl, primaryColor: p.primaryColor, secondaryColor: p.secondaryColor },
    ]),
  );
  const chips = matchdayChipsByNumber(matchdays);

  const isCurrentMd = selectedMd === competition.currentMatchday;
  const previewData = isCurrentMd ? await getMatchdayPreviewData(selectedMd, false) : null;

  return (
    <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
      <div className="container">
        <div className="section__head">
          <p className="matchday__eyebrow">
            Matchday {selectedMd} of {totalMatchdays} · Live
          </p>
          <SplitHeading id="matchday-title" lines={['No hiding', 'this week.']} />
          <p className="lead" data-reveal>
            {played} of {matches.length} played{countdown ? ` · ${countdown}` : ''}
          </p>
          {previewData ? (
            <ShareImageActions
              imageUrl={`/api/share/matchday/${selectedMd}/preview?v=${posterVersion(previewData)}`}
              caption={`Matchday ${String(selectedMd).padStart(2, '0')} is live 🔥 Play by ${previewData.deadline.replace('Play by ', '')}`}
              filename={`matchday-${selectedMd}-preview.png`}
            />
          ) : null}
        </div>

        <nav className="matchday-tabs" aria-label="Matchdays">
          {matchdays.map(([n]) => (
            <Link key={n} href={`?md=${n}#matchday`} aria-current={n === selectedMd ? 'page' : undefined}>
              MD{n}
              {chips.get(n)?.label === 'In progress' ? ' ·' : ''}
            </Link>
          ))}
        </nav>

        {!matches.length ? (
          <div className="panel" data-reveal>
            <div className="competition-soon">
              <p className="competition-soon__text">No fixtures for this matchday yet.</p>
            </div>
          </div>
        ) : (
          <div className="match-cards" data-stagger>
            {matches.map((m, i) => (
              <MatchCard
                key={m.id}
                match={{
                  ...m,
                  index: i + 1,
                  deadline: selectedMd === competition.currentMatchday ? competition.currentMatchdayDeadlineAt : null,
                }}
                home={toSide(byId, competition.playerNames, m.homeId)}
                away={toSide(byId, competition.playerNames, m.awayId)}
              />
            ))}
          </div>
        )}

        {table.length ? (
          <div className="card" style={{ marginTop: '1.5rem' }} data-reveal>
            <div className="card__head">
              <div className="card__head-title">
                <h3>League table</h3>
                {afterMatchday ? <span className="card__head-eyebrow">After matchday {afterMatchday}</span> : null}
              </div>
              <span className="pill pill--live">Live</span>
            </div>
            <LeagueTable
              rows={table}
              qualifiers={competition.knockoutQualifiers}
              playerNames={competition.playerNames}
              playerCrests={playerCrests}
              movement={movement}
            />
            <div className="card__foot">
              <span>Top {competition.knockoutQualifiers} make the quarter-finals</span>
              <a href="/table">See the full table &rarr;</a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const STAGE_ORDER: KnockoutMatch['stage'][] = ['quarter_final', 'semi_final', 'third_place', 'grand_final'];
const STAGE_LABEL: Record<string, string> = {
  quarter_final: 'Quarter-finals',
  semi_final: 'Semi-finals',
  third_place: 'Third place',
  grand_final: 'Final',
};

function knockoutCardLabel(stage: KnockoutMatch['stage'], indexInStage: number): string {
  switch (stage) {
    case 'quarter_final':
      return `QF ${indexInStage}`;
    case 'semi_final':
      return `SF ${indexInStage}`;
    case 'third_place':
      return '3RD PLACE';
    case 'grand_final':
      return 'FINAL';
    default:
      return `MATCH ${indexInStage}`;
  }
}

function KnockoutPhase({ competition }: { competition: SeasonCompetition }) {
  const byId = new Map(competition.players.map((p) => [p.id, p]));
  const rounds = STAGE_ORDER.map((stage) => [stage, competition.knockoutMatches.filter((m) => m.stage === stage)] as const).filter(
    ([, matches]) => matches.length > 0,
  );

  return (
    <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
      <div className="container">
        <div className="section__head">
          <p className="matchday__eyebrow">Knockouts · Live</p>
          <SplitHeading id="matchday-title" lines={['Win or', 'go home.']} />
        </div>

        {!rounds.length ? (
          <div className="panel" data-reveal>
            <div className="competition-soon">
              <p className="competition-soon__text">The bracket is being drawn up.</p>
            </div>
          </div>
        ) : (
          <div className="bracket" style={{ '--bracket-cols': rounds.length } as CSSProperties} data-stagger>
            {rounds.map(([stage, matches]) => (
              <div className="bracket__round" data-reveal key={stage}>
                <h4>{STAGE_LABEL[stage] ?? stage}</h4>
                <div className="match-cards">
                  {matches.map((m, i) => (
                    <MatchCard
                      key={m.id}
                      match={{ ...m, index: i + 1, deadline: null }}
                      home={toSide(byId, competition.playerNames, m.homeId)}
                      away={toSide(byId, competition.playerNames, m.awayId)}
                      label={knockoutCardLabel(stage, i + 1)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FinishedPhase({ competition }: { competition: SeasonCompetition }) {
  const recap = computeLastSeasonRecap(competition);
  const byId = new Map(competition.players.map((p) => [p.id, p]));

  const finalMatch = competition.knockoutMatches.find((m) => m.stage === 'grand_final' && isCountedMatch(m));
  let championId: string | null = null;
  if (finalMatch) {
    const homeWon = (finalMatch.homeGoals ?? 0) >= (finalMatch.awayGoals ?? 0);
    championId = homeWon ? finalMatch.homeId : finalMatch.awayId;
  } else if (recap) {
    championId =
      Object.keys(competition.playerNames).find((id) => competition.playerNames[id] === recap.champion) ?? null;
  }
  const champion = championId ? byId.get(championId) : null;
  const championName = champion?.teamName ?? champion?.name ?? recap?.champion ?? null;

  return (
    <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
      <div className="container">
        <div className="section__head">
          <p className="matchday__eyebrow">PESISM 2.0 · Final whistle</p>
          <SplitHeading
            id="matchday-title"
            lines={championName ? [championName, 'took the crown.'] : ['The crown is', 'still unclaimed.']}
          />
        </div>

        {champion ? (
          <div className="panel" data-reveal style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 1.75rem' }}>
            <TeamCrest
              teamName={champion.teamName}
              crestUrl={champion.crestUrl}
              primaryColor={champion.primaryColor}
              secondaryColor={champion.secondaryColor}
              size={72}
            />
            <div>
              <p className="panel__foot" style={{ padding: 0 }}>
                Champion
              </p>
              <strong style={{ fontSize: '1.4rem' }}>{champion.teamName ?? champion.name}</strong>
              <p className="player__tag" style={{ margin: 0 }}>
                {champion.name}
              </p>
            </div>
          </div>
        ) : null}

        {recap ? (
          <div className="matchday__stats" data-stagger>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Golden Boot</span>
              <strong>
                {recap.topScorer.name} · {recap.topScorer.goals}
              </strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Biggest win</span>
              <strong>
                {recap.biggestWin.winner} {recap.biggestWin.winnerGoals}-{recap.biggestWin.loserGoals}{' '}
                {recap.biggestWin.loser}
              </strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Most draws (we see you)</span>
              <strong>
                {recap.mostDraws.name} · {recap.mostDraws.draws}
              </strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Season total</span>
              <strong>
                {recap.totalMatches} matches · {recap.totalGoals} goals
              </strong>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LastSeason({ recap }: { recap: LastSeasonRecap | null }) {
  return (
    <section className="section matchday" id="matchday" aria-labelledby="matchday-title">
      <div className="container">
        <div className="section__head">
          <p className="matchday__eyebrow">PESISM 2.0 · Final whistle</p>
          <SplitHeading
            id="matchday-title"
            lines={recap ? [recap.champion, 'took the crown.'] : ['The crown is', 'still unclaimed.']}
          />
          {recap ? (
            <p className="lead" data-reveal>
              {recap.totalMatches} matches. {recap.totalGoals} goals. One name on the trophy. Next season, someone
              takes it off them.
            </p>
          ) : null}
        </div>

        {recap ? (
          <div className="matchday__stats" data-stagger>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Champion</span>
              <strong>{recap.champion}</strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Top scorer</span>
              <strong>
                {recap.topScorer.name} · {recap.topScorer.goals}
              </strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Biggest win</span>
              <strong>
                {recap.biggestWin.winner} {recap.biggestWin.winnerGoals}-{recap.biggestWin.loserGoals}{' '}
                {recap.biggestWin.loser}
              </strong>
            </div>
            <div className="matchday__stat card" data-reveal>
              <span className="matchday__stat-label">Most draws (we see you)</span>
              <strong>
                {recap.mostDraws.name} · {recap.mostDraws.draws}
              </strong>
            </div>
          </div>
        ) : null}

        <div className="matchday__cta" data-reveal>
          {recap ? <p>Think you can dethrone them?</p> : null}
          <Button className="btn btn--primary" type="button" data-open-register>
            Register for PESISM 2.0
          </Button>
        </div>
      </div>
    </section>
  );
}
