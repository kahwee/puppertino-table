import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RowData } from '@tanstack/react-table';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  type PuppertinoTableInstance,
  type PuppertinoTableOptions,
  TableBody,
  TableHeader,
  usePuppertinoTable,
} from '../src/index.js';

function makeTable<T extends RowData>(options: PuppertinoTableOptions<T>) {
  let table!: PuppertinoTableInstance<T>;
  function Consumer() {
    table = usePuppertinoTable(options);
    return null;
  }
  renderToStaticMarkup(createElement(Consumer));
  return table;
}
const data = [
  { id: 'ten', value: 10 },
  { id: 'two', value: 2 },
];
const base = {
  data,
  columns: [{ accessorKey: 'value', header: 'Value' }],
  getRowId: (row: (typeof data)[number]) => row.id,
};

test('automatic local sorting is the default; explicit manual sorting preserves a server page', () => {
  const local = makeTable(base);
  local.setSorting([{ id: 'value', desc: false }]);
  assert.deepEqual(
    local.getRowModel().rows.map((row) => row.id),
    ['two', 'ten'],
  );
  const server = makeTable({
    ...base,
    manualSorting: true,
    sorting: [{ id: 'value', desc: false }],
    onSortingChange: () => {},
  });
  assert.deepEqual(
    server.getRowModel().rows.map((row) => row.id),
    ['ten', 'two'],
  );
  const column = server.getColumn('value');
  assert.ok(column);
  column.toggleSorting();
  assert.deepEqual(
    server.getRowModel().rows.map((row) => row.id),
    ['ten', 'two'],
  );
});

test('automatic string sorting is natural and named datetime sorting is chronological', () => {
  const strings = makeTable({
    data: [
      { id: 'ten', value: 'Item 10' },
      { id: 'two', value: 'item 2' },
    ],
    columns: base.columns,
    getRowId: (row) => row.id,
    initialSorting: [{ id: 'value', desc: false }],
  });
  assert.deepEqual(
    strings.getRowModel().rows.map((row) => row.id),
    ['two', 'ten'],
  );
  const dates = makeTable({
    data: [
      { id: 'october', value: new Date('2026-10-10T23:40:00Z') },
      { id: 'september', value: new Date('2026-09-30T23:40:00Z') },
      { id: 'morning', value: new Date('2026-10-10T16:15:00Z') },
    ],
    columns: [{ accessorKey: 'value', sortFn: 'datetime' }],
    getRowId: (row) => row.id,
    initialSorting: [{ id: 'value', desc: false }],
  });
  assert.deepEqual(
    dates.getRowModel().rows.map((row) => row.id),
    ['september', 'morning', 'october'],
  );
});

function primitiveMarkup(options: PuppertinoTableOptions<(typeof data)[number]>) {
  function Consumer() {
    const table = usePuppertinoTable(options);
    return createElement(
      'table',
      null,
      createElement(TableHeader<(typeof data)[number]>, { table }),
      createElement(TableBody<(typeof data)[number]>, {
        table,
        getRowProps: (_row, context) => ({
          'data-column-count': context.columnCount,
          'data-disabled': context.disabled,
        }),
      }),
    );
  }
  return renderToStaticMarkup(createElement(Consumer));
}

test('primitive layouts inherit selection visibility and disabled policy from the hook', () => {
  const writable = primitiveMarkup({ ...base, selectable: true });
  assert.match(writable, /Select all visible rows/);
  assert.match(writable, /data-column-count="2"/);
  const disabled = primitiveMarkup({ ...base, selectable: true, disabled: true });
  assert.match(disabled, /data-disabled="true"/);
  assert.match(disabled, /type="checkbox"[^>]*disabled=""/);
  assert.doesNotMatch(disabled, /role="separator"|class="pt-sort"/);
  const hidden = primitiveMarkup({ ...base, selectable: true, selectionCheckboxes: false });
  assert.doesNotMatch(hidden, /type="checkbox"/);
  assert.match(hidden, /data-column-count="1"/);
});

test('primitive resize handles respect read-only widths and resizable=false', () => {
  assert.doesNotMatch(
    primitiveMarkup({ ...base, columnSizing: { value: 180 } }),
    /role="separator"/,
  );
  assert.doesNotMatch(primitiveMarkup({ ...base, resizable: false }), /role="separator"/);
  assert.match(
    primitiveMarkup({ ...base, columnSizing: { value: 180 }, onColumnSizingChange: () => {} }),
    /role="separator"/,
  );
});
