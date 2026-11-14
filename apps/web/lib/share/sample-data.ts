import type { Badge, ChaserRow, Fixture, Side, TableRowData, Tie } from './types';

type TeamKey = 'acm' | 'mun' | 'rma' | 'liv' | 'bar' | 'ars' | 'fcb' | 'juv' | 'psg' | 'int' | 'che' | 'atm' | 'bvb' | 'nap' | 'gla';

const TEAMS: Record<TeamKey, Badge> = {
  acm: { teamName: 'AC Milan', short: 'ACM', primaryColor: '#C8102E', secondaryColor: '#111111', ink: '#FFFFFF' },
  mun: { teamName: 'Man Utd', short: 'MUN', primaryColor: '#DA291C', secondaryColor: '#FBE122', ink: '#FFFFFF' },
  rma: { teamName: 'Real Madrid', short: 'RMA', primaryColor: '#FFFFFF', secondaryColor: '#FEBE10', ink: '#1E0825' },
  liv: { teamName: 'Liverpool', short: 'LIV', primaryColor: '#C8102E', secondaryColor: '#00B2A9', ink: '#FFFFFF' },
  bar: { teamName: 'Barcelona', short: 'BAR', primaryColor: '#A50044', secondaryColor: '#004D98', ink: '#FFFFFF' },
  ars: { teamName: 'Arsenal', short: 'ARS', primaryColor: '#EF0107', secondaryColor: '#FFFFFF', ink: '#FFFFFF' },
  fcb: { teamName: 'Bayern', short: 'FCB', primaryColor: '#DC052D', secondaryColor: '#0066B2', ink: '#FFFFFF' },
  juv: { teamName: 'Juventus', short: 'JUV', primaryColor: '#111111', secondaryColor: '#FFFFFF', ink: '#FFFFFF' },
  psg: { teamName: 'Paris SG', short: 'PSG', primaryColor: '#004170', secondaryColor: '#DA291C', ink: '#FFFFFF' },
  int: { teamName: 'Inter', short: 'INT', primaryColor: '#0068A8', secondaryColor: '#111111', ink: '#FFFFFF' },
  che: { teamName: 'Chelsea', short: 'CHE', primaryColor: '#034694', secondaryColor: '#FFFFFF', ink: '#FFFFFF' },
  atm: { teamName: 'Atlético Madrid', short: 'ATM', primaryColor: '#CB3524', secondaryColor: '#272E61', ink: '#FFFFFF' },
  bvb: { teamName: 'Dortmund', short: 'BVB', primaryColor: '#FDE100', secondaryColor: '#111111', ink: '#111111' },
  nap: { teamName: 'Napoli', short: 'NAP', primaryColor: '#12A0D7', secondaryColor: '#003C82', ink: '#FFFFFF' },
  gla: { teamName: 'Borussia Mönchengladbach', short: 'BMG', primaryColor: '#000000', secondaryColor: '#FFFFFF', ink: '#FFFFFF' },
};

const side = (key: TeamKey, playerName: string): Side => ({ ...TEAMS[key], playerName });

export const sampleFixtures5: Fixture[] = [
  { home: side('acm', 'Adhil'), away: side('mun', 'Rahul') },
  { home: side('rma', 'Sameer'), away: side('liv', 'Faiz') },
  { home: side('bar', 'Nikhil'), away: side('ars', 'Imran') },
  { home: side('fcb', 'Vivek'), away: side('juv', 'Kiran') },
  { home: side('psg', 'Arjun'), away: side('int', 'Jouhar') },
];

export const sampleFixtures7: Fixture[] = [
  ...sampleFixtures5,
  { home: side('che', 'Shahal'), away: side('atm', 'Sinan') },
  { home: side('bvb', 'Jamshid'), away: side('gla', 'Khadar') },
];

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
  { label: 'QF1', seeds: '1ST v 8TH', home: side('acm', 'Adhil'), away: side('ars', 'Imran') },
  { label: 'QF2', seeds: '2ND v 7TH', home: side('mun', 'Rahul'), away: side('int', 'Jouhar') },
  { label: 'QF3', seeds: '3RD v 6TH', home: side('liv', 'Faiz'), away: side('fcb', 'Vivek') },
  { label: 'QF4', seeds: '4TH v 5TH', home: side('rma', 'Sameer'), away: side('bar', 'Nikhil') },
];

export const sampleSfTies: Tie[] = [
  { label: 'SF1 · WINNER QF1 v WINNER QF4', home: side('acm', 'Adhil'), away: side('bar', 'Nikhil') },
  { label: 'SF2 · WINNER QF2 v WINNER QF3', home: side('int', 'Jouhar'), away: side('liv', 'Faiz') },
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
        { rows: [{ ...side('rma', 'Sameer'), score: 1, won: false }, { ...side('bar', 'Nikhil'), score: 2, won: true }] },
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
  fewerThanSecond: 5,
  concededPerMatch: 0.56,
  cleanSheets: 8,
  longestRun: 4,
  chasers: gloveChasers,
};
