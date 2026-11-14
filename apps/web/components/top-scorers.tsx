import type { CSSProperties } from 'react';
import { TeamCrest } from './team-crest';
import type { PlayerCrestInfo } from './league-table';

export function TopScorers({
  scorers,
  playerNames,
  playerCrests,
}: {
  scorers: Array<{ playerId: string; goals: number }>;
  playerNames: Record<string, string>;
  playerCrests?: Record<string, PlayerCrestInfo>;
}) {
  const top = Math.max(1, ...scorers.map(s => s.goals));
  return (
    <ol className="scorers" data-split>
      {scorers.map((s, i) => {
        const crest = playerCrests?.[s.playerId];
        return (
          <li className="scorer" key={s.playerId}>
            <span className="scorer__pos">{String(i + 1).padStart(2, '0')}</span>
            <span className="scorer__name" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
              {crest ? (
                <TeamCrest teamName={crest.teamName} crestUrl={crest.crestUrl} size={18} />
              ) : null}
              {playerNames[s.playerId] ?? s.playerId}
            </span>
            <span className="scorer__goals">
              {s.goals}
              <small>GLS</small>
            </span>
            <span className="scorer__bar" aria-hidden="true">
              <i style={{ '--w': (s.goals / top).toFixed(3) } as CSSProperties} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
