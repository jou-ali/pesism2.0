import type { StandingRow } from '@tournax/core';
import type { Movement } from '@/lib/matchday-status';
import { TeamCrest } from './team-crest';

export type PlayerCrestInfo = {
  teamName: string | null;
  crestUrl: string | null;
};

function MovementIcon({ movement }: { movement: Movement | undefined }) {
  if (movement === 'up') {
    return (
      <svg width="16" height="14" viewBox="0 0 18 16" aria-label="Up">
        <path d="M9 1 17 15H1z" fill="var(--green)" />
      </svg>
    );
  }
  if (movement === 'down') {
    return (
      <svg width="16" height="14" viewBox="0 0 18 16" aria-label="Down">
        <path d="M9 15 1 1h16z" fill="var(--disputed)" />
      </svg>
    );
  }
  if (movement === 'same') {
    return (
      <svg width="16" height="14" viewBox="0 0 18 16" aria-label="No change">
        <rect x="3" y="6.5" width="12" height="3" rx="1.5" fill="var(--muted-2)" />
      </svg>
    );
  }
  return null;
}

export function LeagueTable({
  rows,
  qualifiers,
  playerNames,
  playerCrests,
  movement,
  showGoals = true,
}: {
  rows: StandingRow[];
  qualifiers: number;
  playerNames: Record<string, string>;
  playerCrests?: Record<string, PlayerCrestInfo>;
  movement?: Record<string, Movement> | null;
  /** Goals for/against columns — the public site shows them; the admin table skips them to keep the card narrow. */
  showGoals?: boolean;
}) {
  const showDivider = rows.length > qualifiers;

  return (
    <div className={`ltable${showGoals ? '' : ' ltable--no-goals'}`}>
      <div className="ltable-header">
        <span>#</span>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span>Team</span>
        <span className="ltable-head-center">P</span>
        <span className="ltable-head-center ltable-head--w">W</span>
        <span className="ltable-head-center ltable-head--d">D</span>
        <span className="ltable-head-center ltable-head--l">L</span>
        {showGoals ? <span className="ltable-head-center ltable-head--gf">GF</span> : null}
        {showGoals ? <span className="ltable-head-center ltable-head--ga">GA</span> : null}
        <span className="ltable-head-center">GD</span>
        <span>Pts</span>
      </div>

      {rows.map((row, i) => {
        const pos = i + 1;
        const qualifies = pos <= qualifiers;
        const leader = pos === 1;
        const crest = playerCrests?.[row.playerId];
        const teamName = crest?.teamName ?? null;

        return (
          <div key={row.playerId}>
            {showDivider && pos === qualifiers + 1 ? (
              <div className="ltable-divider">
                <span className="ltable-divider__line" aria-hidden="true" />
                <span className="ltable-divider__label">Quarter-final line</span>
                <span className="ltable-divider__line" aria-hidden="true" />
              </div>
            ) : null}
            <div className={`ltable-row${leader ? ' ltable-row--leader' : ''}${!qualifies ? ' ltable-row--below' : ''}`}>
              <span className={`ltable-pos ${qualifies ? 'ltable-pos--q' : 'ltable-pos--nq'}`}>
                {String(pos).padStart(2, '0')}
              </span>
              <span className="ltable-move">
                <MovementIcon movement={movement?.[row.playerId]} />
              </span>
              <TeamCrest teamName={teamName} crestUrl={crest?.crestUrl} size={40} className="ltable-crest" />
              <span className="ltable-team">
                <span className="ltable-team__name">{teamName ?? playerNames[row.playerId] ?? row.playerId}</span>
                {teamName ? <span className="ltable-team__player">{playerNames[row.playerId] ?? row.playerId}</span> : null}
              </span>
              <span className="ltable-stat">{row.played}</span>
              <span className="ltable-stat ltable-stat--w">{row.won}</span>
              <span className="ltable-stat ltable-stat--d">{row.drawn}</span>
              <span className="ltable-stat ltable-stat--l">{row.lost}</span>
              {showGoals ? <span className="ltable-stat ltable-stat--gf">{row.goalsFor}</span> : null}
              {showGoals ? <span className="ltable-stat ltable-stat--ga">{row.goalsAgainst}</span> : null}
              <span className="ltable-stat">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff < 0 ? `−${Math.abs(row.goalDiff)}` : '0'}
              </span>
              <span className={`ltable-pts${leader ? ' ltable-pts--leader' : ''}`}>{row.points}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
