import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  initialFinderFiles as initial,
  finderFilesReducer as reduce,
} from '../demo/finder-files.js';

test('Finder bulk delete preserves original folders and undo restores original order', () => {
  const archived = reduce(initial, { type: 'move', ids: ['budget'], folder: 'Archive' });
  const deleted = reduce(archived, {
    type: 'delete',
    ids: ['brief', 'budget', 'brief', 'missing'],
  });
  assert.equal(deleted.files.length, 4);
  assert.deepEqual(
    deleted.trash.map((file) => [file.id, file.folder]),
    [
      ['brief', 'Projects'],
      ['budget', 'Archive'],
    ],
  );
  const restored = reduce(deleted, { type: 'undo' });
  assert.deepEqual(restored.files, archived.files);
  assert.deepEqual(restored.trash, []);
  assert.equal(initial.files.length, 6, 'initial fixture is not mutated');
});

test('Finder undo only restores the latest deletion; restored files cannot be duplicated', () => {
  const first = reduce(initial, { type: 'delete', ids: ['brief'] });
  const second = reduce(first, { type: 'delete', ids: ['budget', 'cover'] });
  const partial = reduce(second, { type: 'restore', ids: ['budget', 'missing'] });
  assert.deepEqual(partial.lastDeletedIds, ['cover']);
  const restored = reduce(partial, { type: 'undo' });
  assert.deepEqual(
    restored.trash.map((file) => file.id),
    ['brief'],
  );
  assert.deepEqual(reduce(restored, { type: 'restore', ids: ['budget'] }), restored);
  assert.deepEqual(reduce(restored, { type: 'undo' }), restored);
  assert.deepEqual(reduce(restored, { type: 'reset' }), initial);
});
