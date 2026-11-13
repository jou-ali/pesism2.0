import type { StandingRow } from '@tournax/core';
import { TeamCrest } from './team-crest';

export type PlayerCrestInfo = {
  teamName: string | null;
  crestUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export function LeagueTable({
  rows,
  qualifiers,
  playerNames,
  playerCrests,
}: {
  rows: StandingRow[];
  qualifiers: number;
  playerNames: Record<string, string>;
  playerCrests?: Record<string, PlayerCrestInfo>;
}) {
  return (
    <div className="table-wrap">
      <table className="ltable">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            <th scope="col">P</th>
            <th scope="col">W</th>
            <th scope="col">D</th>
            <th scope="col">L</th>
            <th scope="col">GF</th>
            <th scope="col">GA</th>
            <th scope="col">GD</th>
            <th scope="col">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const crest = playerCrests?.[row.playerId];
            return (
              <tr className={i < qualifiers ? 'is-q' : ''} key={row.playerId}>
                <td>{i + 1}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
                    {crest ? (
                      <TeamCrest
                        teamName={crest.teamName}
                        crestUrl={crest.crestUrl}
                        primaryColor={crest.primaryColor}
                        secondaryColor={crest.secondaryColor}
                        size={20}
                      />
                    ) : null}
                    {playerNames[row.playerId] ?? row.playerId}
                  </span>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff < 0 ? `−${Math.abs(row.goalDiff)}` : '0'}</td>
                <td>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
