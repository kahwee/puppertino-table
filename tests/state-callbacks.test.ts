import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { type PuppertinoTableInstance, usePuppertinoTable } from '../src/index.js';

test('uncontrolled state observers fire once and preserve functional updaters', () => {
  let table!: PuppertinoTableInstance<{ id: string }>;
  const counts = { sizing: 0, sorting: 0, selection: 0 };
  const resize = (previous: Record<string, number>) => ({ ...previous, id: 275 });
  function Consumer() {
    table = usePuppertinoTable({
      data: [{ id: 'a' }],
      columns: [{ accessorKey: 'id', size: 200 }],
      getRowId: (row) => row.id,
      selectable: true,
      onColumnSizingChange: (update) => {
        counts.sizing++;
        assert.equal(update, resize);
      },
      onSortingChange: () => counts.sorting++,
      onRowSelectionChange: () => counts.selection++,
    });
    return null;
  }
  renderToStaticMarkup(createElement(Consumer));
  table.setColumnSizing(resize);
  table.setSorting([{ id: 'id', desc: true }]);
  table.setRowSelection({ a: true });
  assert.equal(table.atoms.columnSizing.get().id, 275);
  assert.deepEqual(table.atoms.sorting.get(), [{ id: 'id', desc: true }]);
  assert.deepEqual(table.atoms.rowSelection.get(), { a: true });
  assert.deepEqual(counts, { sizing: 1, sorting: 1, selection: 1 });
});
