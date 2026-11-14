import { createHash } from 'node:crypto';
import {
  computeStandings,
  topScorers,
  positionsAfterMatchday,
  cleanSheetCount,
  longestCleanSheetRun,
  blanksCount,
  biggestHaul,
  type Match,
  type PlayerId,
} from '@tournax/core';
import { fetchSeasonCompetition, type SeasonPlayer, type KnockoutMatch } from '@/lib/season-competition';
import { isCountedMatch } from '@/lib/matchday-status';
import { initialsFor } from '@/lib/crest';
import { formatMatchdayDeadline } from '@/lib/format-deadline';
import type { Badge, ChaserRow, Fixture, Side, TableRowData, Tie } from './types';
import * as sample from './sample-data';

function isUsableImage(url: string | null | undefined): url is string {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
}

function badgeFor(p: SeasonPlayer): Badge {
  const teamName = p.teamName ?? 'Team pending';
  return {
    teamName,
    crestUrl: isUsableImage(p.crestUrl) ? p.crestUrl : null,
  };
}

function sideFor(p: SeasonPlayer): Side {
  return { ...badgeFor(p), playerName: p.name, photoUrl: isUsableImage(p.avatarUrl) ? p.avatarUrl : null };
}

export function posterVersion(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
}

function formatDeadline(iso: string | null): string {
  if (!iso) return '';
  return `Deadline: ${formatMatchdayDeadline(iso)}`;
}

/** Standard single-elimination seeding: seed i plays seed (n+1-i) in the first round. */
function firstRoundPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 1; i <= n / 2; i++) pairs.push([i, n + 1 - i]);
  return pairs;
}

function bracketSlotForSeed(seed: number, qualifiers: number): number {
  const pairs = firstRoundPairs(qualifiers);
  const idx = pairs.findIndex(([a, b]) => a === seed || b === seed);
  return idx + 1;
}

async function loadCompetition() {
  return fetchSeasonCompetition();
}

function playerMap(players: SeasonPlayer[]): Map<PlayerId, SeasonPlayer> {
  return new Map(players.map((p) => [p.id, p]));
}

function leaguePositions(playerIds: PlayerId[], matches: Match[], points: { win: number; draw: number; loss: number }) {
  const table = computeStandings(playerIds, matches, points);
  const out = new Map<PlayerId, number>();
  table.forEach((row, i) => out.set(row.playerId, i + 1));
  return out;
}

// ---------------------------------------------------------------------------
// Matchday preview
// ---------------------------------------------------------------------------

export type MatchdayPreviewData = { matchday: number; deadline: string; fixtures: Fixture[]; bye: Side | null };

export async function getMatchdayPreviewData(matchday: number, useSample: boolean): Promise<MatchdayPreviewData | null> {
  if (useSample) {
    // Cycle the three real densities: 5 fixtures/no bye, 7 fixtures/no bye (14 players, even),
    // 6 fixtures + bye (13 players, odd) — matchday % 3 picks between them.
    const cycle = matchday % 3;
    if (cycle === 1) {
      return {
        matchday,
        deadline: 'Deadline: Sun, 23 Nov · 11:59 PM IST',
        fixtures: sample.sampleFixtures7,
        bye: null,
      };
    }
    if (cycle === 2) {
      return {
        matchday,
        deadline: 'Deadline: Sun, 23 Nov · 11:59 PM IST',
        fixtures: sample.sampleFixtures6,
        bye: sample.sampleBye,
      };
    }
    return {
      matchday,
      deadline: 'Deadline: Sun, 23 Nov · 11:59 PM IST',
      fixtures: sample.sampleFixtures5,
      bye: null,
    };
  }
  const comp = await loadCompetition();
  if (!comp) return null;
  if (comp.currentMatchday !== matchday) return null;

  const players = playerMap(comp.players);
  const mdMatches = comp.matches.filter((m) => m.matchday === matchday);
  if (!mdMatches.length) return null;

  const fixtures: Fixture[] = [];
  const playing = new Set<PlayerId>();
  for (const m of mdMatches) {
    const home = players.get(m.homeId);
    const away = players.get(m.awayId);
    if (!home || !away) continue;
    fixtures.push({ home: sideFor(home), away: sideFor(away) });
    playing.add(m.homeId);
    playing.add(m.awayId);
  }

  let bye: Side | null = null;
  if (comp.players.length % 2 === 1) {
    const byePlayer = comp.players.find((p) => !playing.has(p.id));
    bye = byePlayer ? sideFor(byePlayer) : null;
  }

  return { matchday, deadline: formatDeadline(comp.currentMatchdayDeadlineAt), fixtures, bye };
}

