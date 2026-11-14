import type { PlayerId } from './types.ts';

export interface Pairing {
  home: PlayerId;
  away: PlayerId;
}

/**
 * Round robin fixtures using the circle method.
 * Every player meets every other player once (twice with doubleRound, home and away swapped).
 * With an odd number of players one player sits out (a bye) each matchday.
 * Returns one array of pairings per matchday.
 */
export function roundRobin(players: PlayerId[], opts: { doubleRound?: boolean } = {}): Pairing[][] {
  if (new Set(players).size !== players.length) throw new Error('Duplicate player ids');
  if (players.length < 2) return [];

  const list: Array<PlayerId | null> = [...players];
  if (list.length % 2 === 1) list.push(null); // null = bye
  const n = list.length;
  const rounds: Pairing[][] = [];

  for (let r = 0; r < n - 1; r++) {
    const day: Pairing[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]!;
      const b = list[n - 1 - i]!;
      if (a === null || b === null) continue;
      // alternate home and away so nobody is always at home
      day.push(r % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
    }
    rounds.push(day);
    // keep the first entry fixed, rotate the rest clockwise
    list.splice(1, 0, list.pop()!);
  }

  if (opts.doubleRound) {
    const second = rounds.map(day => day.map(p => ({ home: p.away, away: p.home })));
    rounds.push(...second);
  }
  return rounds;
}

/**
 * A matchday may not contain the same player twice. Given the matches already scheduled for a
 * tournament and a candidate (matchday, home, away) to add or edit, returns the player id that
 * would be double-booked, or null if the pairing is safe. Pass the candidate's own match id (when
 * editing an existing match) so it doesn't conflict with itself.
 */
export function findMatchdayConflict(
  existingMatches: Array<{ id?: string; matchday: number; homeId: PlayerId; awayId: PlayerId }>,
  candidate: { id?: string; matchday: number; homeId: PlayerId; awayId: PlayerId },
): PlayerId | null {
  const booked = new Set<PlayerId>();
  for (const m of existingMatches) {
    if (m.matchday !== candidate.matchday) continue;
    if (candidate.id && m.id === candidate.id) continue;
    booked.add(m.homeId);
    booked.add(m.awayId);
  }
  if (booked.has(candidate.homeId)) return candidate.homeId;
  if (booked.has(candidate.awayId)) return candidate.awayId;
  return null;
}
