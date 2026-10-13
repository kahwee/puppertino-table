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

test('Finder tags survive moves, Trash and undo without mutating fixtures', () => {
  const tagged = reduce(initial, { type: 'tag', ids: ['brief', 'budget'], tag: 'Review' });
  const repeated = reduce(tagged, { type: 'tag', ids: ['brief'], tag: 'Review' });
  assert.deepEqual(repeated.files[0].tags, ['Review']);
  const moved = reduce(repeated, { type: 'move', ids: ['brief'], folder: 'Archive' });
  const deleted = reduce(moved, { type: 'delete', ids: ['brief'] });
  assert.deepEqual(deleted.trash[0].tags, ['Review']);
  assert.deepEqual(reduce(deleted, { type: 'undo' }).files, moved.files);
  const removed = reduce(tagged, { type: 'tag', ids: ['brief'], tag: 'Review', remove: true });
  assert.deepEqual(removed.files[0].tags, []);
  assert.deepEqual(removed.files[2].tags, ['Review']);
  assert.equal(initial.files[0].tags, undefined);
});

test('Finder rename preserves identity and rejects duplicate or invalid filenames', () => {
  const renamed = reduce(initial, { type: 'rename', id: 'brief', name: '  Updated brief.pdf  ' });
  assert.equal(renamed.files[0].name, 'Updated brief.pdf');
  assert.equal(renamed.files[0].id, 'brief');
  assert.equal(initial.files[0].name, 'Project brief.pdf');
  for (const name of ['', '/', '.', '..', 'Budget.xlsx', 'budget.xlsx'])
    assert.equal(reduce(initial, { type: 'rename', id: 'brief', name }), initial);
  assert.equal(reduce(initial, { type: 'rename', id: 'unknown', name: 'new.txt' }), initial);
});
