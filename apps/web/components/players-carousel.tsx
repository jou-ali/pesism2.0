import Image from 'next/image';
import { computeStandings } from '@tournax/core';
import { fetchSeasonCompetition } from '@/lib/season-competition';
import { avatarSvg } from '@/lib/avatar';
import { SplitHeading } from './split-heading';
import { UseIcon } from './icon';
import { TeamCrest } from './team-crest';

export async function PlayersCarousel() {
  const competition = await fetchSeasonCompetition();
  const players = competition?.players ?? [];
  const table = computeStandings(
    players.map((p) => p.id),
    competition?.matches ?? [],
    competition?.points,
  );
  const byId = new Map(players.map((p) => [p.id, p]));
  const ordered = table;

  return (
    <section className="section players" id="players" aria-labelledby="players-title">
      <div className="container">
        <div className="section__head section__head--split">
          <SplitHeading id="players-title" lines={['Meet the', 'contenders.']} />
          <p className="lead" data-reveal>
            {players.length
              ? 'Every one of them thinks they’re winning this. Only one is right.'
              : 'Player cards appear here once registrations are approved.'}
          </p>
        </div>

        {!players.length ? (
          <div className="competition-soon panel" data-reveal>
            <p className="competition-soon__eyebrow">Coming soon</p>
            <p className="competition-soon__text">No approved players yet. Register and wait for admin approval.</p>
          </div>
        ) : (
          <div className="carousel" data-reveal aria-roledescription="carousel" aria-label="Featured players">
            <div className="carousel__viewport">
              <div className="carousel__track" aria-live="off">
                {ordered.map((row, i) => {
                  const player = byId.get(row.playerId);
                  if (!player) return null;
                  const rate = row.played > 0 ? Math.round((row.won / row.played) * 100) : 0;
                  return (
                    <article
                      className="player"
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${i + 1} of ${ordered.length}`}
                      key={player.id}
                    >
                      <div className="player__media">
                        {player.avatarUrl ? (
                          <Image
                            src={player.avatarUrl}
                            alt=""
                            width={400}
                            height={500}
                            className="player__photo"
                            unoptimized
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: avatarSvg(player.name, i) }} />
                        )}
                        <span className="player__rank">
                          #<span>{i + 1}</span>
                        </span>
                        <span className="player__city">
                          <UseIcon id="i-pin" />
                          {player.city ?? 'India'}
                        </span>
                      </div>
                      <div className="player__body">
                        <div>
                          <h3 className="player__name">
                            <a href={`/players/${player.id}`}>{player.name}</a>
                          </h3>
                          <p className="player__tag">@{player.gamingUsername}</p>
                          <p className="player__tag" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--muted-foreground)' }}>
                            <TeamCrest
                              teamName={player.teamName}
                              crestUrl={player.crestUrl}
                              primaryColor={player.primaryColor}
                              secondaryColor={player.secondaryColor}
                              size={18}
                            />
                            {player.teamName ?? 'Team pending'}
                          </p>
                        </div>
                        <dl className="player__stats">
                          <div>
                            <dt>Wins</dt>
                            <dd>{row.won}</dd>
                          </div>
                          <div>
                            <dt>Played</dt>
                            <dd>{row.played}</dd>
                          </div>
                          <div>
                            <dt>Win %</dt>
                            <dd>{rate}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="carousel__controls">
              <div className="dots" role="group" aria-label="Choose slide"></div>
              <div className="arrows">
                <button className="arrow-btn arrow-btn--prev" type="button" aria-label="Previous players">
                  <UseIcon id="i-arrow-l" />
                </button>
                <button className="arrow-btn arrow-btn--next" type="button" aria-label="Next players">
                  <UseIcon id="i-arrow-r" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
