import assert from 'node:assert/strict';
import { test } from 'node:test';
import { peoplePage } from '../demo/people-page.js';
import { tableData } from '../demo/table-data-presets.js';

const data = tableData('standard');
const defaults = { query: '', sorting: [], pageIndex: 0, pageSize: 2 };

test('app-owned sorting orders the full dataset before selecting a page', () => {
  const snapshot = [...data];
  const page = peoplePage(data, { ...defaults, sorting: [{ id: 'score', desc: true }] });
  assert.deepEqual(
    page.rows.map((person) => person.score),
    [86, 85],
  );
  assert.equal(page.rows[0], data[11], 'stable identity survives ordering');
  assert.deepEqual(data, snapshot, 'application fixtures are never mutated');
});

test('filters match names and teams and clamp an out-of-range page', () => {
  const page = peoplePage(data, { ...defaults, query: '  ENGINEERING ', pageIndex: 5 });
  assert.equal(page.total, 4);
  assert.equal(page.pageCount, 2);
  assert.equal(page.pageIndex, 1);
  assert.ok(page.rows.every((person) => person.team === 'Engineering'));
  assert.equal(peoplePage(data, { ...defaults, query: 'Maya' }).rows[0].id, data[0].id);
});

test('empty results have a valid empty page and invalid sizes fail explicitly', () => {
  const page = peoplePage(data, { ...defaults, query: 'missing teammate', pageIndex: 4 });
  assert.deepEqual(page, { rows: [], total: 0, pageIndex: 0, pageCount: 0 });
  for (const pageSize of [0, -1, 1.5, Number.NaN])
    assert.throws(() => peoplePage(data, { ...defaults, pageSize }), /pageSize/);
});
