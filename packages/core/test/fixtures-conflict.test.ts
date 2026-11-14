import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMatchdayConflict } from '../src/index.ts';

test('findMatchdayConflict: flags a player already booked that matchday', () => {
  const existing = [{ id: 'm1', matchday: 1, homeId: 'a', awayId: 'b' }];
  const conflict = findMatchdayConflict(existing, { matchday: 1, homeId: 'c', awayId: 'a' });
  assert.equal(conflict, 'a');
});

test('findMatchdayConflict: no conflict on a different matchday', () => {
  const existing = [{ id: 'm1', matchday: 1, homeId: 'a', awayId: 'b' }];
  const conflict = findMatchdayConflict(existing, { matchday: 2, homeId: 'a', awayId: 'c' });
  assert.equal(conflict, null);
});

test('findMatchdayConflict: editing a match does not conflict with itself', () => {
  const existing = [{ id: 'm1', matchday: 1, homeId: 'a', awayId: 'b' }];
  const conflict = findMatchdayConflict(existing, { id: 'm1', matchday: 1, homeId: 'a', awayId: 'b' });
  assert.equal(conflict, null);
});

test('findMatchdayConflict: catches the away player being double-booked (the real Matchday 1 bug)', () => {
  const existing = [
    { id: 'm1', matchday: 1, homeId: 'jouhar', awayId: 'jamshid' },
    { id: 'm2', matchday: 1, homeId: 'adhil', awayId: 'sinan' },
  ];
  const conflict = findMatchdayConflict(existing, { matchday: 1, homeId: 'shahal', awayId: 'jamshid' });
  assert.equal(conflict, 'jamshid');
});
