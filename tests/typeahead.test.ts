import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findTypeaheadMatch } from '../src/typeahead.js';

test('typeahead starts after focus, wraps, and supports missing focus and empty IDs', () => {
  const ids = Object.freeze(['', 'b', 'c']);
  const labels = new Map([
    ['', 'Alpha'],
    ['b', 'Beta'],
    ['c', 'Alpine'],
  ]);
  const label = (id: string) => labels.get(id) ?? '';
  assert.equal(findTypeaheadMatch(ids, '', 'al', label), 'c');
  assert.equal(findTypeaheadMatch(ids, 'c', 'al', label), '');
  assert.equal(findTypeaheadMatch(ids, 'missing', 'al', label), '');
  assert.equal(findTypeaheadMatch(ids, 'b', 'bet', label), 'b');
  assert.equal(findTypeaheadMatch([], 'missing', 'al', label), undefined);
});

test('a missing prefix visits each item once without allocating a reordered collection', () => {
  const order = Object.freeze(Array.from({ length: 10000 }, (_, index) => String(index)));
  let calls = 0;
  assert.equal(
    findTypeaheadMatch(order, '5000', 'missing', (id) => {
      calls++;
      return id;
    }),
    undefined,
  );
  assert.equal(calls, order.length);
});
