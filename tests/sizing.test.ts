import { test } from 'node:test';
import assert from 'node:assert/strict';
import { columnSizeBounds, clampSize, readColumnSizing } from '../src/sizing.js';
const bounds = [{ id: 'alpha', size: 200, minSize: 80, maxSize: 600 }, { id: 'beta', size: 100, minSize: 60, maxSize: 300 }];
test('preferences ignore malformed values, unavailable storage and stale IDs', () => {
  const defaults = { alpha: 200, beta: 100 };
  for (const json of ['broken', 'null', '[]', '42', '{"alpha":"500"}']) assert.deepEqual(readColumnSizing(bounds, 'test', { getItem: () => json }), defaults);
  assert.deepEqual(readColumnSizing(bounds, 'test', { getItem: () => { throw Error('Blocked'); } }), defaults);
  assert.deepEqual(readColumnSizing(bounds, 'test', { getItem: () => '{"alpha":1000000,"beta":0,"unknown":500}' }), { alpha: 600, beta: 60 });
  assert.equal(clampSize(NaN, bounds[0]), 200); assert.equal(clampSize(Infinity, bounds[0]), 200);
  assert.equal(clampSize(150.4, bounds[0]), 150);
  assert.equal(clampSize(1000, { id: 'fraction', size: 100, minSize: 80.5, maxSize: 100.5 }), 100.5);
});
test('grouped columns derive stable leaf IDs and reject ambiguous schemas', () => {
  assert.deepEqual(columnSizeBounds([{ id: 'group', columns: [{ accessorKey: 'person.name' }, { id: 'score', minSize: 80, maxSize: 100, size: 150 }] }]), [{ id: 'person_name', size: 150, minSize: 20, maxSize: 1200 }, { id: 'score', size: 100, minSize: 80, maxSize: 100 }]);
  assert.throws(() => columnSizeBounds([{ id: 'x' }, { id: 'group', columns: [{ id: 'x' }] }]), /unique/);
  assert.throws(() => columnSizeBounds([{}]), /unique/);
  assert.equal(columnSizeBounds([{ id: 'x', size: NaN, minSize: 300, maxSize: 500 }])[0].size, 300);
  assert.throws(() => columnSizeBounds([{ id: 'x', minSize: 100, maxSize: 20 }]), /bounds/);
  assert.throws(() => columnSizeBounds([{ id: 'x', minSize: -1 }]), /bounds/);
});
