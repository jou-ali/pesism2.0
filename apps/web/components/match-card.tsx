import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MatchStatus } from '@tournax/core';
import { avatarSvg } from '@/lib/avatar';
import { TeamCrest } from './team-crest';

export type MatchCardSide = {
  playerId: string;
  playerName: string;
  avatarUrl: string | null;
  teamName: string | null;
  crestUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type MatchCardMatch = {
  id: string;
  status: MatchStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  /** The match's number within its matchday (or round, for knockout stages). */
  index: number;
  /** The matchday's deadline, if one has been set — shown on unplayed matches. */
  deadline: string | null;
};

export function matchStatusChip(status: MatchStatus): { label: string; className: string } {
  switch (status) {
    case 'confirmed':
    case 'resolved':
      return { label: 'Full time', className: 'pill--success' };
    case 'forfeit':
      return { label: 'Forfeit', className: 'pill--muted' };
    case 'disputed':
      return { label: 'Disputed', className: 'pill--danger' };
    case 'pending_confirmation':
      return { label: 'Awaiting confirmation', className: 'pill--yellow' };
    case 'scheduled':
    default:
      return { label: 'To be played', className: 'pill--muted' };
  }
}

function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));
}

function footerLine(match: MatchCardMatch, home: MatchCardSide, away: MatchCardSide): string | null {
  switch (match.status) {
    case 'scheduled':
      return match.deadline ? `Play by ${formatDeadline(match.deadline)}` : null;
    case 'pending_confirmation':
      return 'Score in · waiting for confirmation';
    case 'disputed':
      return 'Admin is reviewing the screenshots';
    case 'forfeit': {
      const loser = (match.homeGoals ?? 0) > (match.awayGoals ?? 0) ? away : home;
      return `${loser.teamName ?? loser.playerName} did not play by the deadline`;
    }
    case 'confirmed':
    case 'resolved':
      return match.homeGoals === match.awayGoals ? 'Honours even' : 'Confirmed by both';
    default:
      return null;
  }
}

function hexWithAlpha(hex: string | null, alphaHex: string): string | undefined {
  if (!hex) return undefined;
  return `${hex}${alphaHex}`;
}

function Side({ side, muted }: { side: MatchCardSide; muted: boolean }) {
  return (
    <div className="match-card__side" style={{ opacity: muted ? 0.6 : 1 }}>
      <TeamCrest
        teamName={side.teamName}
        crestUrl={side.crestUrl}
        primaryColor={side.primaryColor}
        secondaryColor={side.secondaryColor}
        size={64}
        className="match-card__crest"
      />
      <p className="match-card__team">{side.teamName ?? 'Team pending'}</p>
      <div className="match-card__player">
        {side.avatarUrl ? (
          <Image src={side.avatarUrl} alt="" width={24} height={24} className="match-card__avatar" unoptimized />
        ) : (
          <span
            className="match-card__avatar"
            dangerouslySetInnerHTML={{ __html: avatarSvg(side.playerName, side.playerId.length) }}
          />
        )}
        <span className="match-card__player-name">{side.playerName}</span>
      </div>
    </div>
  );
}

export function MatchCard({
  match,
  home,
  away,
  label,
}: {
  match: MatchCardMatch;
  home: MatchCardSide;
  away: MatchCardSide;
  label?: string;
}) {
  const chip = matchStatusChip(match.status);
  const hasScore = match.homeGoals != null && match.awayGoals != null;
  const counted = hasScore && (match.status === 'confirmed' || match.status === 'resolved' || match.status === 'forfeit');
  const homeWon = counted && (match.homeGoals as number) > (match.awayGoals as number);
  const awayWon = counted && (match.awayGoals as number) > (match.homeGoals as number);
  const foot = footerLine(match, home, away);

  const tint = {
    '--home-tint': hexWithAlpha(home.primaryColor, '2e'),
    '--away-tint': hexWithAlpha(away.primaryColor, '2e'),
  } as CSSProperties;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="match-card card card--tint"
      style={tint}
      data-status={match.status}
      data-reveal
    >
      <div className="card__head">
        <span className="match-card__label">{label ?? `MATCH ${String(match.index).padStart(2, '0')}`}</span>
        <span className={`pill ${chip.className}`}>{chip.label}</span>
      </div>

      <div className="match-card__body">
        <Side side={home} muted={awayWon} />
        <div className="match-card__center">
          {hasScore ? (
            <span className="match-card__score" style={{ opacity: counted ? 1 : 0.7 }}>
              <span style={{ color: awayWon ? 'var(--muted-2)' : 'var(--color-ink)' }}>{match.homeGoals}</span>
              <span className="match-card__score-dash">&ndash;</span>
              <span style={{ color: homeWon ? 'var(--muted-2)' : 'var(--color-ink)' }}>{match.awayGoals}</span>
            </span>
          ) : (
            <span className="match-card__vs">VS</span>
          )}
        </div>
        <Side side={away} muted={homeWon} />
      </div>

      <div className="card__foot">
        <span className="match-card__foot-text">{foot}</span>
        <span className="card__foot-cta">Details &rarr;</span>
      </div>
    </Link>
  );
}
