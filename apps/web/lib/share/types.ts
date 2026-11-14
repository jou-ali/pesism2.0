export type Badge = {
  teamName: string;
  crestUrl?: string | null;
};

export type Side = Badge & {
  playerName: string;
  photoUrl?: string | null;
};

export type Fixture = { home: Side; away: Side };

export type Tie = { label: string; home: Side; away: Side };

export type Movement = 'up' | 'down' | 'same';

export type TableRowData = Badge & {
  pos: number;
  player: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDiff: number;
  points: number;
  movement: Movement | null;
  qualifies: boolean;
  isLeader: boolean;
  cutBefore: boolean;
};

export type ChaserRow = Badge & {
  pos: number;
  player: string;
  value: string;
};
