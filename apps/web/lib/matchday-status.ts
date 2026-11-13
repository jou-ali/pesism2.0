import { computeStandings, type Match, type MatchStatus, type PointsRule, type StandingRow } from '@tournax/core';

const COUNTED = new Set<MatchStatus>(['confirmed', 'resolved', 'forfeit']);

export function isCountedMatch(
  match: Pick<Match, 'status' | 'homeGoals' | 'awayGoals'>,
): boolean {
  return COUNTED.has(match.status) && match.homeGoals !== null && match.awayGoals !== null;
}

export type MatchdayChip = {
  label: 'Scheduled' | 'In progress' | 'Completed';
  className: string;
};

/**
 * First matchday that is not fully played is the active round ("In progress"),
 * even before any score is in. Earlier days "Completed"; later days "Scheduled".
 */
export function matchdayChipsByNumber(
  matchdays: Array<[number, Match[]]>,
): Map<number, MatchdayChip> {
  const sorted = [...matchdays].sort((a, b) => a[0] - b[0]);
  const currentMd =
    sorted.find(([, matches]) => matches.length > 0 && !matches.every(isCountedMatch))?.[0] ?? null;

  const out = new Map<number, MatchdayChip>();
  for (const [md, matches] of sorted) {
    if (!matches.length) {
      out.set(md, { label: 'Scheduled', className: 'pill pill--muted' });
      continue;
    }
    if (matches.every(isCountedMatch)) {
      out.set(md, { label: 'Completed', className: 'pill pill--success' });
    } else if (md === currentMd) {
      out.set(md, { label: 'In progress', className: 'pill pill--live' });
    } else {
      out.set(md, { label: 'Scheduled', className: 'pill pill--muted' });
    }
  }
  return out;
}

/** The highest matchday number with at least one counted result — null if none yet. */
export function latestPlayedMatchday(matches: Match[]): number | null {
  const played = matches.filter(isCountedMatch).map((m) => m.matchday);
  return played.length ? Math.max(...played) : null;
}

export type Movement = 'up' | 'down' | 'same';

/**
 * Per-player table movement caused by the latest completed matchday — compares standings with
 * and without that matchday's matches. Returns null if there's no prior matchday to compare
 * against (e.g. only matchday 1 has been played).
 */
export function computeMovement(
  playerIds: string[],
  matches: Match[],
  points: PointsRule | undefined,
): Record<string, Movement> | null {
  const lastMd = latestPlayedMatchday(matches);
  if (lastMd == null) return null;

  const before = matches.filter((m) => m.matchday !== lastMd);
  if (!before.some(isCountedMatch)) return null;

  const rankOf = (table: StandingRow[]) => new Map(table.map((row, i) => [row.playerId, i]));
  const afterRank = rankOf(computeStandings(playerIds, matches, points));
  const beforeRank = rankOf(computeStandings(playerIds, before, points));

  const out: Record<string, Movement> = {};
  for (const id of playerIds) {
    const a = afterRank.get(id);
    const b = beforeRank.get(id);
    if (a == null || b == null) continue;
    out[id] = a < b ? 'up' : a > b ? 'down' : 'same';
  }
  return out;
}
