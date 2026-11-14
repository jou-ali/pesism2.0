import { computeStandings, topScorers } from '@tournax/core';
import type { SeasonCompetition } from '@/lib/season-competition';
import { CompetitionComingSoon } from './competition-coming-soon';
import { LeagueTable } from './league-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminStandingsView({ competition }: { competition: SeasonCompetition }) {
  const live = competition.hasResults;
  const playerIds = competition.players.map((p) => p.id);
  const names = competition.playerNames;
  const table = live ? computeStandings(playerIds, competition.matches, competition.points) : [];
  const scorers = live ? topScorers(playerIds, competition.matches) : [];
  const q = competition.knockoutQualifiers;
  const playerCrests = Object.fromEntries(
    competition.players.map((p) => [p.id, { teamName: p.teamName, crestUrl: p.crestUrl }]),
  );

  return (
    <div className="admin-standings-grid">
      <Card>
        <CardHeader>
          <CardTitle>League table</CardTitle>
        </CardHeader>
        <CardContent>
          {live ? (
            <div className="admin-table-wrap admin-table-wrap--standings">
              <LeagueTable rows={table} qualifiers={q} playerNames={names} playerCrests={playerCrests} showGoals={false} />
            </div>
          ) : (
            <CompetitionComingSoon label="Record a result under Results to populate the table." />
          )}
          <p className="admin-muted" style={{ padding: '0.75rem 0 0', margin: 0 }}>
            Top {q} qualify for knockouts. Tie-breakers: points, goal difference, goals scored, head to head.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top scorers</CardTitle>
        </CardHeader>
        <CardContent>
          {live ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Goals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorers.map((s, i) => (
                  <TableRow key={s.playerId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{names[s.playerId] ?? s.playerId}</TableCell>
                    <TableCell className="admin-mono">{s.goals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <CompetitionComingSoon label="Scorers appear after the first counted result." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
