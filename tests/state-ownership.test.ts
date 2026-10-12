import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAtom } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import { validateAtomIdentity, validateAtomOwnership } from '../src/state-ownership.js';

test('atoms may own different slices alongside React-controlled slices', () => {
  assert.doesNotThrow(() =>
    validateAtomOwnership({
      atoms: { columnSizing: createAtom<ColumnSizingState>({ name: 200 }) },
      sorting: [],
      onSortingChange: () => {},
    }),
  );
});
test('conflicting state and callback ownership is rejected for every slice', () => {
  const sorting = createAtom<SortingState>([]);
  const rowSelection = createAtom<RowSelectionState>({});
  const columnSizing = createAtom<ColumnSizingState>({});
  for (const options of [
    { atoms: { sorting }, sorting: [] },
    { atoms: { sorting }, onSortingChange: () => {} },
    { atoms: { rowSelection }, rowSelection: {} },
    { atoms: { rowSelection }, onRowSelectionChange: () => {} },
    { atoms: { columnSizing }, columnSizing: {} },
    { atoms: { columnSizing }, onColumnSizingChange: () => {} },
  ])
    assert.throws(() => validateAtomOwnership(options), /must have one owner/);
});

test('v9 atom bindings may be rewrapped but cannot be added, removed or replaced after mount', () => {
  const columnSizing = createAtom<ColumnSizingState>({ name: 200 });
  assert.doesNotThrow(() => validateAtomIdentity({ columnSizing }, { columnSizing }));
  for (const [initial, next] of [
    [undefined, { columnSizing }],
    [{ columnSizing }, undefined],
    [{ columnSizing }, { columnSizing: createAtom<ColumnSizingState>({ name: 250 }) }],
  ] as const)
    assert.throws(() => validateAtomIdentity(initial, next), /remount the table/);
});

test('a snapshot detects mutation of the caller atom map', () => {
  const atoms = { columnSizing: createAtom<ColumnSizingState>({ name: 200 }) };
  const mounted = { ...atoms };
  atoms.columnSizing = createAtom<ColumnSizingState>({ name: 250 });
  assert.throws(() => validateAtomIdentity(mounted, atoms), /remount the table/);
});
