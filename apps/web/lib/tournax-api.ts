const API_BASE = process.env.TOURNAX_API_URL ?? 'http://localhost:8080';
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? 'dev-admin-change-me';
const CURRENT_SEASON = 3;

export type AdminDashboard = {
  tournamentId: string;
  name: string;
  season: number;
  status: string;
  registrationOpen: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  maxPlayers: number | null;
  totalRegistrations: number;
  approvedCount: number;
  pendingCount: number;
};

export type AdminRegistration = {
  playerId: string;
  name: string;
  gamingUsername: string;
  email: string;
  waNumber: string;
  city: string;
  efootballUsername: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  approved: boolean;
  joinedAt: string;
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 && !text) {
      throw new Error(
        'API error 403 — often a stale backend or a server bug masked as forbidden. Stop bootRun with Ctrl+C, run `gradlew bootRun` again in apps/backend, then retry.',
      );
    }
    if (res.status === 403) {
      throw new Error(text || 'API error 403 — request forbidden.');
    }
    throw new Error(text || `API error ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function getAdminDashboard(season = CURRENT_SEASON) {
  return adminFetch<AdminDashboard>(`/api/v1/admin/seasons/${season}/dashboard`);
}

export function listRegistrations(season = CURRENT_SEASON) {
  return adminFetch<AdminRegistration[]>(`/api/v1/admin/seasons/${season}/registrations`);
}

export type RegistrationAuditRow = {
  id: number;
  tournamentId: string | null;
  playerId: string | null;
  eventType: string;
  email: string | null;
  ipAddress: string | null;
  ipCountry: string | null;
  ipRegion: string | null;
  ipCity: string | null;
  userAgent: string | null;
  referer: string | null;
  acceptLanguage: string | null;
  formCity: string | null;
  detail: string | null;
  createdAt: string;
};

export function listRegistrationAudit(season = CURRENT_SEASON) {
  return adminFetch<RegistrationAuditRow[]>(`/api/v1/admin/seasons/${season}/registration-audit`);
}

export function approveRegistration(playerId: string, season = CURRENT_SEASON) {
  return adminFetch<void>(`/api/v1/admin/seasons/${season}/registrations/${playerId}/approve`, {
    method: 'POST',
  });
}

export function removeRegistration(playerId: string, season = CURRENT_SEASON) {
  return adminFetch<void>(`/api/v1/admin/seasons/${season}/registrations/${playerId}`, {
    method: 'DELETE',
  });
}

export function closeRegistration(season = CURRENT_SEASON) {
  return adminFetch<AdminDashboard>(`/api/v1/admin/seasons/${season}/registration/close`, {
    method: 'POST',
  });
}

/** Reopen sign-ups — uses `/registration/window` so it works even before `/registration/open` is deployed. */
export function openRegistration(season = CURRENT_SEASON) {
  const now = Date.now();
  return adminFetch<AdminDashboard>(`/api/v1/admin/seasons/${season}/registration/window`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'registration',
      registrationOpensAt: new Date(now - 1000).toISOString(),
      registrationClosesAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
}

export type MatchStatsInput = {
  homePossessionPct?: number;
  awayPossessionPct?: number;
  homeShots?: number;
  awayShots?: number;
  homeShotsOnTarget?: number;
  awayShotsOnTarget?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeOffsides?: number;
  awayOffsides?: number;
  homeCornerKicks?: number;
  awayCornerKicks?: number;
  homeFreeKicks?: number;
  awayFreeKicks?: number;
  homePasses?: number;
  awayPasses?: number;
  homeSuccessfulPasses?: number;
  awaySuccessfulPasses?: number;
  homeCrosses?: number;
  awayCrosses?: number;
  homeInterceptions?: number;
  awayInterceptions?: number;
  homeTackles?: number;
  awayTackles?: number;
  homeSaves?: number;
  awaySaves?: number;
};

export type RecordMatchBody = {
  matchId: string;
  matchday: number;
  homePlayerId: string;
  awayPlayerId: string;
  homeGoals: number;
  awayGoals: number;
  stats?: MatchStatsInput;
};

export type AdminMatchRow = {
  id: string;
  matchday: number;
  homePlayerId: string;
  awayPlayerId: string;
  homeName: string;
  awayName: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  updatedAt: string;
  hasStats: boolean;
};

export type GenerateFixturesResult = {
  matchdays: number;
  matchesCreated: number;
};

export type MatchStage = 'league' | 'quarter_final' | 'semi_final' | 'third_place' | 'grand_final';

export type ScheduleFixtureBody = {
  matchday: number;
  homePlayerId: string;
  awayPlayerId: string;
  stage?: MatchStage;
};

export type FairPlayRow = {
  playerId: string;
  playerName: string;
  matchesWithStats: number;
  fouls: number;
  offsides: number;
};

export function listFairPlay(season = CURRENT_SEASON) {
  return adminFetch<FairPlayRow[]>(`/api/v1/admin/seasons/${season}/fair-play`);
}

export function listAdminFixtures(season = CURRENT_SEASON) {
  return adminFetch<AdminMatchRow[]>(`/api/v1/admin/seasons/${season}/fixtures`);
}

export function generateLeagueFixtures(season = CURRENT_SEASON) {
  return adminFetch<GenerateFixturesResult>(`/api/v1/admin/seasons/${season}/fixtures/generate`, {
    method: 'POST',
  });
}

export function scheduleAdminFixture(body: ScheduleFixtureBody, season = CURRENT_SEASON) {
  return adminFetch<AdminMatchRow>(`/api/v1/admin/seasons/${season}/fixtures/schedule`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listAdminMatches(season = CURRENT_SEASON) {
  return adminFetch<AdminMatchRow[]>(`/api/v1/admin/seasons/${season}/results`);
}

export function recordAdminMatch(body: RecordMatchBody, season = CURRENT_SEASON) {
  return adminFetch<AdminMatchRow>(`/api/v1/admin/seasons/${season}/results`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type AdminMatchDetail = {
  id: string;
  matchday: number;
  homePlayerId: string;
  awayPlayerId: string;
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  status: string;
  updatedAt: string;
  stats: MatchStatsInput | null;
};

export type UpdateMatchBody = {
  homeGoals: number;
  awayGoals: number;
  stats?: MatchStatsInput;
};

export function getAdminMatch(matchId: string, season = CURRENT_SEASON) {
  return adminFetch<AdminMatchDetail>(`/api/v1/admin/seasons/${season}/match-results/${matchId}`);
}

export function updateAdminMatch(matchId: string, body: UpdateMatchBody, season = CURRENT_SEASON) {
  return adminFetch<AdminMatchDetail>(`/api/v1/admin/seasons/${season}/match-results/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function updatePlayerAvatar(playerId: string, avatarUrl: string, season = CURRENT_SEASON) {
  return adminFetch<void>(`/api/v1/admin/seasons/${season}/registrations/${playerId}/avatar`, {
    method: 'PATCH',
    body: JSON.stringify({ avatarUrl }),
  });
}

export type GrievanceCategory = 'committee' | 'admin' | 'opponent' | 'scheduling' | 'other';
export type GrievanceStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export type GrievanceRow = {
  id: string;
  playerName: string;
  category: GrievanceCategory;
  subject: string;
  status: GrievanceStatus;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
};

export type GrievanceComment = {
  id: number;
  body: string;
  createdAt: string;
};

export type GrievanceDetail = {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  playerWaNumber: string;
  category: GrievanceCategory;
  subject: string;
  message: string;
  status: GrievanceStatus;
  createdAt: string;
  updatedAt: string;
  comments: GrievanceComment[];
};

export function listAdminGrievances(season = CURRENT_SEASON) {
  return adminFetch<GrievanceRow[]>(`/api/v1/admin/seasons/${season}/grievances`);
}

export function getAdminGrievance(grievanceId: string, season = CURRENT_SEASON) {
  return adminFetch<GrievanceDetail>(`/api/v1/admin/seasons/${season}/grievances/${grievanceId}`);
}

export function updateGrievanceStatus(grievanceId: string, status: GrievanceStatus, season = CURRENT_SEASON) {
  return adminFetch<GrievanceDetail>(`/api/v1/admin/seasons/${season}/grievances/${grievanceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function addGrievanceComment(grievanceId: string, body: string, season = CURRENT_SEASON) {
  return adminFetch<GrievanceDetail>(`/api/v1/admin/seasons/${season}/grievances/${grievanceId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function listApprovedPlayersForAdmin(season = CURRENT_SEASON) {
  const rows = await listRegistrations(season);
  return rows.filter((r) => r.approved);
}

export type TeamRow = {
  playerId: string;
  playerName: string;
  avatarUrl: string | null;
  teamName: string | null;
  crestUrl: string | null;
  hasCrest: boolean;
};

export type UpdateTeamBody = {
  teamName?: string;
  crestUrl?: string;
};

export function listTeams(season = CURRENT_SEASON) {
  return adminFetch<TeamRow[]>(`/api/v1/admin/seasons/${season}/teams`);
}

export function updateTeam(playerId: string, body: UpdateTeamBody, season = CURRENT_SEASON) {
  return adminFetch<TeamRow>(`/api/v1/admin/seasons/${season}/teams/${playerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type TournamentStatusValue = 'draft' | 'registration' | 'league' | 'knockout' | 'finished';

export function setTournamentStatus(status: TournamentStatusValue, season = CURRENT_SEASON) {
  return adminFetch<TournamentStatusValue>(`/api/v1/admin/seasons/${season}/season-control/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export type StartMatchdayResult = {
  matchday: number;
  opensAt: string;
  deadlineAt: string;
  missingCrestPlayerNames: string[];
};

export function startMatchday(matchday: number, deadlineAt: string, season = CURRENT_SEASON) {
  return adminFetch<StartMatchdayResult>(`/api/v1/admin/seasons/${season}/season-control/matchdays/${matchday}/start`, {
    method: 'POST',
    body: JSON.stringify({ deadlineAt }),
  });
}

export type CloseMatchdayResult = { matchday: number; disputedCount: number };

export function closeCurrentMatchday(season = CURRENT_SEASON) {
  return adminFetch<CloseMatchdayResult>(`/api/v1/admin/seasons/${season}/season-control/matchdays/current/close`, {
    method: 'POST',
  });
}