// ---------------------------------------------------------------------------
// Table after matchday
// ---------------------------------------------------------------------------

export type MatchdayTableData = { matchday: number; rows: TableRowData[] };

export async function getMatchdayTableData(matchday: number, useSample: boolean): Promise<MatchdayTableData | null> {
  if (useSample) {
    const rows = matchday >= 4 ? sample.sampleTableRows14 : sample.sampleTableRows10;
    return { matchday, rows };
  }
  const comp = await loadCompetition();
  if (!comp) return null;

  const mdMatches = comp.matches.filter((m) => m.matchday === matchday);
  if (!mdMatches.length || !mdMatches.every(isCountedMatch)) return null;

  const playerIds = comp.players.map((p) => p.id);
  const upTo = comp.matches.filter((m) => m.matchday <= matchday);
  const table = computeStandings(playerIds, upTo, comp.points);

  const afterPrev = matchday > 1 ? positionsAfterMatchday(playerIds, comp.matches, comp.points, matchday - 1) : null;
  const afterNow = positionsAfterMatchday(playerIds, comp.matches, comp.points, matchday);

  const players = playerMap(comp.players);
  const rows: TableRowData[] = table.map((row, i) => {
    const pos = i + 1;
    const player = players.get(row.playerId);
    const movement = afterPrev
      ? (() => {
          const before = afterPrev[row.playerId];
          const now = afterNow[row.playerId];
          if (before == null || now == null) return null;
          return now < before ? 'up' : now > before ? 'down' : 'same';
        })()
      : null;
    return {
      ...(player ? badgeFor(player) : { teamName: 'Team pending' }),
      pos,
      player: player?.name ?? '—',
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalDiff: row.goalDiff,
      points: row.points,
      movement,
      qualifies: pos <= comp.knockoutQualifiers,
      isLeader: pos === 1,
      cutBefore: pos === comp.knockoutQualifiers + 1 && comp.players.length > comp.knockoutQualifiers,
    };
  });

  return { matchday, rows };
}

// ---------------------------------------------------------------------------
// Knockout previews (QF / SF / Final)
// ---------------------------------------------------------------------------

export type KnockoutPreviewData = { ties: Tie[]; deadline: string };

async function knockoutContext() {
  const comp = await loadCompetition();
  if (!comp) return null;
  const playerIds = comp.players.map((p) => p.id);
  const positions = leaguePositions(playerIds, comp.matches, comp.points);
  const players = playerMap(comp.players);
  return { comp, positions, players };
}

function tieFromMatch(m: KnockoutMatch, players: Map<PlayerId, SeasonPlayer>): Tie | null {
  const home = players.get(m.homeId);
  const away = players.get(m.awayId);
  if (!home || !away) return null;
  return { label: '', home: sideFor(home), away: sideFor(away) };
}

export async function getQuarterFinalsData(useSample: boolean): Promise<KnockoutPreviewData | null> {
  if (useSample) return { ties: sample.sampleQfTies, deadline: 'Win or go home · Deadline: Sun, 18 Jan · 11:59 PM IST' };
  const ctx = await knockoutContext();
  if (!ctx) return null;
  const { comp, positions, players } = ctx;
  const qfMatches = comp.knockoutMatches.filter(
    (m) => m.stage === 'quarter_final' && players.has(m.homeId) && players.has(m.awayId),
  );
  if (qfMatches.length < comp.knockoutQualifiers / 2) return null;

  const withSlot = qfMatches
    .map((m) => {
      const tie = tieFromMatch(m, players)!;
      const posHome = positions.get(m.homeId) ?? 999;
      const posAway = positions.get(m.awayId) ?? 999;
      const slot = bracketSlotForSeed(Math.min(posHome, posAway), comp.knockoutQualifiers);
      return { slot, tie: { ...tie, label: `QF${slot}` } };
    })
    .sort((a, b) => a.slot - b.slot);

  return { ties: withSlot.map((x) => x.tie), deadline: 'Win or go home · Deadline: Sun, 18 Jan · 11:59 PM IST' };
}

