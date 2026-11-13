import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchMatchDetail } from '@/lib/season-competition';
import { isCountedMatch } from '@/lib/matchday-status';
import { MATCH_STAT_ROWS } from '@/lib/match-stat-fields';
import { TeamCrest } from '@/components/team-crest';
import { matchStatusChip } from '@/components/match-card';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await fetchMatchDetail(id);
  if (!match) return { title: 'Match · TOURNAX Season 3' };
  return { title: `${match.home.teamName ?? match.home.playerName} vs ${match.away.teamName ?? match.away.playerName} · TOURNAX Season 3` };
}

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await fetchMatchDetail(id);
  if (!match) notFound();

  const played = isCountedMatch({ status: match.status, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
  const hasScore = match.homeGoals != null && match.awayGoals != null;
  const chip = matchStatusChip(match.status);
  const statRows = MATCH_STAT_ROWS.filter(
    (row) => match.stats && (match.stats[row.key] != null || match.stats[row.awayKey] != null),
  );

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      <div className="container" style={{ maxWidth: '44rem' }}>
        <div className="panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
            <p className="matchday__eyebrow" style={{ margin: 0 }}>
              Matchday {match.matchday}
            </p>
            <span className={`pill ${chip.className}`}>{chip.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', textAlign: 'center' }}>
              <TeamCrest
                teamName={match.home.teamName}
                crestUrl={match.home.crestUrl}
                primaryColor={match.home.primaryColor}
                secondaryColor={match.home.secondaryColor}
                size={88}
              />
              <strong>{match.home.teamName ?? 'Team pending'}</strong>
              <span className="player__tag">{match.home.playerName}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              {hasScore ? (
                <span className="match-card__score" style={{ fontSize: '2.5rem', opacity: played ? 1 : 0.7 }}>
                  {match.homeGoals}&ndash;{match.awayGoals}
                </span>
              ) : (
                <span className="match-card__vs">VS</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', textAlign: 'center' }}>
              <TeamCrest
                teamName={match.away.teamName}
                crestUrl={match.away.crestUrl}
                primaryColor={match.away.primaryColor}
                secondaryColor={match.away.secondaryColor}
                size={88}
              />
              <strong>{match.away.teamName ?? 'Team pending'}</strong>
              <span className="player__tag">{match.away.playerName}</span>
            </div>
          </div>
        </div>

        {statRows.length ? (
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel__head">
              <h3>Match stats</h3>
            </div>
            <div style={{ padding: '0 1.75rem 1.5rem' }}>
              {statRows.map((row) => (
                <div
                  key={row.label}
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', padding: '.5rem 0', borderTop: '1px solid var(--line)' }}
                >
                  <span style={{ textAlign: 'right' }}>{match.stats?.[row.key] ?? '—'}</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '.85rem' }}>{row.label}</span>
                  <span>{match.stats?.[row.awayKey] ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
