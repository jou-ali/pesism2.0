import type { Match, PlayerId, PointsRule } from './types.ts';
import { computeStandings, DEFAULT_POINTS } from './standings.ts';

const COUNTS_IN_TABLE = new Set(['confirmed', 'resolved', 'forfeit']);

function countedSortedByMatchday(matches: Match[]): Match[] {
  return matches
    .filter((m) => COUNTS_IN_TABLE.has(m.status) && m.homeGoals !== null && m.awayGoals !== null)
    .sort((a, b) => a.matchday - b.matchday);
}

/**
 * Each player's table position (1-indexed) using only matches up to and including the given
 * matchday — the building block for "movement since last matchday" on any share poster that
 * needs a position-at-a-point-in-time, not just the live table.
 */
export function positionsAfterMatchday(
  players: PlayerId[],
  matches: Match[],
  points: PointsRule = DEFAULT_POINTS,
  matchday: number,
): Record<PlayerId, number> {
  const upTo = matches.filter((m) => m.matchday <= matchday);
  const table = computeStandings(players, upTo, points);
  const out: Record<PlayerId, number> = {};
  table.forEach((row, i) => {
    out[row.playerId] = i + 1;
  });
  return out;
}

/** Number of counted matches in which the player conceded zero goals. */
export function cleanSheetCount(playerId: PlayerId, matches: Match[]): number {
  let n = 0;
  for (const m of countedSortedByMatchday(matches)) {
    if (m.homeId === playerId && m.awayGoals === 0) n++;
    else if (m.awayId === playerId && m.homeGoals === 0) n++;
  }
  return n;
}

/** Longest streak of consecutive (by matchday order) counted matches with zero conceded. */
export function longestCleanSheetRun(playerId: PlayerId, matches: Match[]): number {
  let longest = 0;
  let current = 0;
  for (const m of countedSortedByMatchday(matches)) {
    let conceded: number | null = null;
    if (m.homeId === playerId) conceded = m.awayGoals;
    else if (m.awayId === playerId) conceded = m.homeGoals;
    else continue;

    if (conceded === 0) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

/** Number of counted matches in which the player scored zero goals. */
export function blanksCount(playerId: PlayerId, matches: Match[]): number {
  let n = 0;
  for (const m of countedSortedByMatchday(matches)) {
    if (m.homeId === playerId && m.homeGoals === 0) n++;
    else if (m.awayId === playerId && m.awayGoals === 0) n++;
  }
  return n;
}

/** The most goals the player scored in a single counted match, and who they scored them against. */
export function biggestHaul(
  playerId: PlayerId,
  matches: Match[],
): { goals: number; opponentId: PlayerId } | null {
  let best: { goals: number; opponentId: PlayerId } | null = null;
  for (const m of countedSortedByMatchday(matches)) {
    let goals: number | null = null;
    let opponentId: PlayerId | null = null;
    if (m.homeId === playerId) {
      goals = m.homeGoals;
      opponentId = m.awayId;
    } else if (m.awayId === playerId) {
      goals = m.awayGoals;
      opponentId = m.homeId;
    } else {
      continue;
    }
    if (goals !== null && opponentId !== null && (!best || goals > best.goals)) {
      best = { goals, opponentId };
    }
  }
  return best;
}
