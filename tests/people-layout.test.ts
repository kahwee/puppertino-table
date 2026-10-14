import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultPeopleLayout,
  normalizePeopleLayout,
  readPeopleLayout,
} from '../demo/people-layout.js';

test('layout restoration keeps Name visible and rejects stale column IDs', () => {
  const layout = normalizePeopleLayout({
    version: 1,
    hidden: ['name', 'score', 'score', 'unknown'],
    widths: {},
  });
  assert.deepEqual(layout.hidden, ['score']);
  assert.deepEqual(Object.keys(layout.widths), ['name', 'team', 'score', 'active']);
});

test('saved widths are rounded and bounded; malformed or future schemas use defaults', () => {
  const layout = normalizePeopleLayout({
    version: 1,
    hidden: [],
    widths: { name: 9999, team: 185.7, score: '200', active: -10 },
  });
  assert.deepEqual(layout.widths, { name: 700, team: 186, score: 120, active: 110 });
  for (const saved of ['bad json', 'null', '[]', '{"version":2}', '{"version":1,"widths":[]}'])
    assert.deepEqual(readPeopleLayout(saved), defaultPeopleLayout());
});

test('hidden columns retain their completed widths when another column is resized', () => {
  const saved = normalizePeopleLayout({
    version: 1,
    hidden: ['score'],
    widths: { score: 176, name: 280 },
  });
  const resized = normalizePeopleLayout({ ...saved, widths: { ...saved.widths, name: 320 } });
  assert.equal(resized.widths.score, 176);
  assert.equal(resized.widths.name, 320);
});
