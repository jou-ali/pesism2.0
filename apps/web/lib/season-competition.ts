import type { Match, MatchStatus } from '@tournax/core';
import type { TournamentStatusValue } from '@/lib/tournax-api';

const API_BASE = process.env.TOURNAX_API_URL ?? 'http://localhost:8080';
const CURRENT_SEASON = 3;

const COUNTS_IN_TABLE = new Set<MatchStatus>(['confirmed', 'resolved', 'forfeit']);

export type SeasonPlayer = {
  id: string;
  name: string;
  gamingUsername: string;
  city: string | null;
  avatarUrl: string | null;
};

export type SeasonCompetition = {
  season: number;
  knockoutQualifiers: number;
  points: { win: number; draw: number; loss: number };
  status: TournamentStatusValue;
  currentMatchday: number | null;
  totalMatchdays: number;
  players: SeasonPlayer[];
  matches: Match[];
  playerNames: Record<string, string>;
  hasResults: boolean;
};

type ApiCompetition = {
  season: number;
  knockoutQualifiers: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  status: TournamentStatusValue;
  currentMatchday: number | null;
  totalMatchdays: number;
  players: Array<{
    id: string;
    name: string;
    gamingUsername: string;
    city?: string | null;
    avatarUrl?: string | null;
  }>;
  matches: Array<{
    id: string;
    matchday: number;
    homeId: string;
    awayId: string;
    homeGoals: number | null;
    awayGoals: number | null;
    status: MatchStatus;
  }>;
};

export async function fetchSeasonCompetition(season = CURRENT_SEASON): Promise<SeasonCompetition | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/seasons/${season}/competition`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ApiCompetition;
    const matches: Match[] = data.matches.map((m) => ({
      id: m.id,
      matchday: m.matchday,
      homeId: m.homeId,
      awayId: m.awayId,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      status: m.status,
    }));
    const playerNames: Record<string, string> = {};
    for (const p of data.players) {
      playerNames[p.id] = p.name;
    }
    const hasResults = matches.some(
      (m) => COUNTS_IN_TABLE.has(m.status) && m.homeGoals !== null && m.awayGoals !== null,
    );
    return {
      season: data.season,
      knockoutQualifiers: data.knockoutQualifiers,
      points: { win: data.pointsWin, draw: data.pointsDraw, loss: data.pointsLoss },
      status: data.status,
      currentMatchday: data.currentMatchday ?? null,
      totalMatchdays: data.totalMatchdays,
      players: data.players.map((p) => ({
        id: p.id,
        name: p.name,
        gamingUsername: p.gamingUsername,
        city: p.city ?? null,
        avatarUrl: p.avatarUrl ?? null,
      })),
      matches,
      playerNames,
      hasResults,
    };
  } catch {
    return null;
  }
}