export async function getSemiFinalsData(useSample: boolean): Promise<KnockoutPreviewData | null> {
  if (useSample) return { ties: sample.sampleSfTies, deadline: 'Four left. Two make the final · Deadline: Sun, 25 Jan · 11:59 PM IST' };
  const ctx = await knockoutContext();
  if (!ctx) return null;
  const { comp, positions, players } = ctx;
  const sfMatches = comp.knockoutMatches.filter(
    (m) => m.stage === 'semi_final' && players.has(m.homeId) && players.has(m.awayId),
  );
  if (sfMatches.length < 2) return null;

  const withSlot = sfMatches
    .map((m) => {
      const tie = tieFromMatch(m, players)!;
      const posHome = positions.get(m.homeId) ?? 999;
      const posAway = positions.get(m.awayId) ?? 999;
      const qfA = bracketSlotForSeed(posHome, comp.knockoutQualifiers);
      const qfB = bracketSlotForSeed(posAway, comp.knockoutQualifiers);
      const lo = Math.min(qfA, qfB);
      const hi = Math.max(qfA, qfB);
      return { slot: lo, qfLo: lo, qfHi: hi, tie };
    })
    .sort((a, b) => a.slot - b.slot)
    .map((x, i) => ({ ...x, tie: { ...x.tie, label: `SF${i + 1} · WINNER QF${x.qfLo} v WINNER QF${x.qfHi}` } }));

  return { ties: withSlot.map((x) => x.tie), deadline: 'Four left. Two make the final · Deadline: Sun, 25 Jan · 11:59 PM IST' };
}

export type FinalPreviewData = { home: Side; away: Side; dateLine: string };

export async function getFinalPreviewData(useSample: boolean): Promise<FinalPreviewData | null> {
  if (useSample) return { ...sample.sampleFinal, dateLine: 'One match. One crown · Sun, 1 Feb · 9:00 PM IST' };
  const comp = await loadCompetition();
  if (!comp) return null;
  const final = comp.knockoutMatches.find((m) => m.stage === 'grand_final');
  if (!final) return null;
  const players = playerMap(comp.players);
  const home = players.get(final.homeId);
  const away = players.get(final.awayId);
  if (!home || !away) return null;
  return { home: sideFor(home), away: sideFor(away), dateLine: 'One match. One crown · Sun, 1 Feb · 9:00 PM IST' };
}

// ---------------------------------------------------------------------------
// Knockout bracket
// ---------------------------------------------------------------------------

export type BracketBoxRow = Side & { score: string; won: boolean | null; pens?: string };
export type BracketBox = { rows: BracketBoxRow[] };
export type BracketData = {
  qfGroups: Array<{ boxes: BracketBox[] }>;
  sf: BracketBox[];
  finalDate: string | null;
};

export async function getBracketData(useSample: boolean): Promise<BracketData | null> {
  if (useSample) {
    return sample.sampleBracket as unknown as BracketData;
  }
  const comp = await loadCompetition();
  if (!comp) return null;
  const qfMatches = comp.knockoutMatches.filter((m) => m.stage === 'quarter_final');
  const qfDone = qfMatches.length >= comp.knockoutQualifiers / 2 && qfMatches.every(isCountedMatch);
  if (!qfDone) return null;

  const players = playerMap(comp.players);
  const positions = leaguePositions(comp.players.map((p) => p.id), comp.matches, comp.points);

  const slotted = qfMatches
    .map((m) => {
      const posHome = positions.get(m.homeId) ?? 999;
      const posAway = positions.get(m.awayId) ?? 999;
      const slot = bracketSlotForSeed(Math.min(posHome, posAway), comp.knockoutQualifiers);
      return { slot, m };
    })
    .sort((a, b) => a.slot - b.slot);

  const qfBoxes: BracketBox[] = slotted.map(({ m }) => {
    const home = players.get(m.homeId);
    const away = players.get(m.awayId);
    if (!home || !away) return { rows: [] };
    const homeWon = (m.homeGoals ?? 0) > (m.awayGoals ?? 0);
    return {
      rows: [
        { ...sideFor(home), score: String(m.homeGoals ?? ''), won: homeWon },
        { ...sideFor(away), score: String(m.awayGoals ?? ''), won: !homeWon },
      ],
    };
  });
  // Pair QF boxes into their two bracket groups (QF1+QF2, QF3+QF4) for the connector layout.
  const qfGroups = [{ boxes: qfBoxes.slice(0, 2) }, { boxes: qfBoxes.slice(2, 4) }];

  const sfMatches = comp.knockoutMatches.filter((m) => m.stage === 'semi_final');
  const sf: BracketBox[] = sfMatches.slice(0, 2).map((m) => {
    const home = players.get(m.homeId);
    const away = players.get(m.awayId);
    if (!home || !away) return { rows: [] };
    const played = isCountedMatch(m);
    return {
      rows: [
        { ...sideFor(home), score: played ? String(m.homeGoals) : '–', won: played ? (m.homeGoals ?? 0) > (m.awayGoals ?? 0) : null },
        { ...sideFor(away), score: played ? String(m.awayGoals) : '–', won: played ? (m.awayGoals ?? 0) > (m.homeGoals ?? 0) : null },
      ],
    };
  });
  while (sf.length < 2) sf.push({ rows: [] });

  const final = comp.knockoutMatches.find((m) => m.stage === 'grand_final');
  const finalDate = final ? 'Sun, 1 Feb' : null;

  return { qfGroups, sf, finalDate };
}

