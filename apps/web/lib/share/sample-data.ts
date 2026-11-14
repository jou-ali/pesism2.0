import type { Badge, ChaserRow, Fixture, Side, TableRowData, Tie } from './types';

type TeamKey = 'acm' | 'mun' | 'rma' | 'liv' | 'bar' | 'ars' | 'fcb' | 'juv' | 'psg' | 'int' | 'che' | 'atm' | 'bvb' | 'nap' | 'gla';

const TEAMS: Record<TeamKey, Badge> = {
  acm: { teamName: 'AC Milan' },
  mun: { teamName: 'Man Utd' },
  rma: { teamName: 'Real Madrid' },
  liv: { teamName: 'Liverpool' },
  bar: { teamName: 'Barcelona' },
  ars: { teamName: 'Arsenal' },
  fcb: { teamName: 'Bayern' },
  juv: { teamName: 'Juventus' },
  psg: { teamName: 'Paris Saint-Germain' },
  int: { teamName: 'Inter' },
  che: { teamName: 'Chelsea' },
  atm: { teamName: 'Atlético Madrid' },
  bvb: { teamName: 'Dortmund' },
  nap: { teamName: 'Napoli' },
  gla: { teamName: 'Borussia Mönchengladbach' },
};

const side = (key: TeamKey, playerName: string): Side => ({ ...TEAMS[key], playerName });

export const sampleFixtures5: Fixture[] = [
  { home: side('acm', 'Adhil'), away: side('mun', 'Rahul') },
  { home: side('rma', 'Sameer'), away: side('liv', 'Faiz') },
  { home: side('bar', 'Nikhil'), away: side('ars', 'Imran') },
  { home: side('fcb', 'Vivek'), away: side('juv', 'Kiran') },
  { home: side('psg', 'Arjun'), away: side('int', 'Jouhar') },
];

/** 7 fixtures, 14 players, no bye (an even-sized tournament at full density). */
export const sampleFixtures7: Fixture[] = [
  ...sampleFixtures5,
  { home: side('che', 'Shahal'), away: side('atm', 'Sinan') },
  { home: side('bvb', 'Jamshid'), away: side('gla', 'Khadar') },
];

/** 6 fixtures, 12 players + 1 bye = 13 players (an odd-sized tournament at full density). */
export const sampleFixtures6: Fixture[] = sampleFixtures7.slice(0, 6);

/** Long player name, for the "names are never truncated below 10 characters" test case. */
export const sampleBye: Side = side('nap', 'Muhammed Rashid Ali');

const tableData: Array<[TeamKey, string, number, number, number, string, number, 'up' | 'down' | 'same']> = [
  ['acm', 'Adhil', 3, 3, 0, '+7', 9, 'up'],
  ['mun', 'Rahul', 3, 2, 1, '+4', 7, 'up'],
  ['liv', 'Faiz', 3, 2, 0, '+2', 6, 'down'],
  ['rma', 'Sameer', 3, 1, 2, '+2', 5, 'same'],
  ['bar', 'Nikhil', 3, 1, 1, '+1', 4, 'up'],
  ['fcb', 'Vivek', 3, 1, 1, '0', 4, 'down'],
  ['int', 'Jouhar', 3, 0, 2, '−1', 2, 'up'],
  ['ars', 'Imran', 3, 0, 1, '−3', 1, 'down'],
  ['juv', 'Kiran', 3, 0, 1, '−5', 1, 'same'],
  ['psg', 'Arjun', 3, 0, 1, '−7', 1, 'down'],
];

function buildTableRows(
  data: Array<[TeamKey, string, number, number, number, string, number, 'up' | 'down' | 'same']>,
  qualifiers: number,
): TableRowData[] {
  return data.map((d, i) => {
    const pos = i + 1;
    const [w, drawn] = [d[3], d[4]];
    const played = d[2];
    const lost = played - w - drawn;
    return {
      ...TEAMS[d[0]],
      pos,
      player: d[1],
      played,
      won: w,
      drawn,
      lost,
      goalDiff: Number(d[5].replace('−', '-')),
      points: d[6],
      movement: d[7],
      qualifies: pos <= qualifiers,
      isLeader: pos === 1,
      cutBefore: pos === qualifiers + 1,
    };
  });
}

export const sampleTableRows10: TableRowData[] = buildTableRows(tableData, 8);

const tableData14: Array<[TeamKey, string, number, number, number, string, number, 'up' | 'down' | 'same']> = [
  ['acm', 'Adhil', 3, 3, 0, '+8', 9, 'up'],
  ['che', 'Shahal', 3, 3, 0, '+5', 9, 'up'],
  ['mun', 'Rahul', 3, 2, 1, '+4', 7, 'down'],
  ['liv', 'Faiz', 3, 2, 0, '+3', 6, 'same'],
  ['bvb', 'Jamshid', 3, 2, 0, '+1', 6, 'up'],
  ['rma', 'Sameer', 3, 1, 2, '+2', 5, 'down'],
  ['bar', 'Nikhil', 3, 1, 1, '+1', 4, 'up'],
  ['atm', 'Sinan', 3, 1, 1, '0', 4, 'down'],
  ['fcb', 'Vivek', 3, 1, 0, '−1', 3, 'same'],
  ['nap', 'Khadar', 3, 0, 2, '−2', 2, 'up'],
  ['int', 'Jouhar', 3, 0, 1, '−3', 1, 'down'],
  ['ars', 'Imran', 3, 0, 1, '−5', 1, 'down'],
  ['juv', 'Kiran', 3, 0, 1, '−6', 1, 'same'],
  ['psg', 'Arjun', 3, 0, 0, '−7', 0, 'down'],
];

