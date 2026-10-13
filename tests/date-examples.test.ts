import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDateTime } from '../demo/date-format.js';
import { parseAddedDate } from '../demo/date-table-example.js';

test('invalid and missing timestamps normalize at the application boundary', () => {
  assert.equal(parseAddedDate(null), null);
  assert.equal(parseAddedDate('not-a-date'), null);
  assert.equal(parseAddedDate('2026-10-10T23:40:00Z')?.toISOString(), '2026-10-10T23:40:00.000Z');
});
test('time-zone display handles the repeated daylight-saving hour without changing timestamps', () => {
  const before = new Date('2026-11-01T08:30:00Z');
  const after = new Date('2026-11-01T09:30:00Z');
  assert.equal(formatDateTime(before), 'Nov 1, 2026 at 1:30 AM');
  assert.equal(formatDateTime(after), 'Nov 1, 2026 at 1:30 AM');
  assert.equal(formatDateTime(before, 'UTC'), 'Nov 1, 2026 at 8:30 AM');
  assert.equal(formatDateTime(after, 'UTC'), 'Nov 1, 2026 at 9:30 AM');
  assert.ok(before.getTime() < after.getTime());
});