// ---------------------------------------------------------------------------
// Awards — all gated on the grand final being counted
// ---------------------------------------------------------------------------

async function seasonOverContext() {
  const comp = await loadCompetition();
  if (!comp) return null;
  const final = comp.knockoutMatches.find((m) => m.stage === 'grand_final');
  if (!final || !isCountedMatch(final)) return null;
  const players = playerMap(comp.players);
  const allMatches = [...comp.matches, ...comp.knockoutMatches];
  return { comp, final, players, allMatches };
}

export type ChampionData = {
  winner: Side;
  scoreLine: string;
  record: { won: number; drawn: number; lost: number };
  goalsScored: number;
};

export async function getChampionData(useSample: boolean, forceDraw = false): Promise<ChampionData | null> {
  if (useSample) {
    return forceDraw
      ? { ...sample.sampleChampion, scoreLine: 'Drew 2–2 (won on the night)' }
      : (sample.sampleChampion as ChampionData);
  }
  const ctx = await seasonOverContext();
  if (!ctx) return null;
  const { final, players, allMatches } = ctx;

  // Goals alone can't break a draw (no shootout field in the data model) — fall back to the
  // home side so the function stays total; the copy itself still reads correctly as a draw.
  const homeWon = (final.homeGoals ?? 0) >= (final.awayGoals ?? 0);
  const winnerId = homeWon ? final.homeId : final.awayId;
  const loserId = homeWon ? final.awayId : final.homeId;
  const winner = players.get(winnerId);
  const loser = players.get(loserId);
  if (!winner || !loser) return null;

  const isDraw = final.homeGoals === final.awayGoals;
  const winnerGoals = homeWon ? final.homeGoals : final.awayGoals;
  const loserGoals = homeWon ? final.awayGoals : final.homeGoals;
  const scoreLine = isDraw ? `Drew ${winnerGoals}–${loserGoals}` : `Beat ${loser.teamName ?? loser.name} ${winnerGoals}–${loserGoals}`;

  const standing = computeStandings([winnerId], allMatches, ctx.comp.points)[0];

  return {
    winner: sideFor(winner),
    scoreLine,
    record: { won: standing?.won ?? 0, drawn: standing?.drawn ?? 0, lost: standing?.lost ?? 0 },
    goalsScored: standing?.goalsFor ?? 0,
  };
}

export type LeagueShieldData = {
  leader: Side;
  points: number;
  clearOfSecond: number;
  pointsPerMatch: number;
  record: { won: number; drawn: number; lost: number };
  goalDiff: number;
  goalsScored: number;
  goalsConceded: number;
  totalMatchdays: number;
  chasers: ChaserRow[];
};

export async function getLeagueShieldData(useSample: boolean): Promise<LeagueShieldData | null> {
  if (useSample) return sample.sampleLeagueShield;
  const ctx = await seasonOverContext();
  if (!ctx) return null;
  const { comp, players } = ctx;
  const table = computeStandings(comp.players.map((p) => p.id), comp.matches, comp.points);
  const leaderRow = table[0];
  const leader = players.get(leaderRow.playerId);
  if (!leader) return null;

  const chasers: ChaserRow[] = table.slice(1, 5).map((row, i) => {
    const p = players.get(row.playerId);
    return { ...(p ? badgeFor(p) : sample.sampleLeagueShield.chasers[0]), pos: i + 2, player: p?.name ?? '—', value: String(row.points) };
  });

  const played = leaderRow.won + leaderRow.drawn + leaderRow.lost;

  return {
    leader: sideFor(leader),
    points: leaderRow.points,
    clearOfSecond: leaderRow.points - (table[1]?.points ?? 0),
    pointsPerMatch: played ? Number((leaderRow.points / played).toFixed(2)) : 0,
    record: { won: leaderRow.won, drawn: leaderRow.drawn, lost: leaderRow.lost },
    goalDiff: leaderRow.goalDiff,
    goalsScored: leaderRow.goalsFor,
    goalsConceded: leaderRow.goalsAgainst,
    totalMatchdays: comp.totalMatchdays,
    chasers,
  };
}

