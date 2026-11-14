import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  positionsAfterMatchday,
  cleanSheetCount,
  longestCleanSheetRun,
  blanksCount,
  biggestHaul,
  type Match,
} from '../src/index.ts';

const m = (id: string, md: number, h: string, a: string, hg: number | null, ag: number | null, status: Match['status'] = 'confirmed'): Match =>
  ({ id, matchday: md, homeId: h, awayId: a, homeGoals: hg, awayGoals: ag, status });

test('positionsAfterMatchday: position as of an earlier matchday, ignoring later ones', () => {
  const matches = [
    m('1', 1, 'a', 'b', 0, 1), // after MD1: b leads
    m('2', 2, 'a', 'b', 3, 0), // after MD2: a leads
  ];
  const afterMd1 = positionsAfterMatchday(['a', 'b'], matches, undefined, 1);
  assert.equal(afterMd1['b'], 1);
  assert.equal(afterMd1['a'], 2);

  const afterMd2 = positionsAfterMatchday(['a', 'b'], matches, undefined, 2);
  assert.equal(afterMd2['a'], 1);
  assert.equal(afterMd2['b'], 2);
});

test('cleanSheetCount: counts only matches where the player conceded zero', () => {
  const matches = [
    m('1', 1, 'a', 'b', 1, 0), // a (home): clean sheet
    m('2', 2, 'b', 'a', 0, 2), // a (away): clean sheet
    m('3', 3, 'a', 'b', 1, 1), // a: conceded
    m('4', 4, 'a', 'b', 1, 0, 'pending_confirmation'), // ignored
  ];
  assert.equal(cleanSheetCount('a', matches), 2);
});

test('longestCleanSheetRun: longest consecutive streak, broken by a concession', () => {
  const matches = [
    m('1', 1, 'a', 'b', 1, 0),
    m('2', 2, 'a', 'b', 1, 0),
    m('3', 3, 'a', 'b', 1, 1), // breaks the streak
    m('4', 4, 'a', 'b', 1, 0),
    m('5', 5, 'a', 'b', 1, 0),
    m('6', 6, 'a', 'b', 1, 0),
  ];
  assert.equal(longestCleanSheetRun('a', matches), 3);
});

test('blanksCount: counts matches where the player scored zero', () => {
  const matches = [
    m('1', 1, 'a', 'b', 0, 1),
    m('2', 2, 'b', 'a', 1, 0), // a (away) scored 0
    m('3', 3, 'a', 'b', 2, 1),
  ];
  assert.equal(blanksCount('a', matches), 2);
});

test('biggestHaul: the single-match max and the opponent that day', () => {
  const matches = [
    m('1', 1, 'a', 'b', 2, 1),
    m('2', 2, 'c', 'a', 1, 5), // a (away) scored 5 v c
    m('3', 3, 'a', 'd', 3, 0),
  ];
  const haul = biggestHaul('a', matches);
  assert.deepEqual(haul, { goals: 5, opponentId: 'c' });
});

test('biggestHaul: null when the player has no counted matches', () => {
  assert.equal(biggestHaul('z', [m('1', 1, 'a', 'b', 2, 1)]), null);
});
