import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAtom } from '@tanstack/react-store';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  type PuppertinoTableInstance,
  type PuppertinoTableOptions,
  reorderColumn,
  usePuppertinoTable,
} from '../src/index.js';
import { validateAtomOwnership } from '../src/state-ownership.js';

type OrderRow = { id: string; size: number };

function OrderConsumer({
  options,
  capture,
}: {
  options: PuppertinoTableOptions<OrderRow>;
  capture: (table: PuppertinoTableInstance<OrderRow>) => void;
}) {
  capture(usePuppertinoTable(options));
  return null;
}

test('native TanStack order atom updates leaf columns and row cells without rebuilding definitions', () => {
  let table!: PuppertinoTableInstance<{ id: string; size: number }>;
  const columnOrder = createAtom(['id', 'size']);
  renderToStaticMarkup(
    createElement(OrderConsumer, {
      options: {
        data: [{ id: 'a', size: 12 }],
        columns: [{ accessorKey: 'id' }, { accessorKey: 'size' }],
        getRowId: (item) => item.id,
        atoms: { columnOrder },
      },
      capture: (instance) => {
        table = instance;
      },
    }),
  );
  table.setColumnOrder((previous) => [...previous].reverse());
  assert.deepEqual(columnOrder.get(), ['size', 'id']);
  assert.deepEqual(
    table.getAllLeafColumns().map((column) => column.id),
    ['size', 'id'],
  );
  assert.deepEqual(
    table
      .getRowModel()
      .rows[0].getAllCells()
      .map((cell) => cell.column.id),
    ['size', 'id'],
  );
  assert.throws(
    () => validateAtomOwnership({ atoms: { columnOrder }, onColumnOrderChange: () => {} }),
    /one owner/,
  );
});
test('reorder preserves absent IDs and cannot move or cross protected leading columns', () => {
  const order = ['name', 'kind', 'hidden', 'size', 'date'];
  const visible = ['name', 'kind', 'size', 'date'];
  assert.deepEqual(reorderColumn(order, visible, ['name'], 'size', 'kind'), [
    'name',
    'size',
    'kind',
    'hidden',
    'date',
  ]);
  for (const [active, over] of [
    ['name', 'size'],
    ['size', 'name'],
    ['missing', 'size'],
    ['kind', 'kind'],
  ])
    assert.deepEqual(reorderColumn(order, visible, ['name'], active, over), order);
});