export type GoldenBootData = {
  leader: Side;
  goals: number;
  clearOfSecond: number;
  goalsPerMatch: number;
  matches: number;
  goalDiff: number;
  biggestHaul: { goals: number; opponentShort: string } | null;
  blanks: number;
  chasers: ChaserRow[];
};

export async function getGoldenBootData(useSample: boolean): Promise<GoldenBootData | null> {
  if (useSample) return sample.sampleGoldenBoot;
  const ctx = await seasonOverContext();
  if (!ctx) return null;
  const { comp, players } = ctx;
  const playerIds = comp.players.map((p) => p.id);
  const scorers = topScorers(playerIds, comp.matches);
  const leaderEntry = scorers[0];
  const leader = players.get(leaderEntry.playerId);
  if (!leader) return null;

  const leaderRow = computeStandings([leaderEntry.playerId], comp.matches, comp.points)[0];
  const haul = biggestHaul(leaderEntry.playerId, comp.matches);
  const opponent = haul ? players.get(haul.opponentId) : null;

  const chasers: ChaserRow[] = scorers.slice(1, 5).map((s, i) => {
    const p = players.get(s.playerId);
    return { ...(p ? badgeFor(p) : sample.sampleGoldenBoot.chasers[0]), pos: i + 2, player: p?.name ?? '—', value: String(s.goals) };
  });

  return {
    leader: sideFor(leader),
    goals: leaderEntry.goals,
    clearOfSecond: leaderEntry.goals - (scorers[1]?.goals ?? 0),
    goalsPerMatch: leaderRow.played ? Number((leaderEntry.goals / leaderRow.played).toFixed(2)) : 0,
    matches: leaderRow.played,
    goalDiff: leaderRow.goalDiff,
    biggestHaul: haul && opponent ? { goals: haul.goals, opponentShort: initialsFor(opponent.teamName ?? opponent.name) } : null,
    blanks: blanksCount(leaderEntry.playerId, comp.matches),
    chasers,
  };
}

export type GoldenGloveData = {
  leader: Side;
  conceded: number;
  matches: number;
  wins: number;
  fewerThanSecond: number;
  concededPerMatch: number;
  cleanSheets: number;
  longestRun: number;
  chasers: ChaserRow[];
};

export async function getGoldenGloveData(useSample: boolean): Promise<GoldenGloveData | null> {
  if (useSample) return sample.sampleGoldenGlove;
  const ctx = await seasonOverContext();
  if (!ctx) return null;
  const { comp, players } = ctx;
  const playerIds = comp.players.map((p) => p.id);
  const table = computeStandings(playerIds, comp.matches, comp.points);
  const maxPlayed = Math.max(0, ...table.map((r) => r.played));
  const eligible = table.filter((r) => r.played >= maxPlayed && r.played > 0);
  if (!eligible.length) return null;

  eligible.sort((a, b) => {
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
    const csA = cleanSheetCount(a.playerId, comp.matches);
    const csB = cleanSheetCount(b.playerId, comp.matches);
    if (csA !== csB) return csB - csA;
    return b.goalDiff - a.goalDiff;
  });

  const winnerRow = eligible[0];
  const leader = players.get(winnerRow.playerId);
  if (!leader) return null;

  const ranked = [...table].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
  const second = ranked.find((r) => r.playerId !== winnerRow.playerId);

  const chasers: ChaserRow[] = ranked
    .filter((r) => r.playerId !== winnerRow.playerId)
    .slice(0, 4)
    .map((row, i) => {
      const p = players.get(row.playerId);
      return { ...(p ? badgeFor(p) : sample.sampleGoldenGlove.chasers[0]), pos: i + 2, player: p?.name ?? '—', value: String(row.goalsAgainst) };
    });

  return {
    leader: sideFor(leader),
    conceded: winnerRow.goalsAgainst,
    matches: winnerRow.played,
    wins: winnerRow.won,
    fewerThanSecond: (second?.goalsAgainst ?? winnerRow.goalsAgainst) - winnerRow.goalsAgainst,
    concededPerMatch: winnerRow.played ? Number((winnerRow.goalsAgainst / winnerRow.played).toFixed(2)) : 0,
    cleanSheets: cleanSheetCount(winnerRow.playerId, comp.matches),
    longestRun: longestCleanSheetRun(winnerRow.playerId, comp.matches),
    chasers,
  };
}