export const sampleTableRows14: TableRowData[] = buildTableRows(tableData14, 8);

export const sampleQfTies: Tie[] = [
  { label: 'QF1', home: side('acm', 'Adhil'), away: side('ars', 'Imran') },
  { label: 'QF2', home: side('mun', 'Rahul'), away: side('int', 'Jouhar') },
  { label: 'QF3', home: side('liv', 'Faiz'), away: side('fcb', 'Vivek') },
  { label: 'QF4', home: side('rma', 'Sameer'), away: side('bar', 'Nikhil') },
];

export const sampleSfTies: Tie[] = [
  // The longest team names on purpose — a standing check that no team name ever truncates.
  { label: 'SF1 · WINNER QF1 v WINNER QF4', home: side('gla', 'Khadar'), away: side('psg', 'Arjun') },
  { label: 'SF2 · WINNER QF2 v WINNER QF3', home: side('atm', 'Sinan'), away: side('liv', 'Faiz') },
];

export const sampleFinal: { home: Side; away: Side } = {
  home: side('acm', 'Adhil'),
  away: side('liv', 'Faiz'),
};

export const sampleBracket = {
  qfGroups: [
    {
      boxes: [
        { rows: [{ ...side('acm', 'Adhil'), score: 3, won: true }, { ...side('ars', 'Imran'), score: 1, won: false }] },
        { rows: [{ ...side('gla', 'Sameer'), score: 1, won: false }, { ...side('bar', 'Nikhil'), score: 2, won: true }] },
      ],
    },
    {
      boxes: [
        { rows: [{ ...side('mun', 'Rahul'), score: 2, won: false, pens: '(3)' }, { ...side('int', 'Jouhar'), score: 2, won: true, pens: '(4)' }] },
        { rows: [{ ...side('liv', 'Faiz'), score: 1, won: true }, { ...side('fcb', 'Vivek'), score: 0, won: false }] },
      ],
    },
  ],
  sf: [
    { rows: [side('acm', 'Adhil'), side('bar', 'Nikhil')] },
    { rows: [side('int', 'Jouhar'), side('liv', 'Faiz')] },
  ],
  finalDate: 'Sun, 1 Feb',
};

export const sampleChampion = {
  winner: side('liv', 'Faiz'),
  scoreLine: 'Beat AC Milan 2–1',
  record: { won: 12, drawn: 3, lost: 1 },
  goalsScored: 41,
};

const shieldChasers: ChaserRow[] = [
  { ...TEAMS.mun, pos: 2, player: 'Rahul', value: '27' },
  { ...TEAMS.liv, pos: 3, player: 'Faiz', value: '25' },
  { ...TEAMS.rma, pos: 4, player: 'Sameer', value: '24' },
  { ...TEAMS.bar, pos: 5, player: 'Nikhil', value: '22' },
];

export const sampleLeagueShield = {
  leader: side('acm', 'Adhil'),
  points: 31,
  clearOfSecond: 4,
  pointsPerMatch: 2.38,
  record: { won: 10, drawn: 1, lost: 2 },
  goalDiff: 24,
  goalsScored: 38,
  goalsConceded: 14,
  totalMatchdays: 13,
  chasers: shieldChasers,
};

const bootChasers: ChaserRow[] = [
  { ...TEAMS.acm, pos: 2, player: 'Adhil', value: '39' },
  { ...TEAMS.liv, pos: 3, player: 'Faiz', value: '33' },
  { ...TEAMS.rma, pos: 4, player: 'Sameer', value: '30' },
  { ...TEAMS.bar, pos: 5, player: 'Nikhil', value: '28' },
];

export const sampleGoldenBoot = {
  leader: side('mun', 'Rahul'),
  goals: 42,
  clearOfSecond: 3,
  goalsPerMatch: 2.63,
  matches: 16,
  goalDiff: 31,
  biggestHaul: { goals: 6, opponentShort: 'ARS' },
  blanks: 1,
  chasers: bootChasers,
};

const gloveChasers: ChaserRow[] = [
  { ...TEAMS.acm, pos: 2, player: 'Adhil', value: '14' },
  { ...TEAMS.rma, pos: 3, player: 'Sameer', value: '17' },
  { ...TEAMS.mun, pos: 4, player: 'Rahul', value: '18' },
  { ...TEAMS.bar, pos: 5, player: 'Nikhil', value: '19' },
];

export const sampleGoldenGlove = {
  leader: side('liv', 'Faiz'),
  conceded: 9,
  matches: 16,
  wins: 12,
  fewerThanSecond: 5,
  concededPerMatch: 0.56,
  cleanSheets: 8,
  longestRun: 4,
  chasers: gloveChasers,
};
