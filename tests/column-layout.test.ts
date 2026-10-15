import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  columnLayoutMenu,
  moveLayoutColumn,
  normalizeColumnLayout,
  readColumnLayout,
  readColumnLayoutPresets,
} from '../src/column-layout.js';

const columns = [
  { id: 'name', label: 'Name', size: 280, minSize: 180, maxSize: 800, pinned: true },
  ...['kind', 'size', 'date', 'status'].map((id) => ({
    id,
    label: id,
    size: 100,
    minSize: 60,
    maxSize: 300,
  })),
];
test('restore reconciles schema, protects Name and retains hidden widths', () => {
  const layout = normalizeColumnLayout(columns, {
    version: 1,
    order: ['size', 'size', 'removed', 'name'],
    hidden: ['name', 'kind', 'removed'],
    widths: { kind: 230.7, name: 900, size: '200' },
  });
  assert.deepEqual(layout.order, ['name', 'size', 'kind', 'date', 'status']);
  assert.deepEqual(layout.hidden, ['kind']);
  assert.equal(layout.widths.kind, 231);
  assert.equal(layout.widths.name, 800);
  assert.equal(layout.widths.size, 100);
  assert.deepEqual(readColumnLayout(columns, 'broken'), normalizeColumnLayout(columns));
  assert.deepEqual(readColumnLayout(columns, '{"version":2}'), normalizeColumnLayout(columns));
  assert.throws(() => normalizeColumnLayout([...columns, columns[0]]));
  assert.throws(() => normalizeColumnLayout([{ ...columns[0], minSize: -1 }]));
});
test('moves skip hidden and unavailable columns and cannot cross Name', () => {
  const layout = normalizeColumnLayout(columns, {
    version: 1,
    hidden: ['kind'],
    order: ['name', 'kind', 'size', 'status', 'date'],
  });
  assert.strictEqual(moveLayoutColumn(columns, layout, 'size', -1), layout);
  assert.strictEqual(moveLayoutColumn(columns, layout, 'name', 1), layout);
  assert.strictEqual(moveLayoutColumn(columns, layout, 'kind', 1), layout);
  const next = moveLayoutColumn(columns, layout, 'size', 1, ['name', 'kind', 'size', 'date']);
  assert.deepEqual(next.order, ['name', 'kind', 'date', 'status', 'size']);
  assert.deepEqual(next.widths, layout.widths);
});
test('header menus expose protected choices, visible ordering and defaults', () => {
  const layout = normalizeColumnLayout(columns);
  const calls: unknown[] = [];
  const menu = columnLayoutMenu(
    {
      columns,
      layout,
      setVisible: (...args) => calls.push(args),
      move: (...args) => calls.push(args),
      reset: () => calls.push('reset'),
    },
    'size',
  );
  assert.equal(menu.find((item) => item.id === 'layout-visible-name')?.disabled, true);
  const kind = menu.find((item) => item.id === 'layout-visible-kind');
  if (kind && 'onSelect' in kind) kind.onSelect?.();
  const reset = menu.find((item) => item.id === 'layout-reset');
  if (reset && 'onSelect' in reset) reset.onSelect?.();
  assert.deepEqual(calls, [['kind', false], 'reset']);
});

test('saved presets reject duplicate/reserved names and IDs and reconcile their snapshots', () => {
  const defaults = normalizeColumnLayout(columns);
  const reserved = [{ id: 'review', name: 'Review', layout: defaults, readOnly: true }];
  const parsed = readColumnLayoutPresets(
    columns,
    JSON.stringify({
      version: 1,
      presets: [
        {
          id: 'mine',
          name: '  My   layout ',
          layout: {
            version: 1,
            order: ['size', 'removed'],
            hidden: ['name', 'kind'],
            widths: { size: 99999 },
          },
        },
        { id: 'duplicate', name: 'MY LAYOUT', layout: defaults },
        { id: 'mine', name: 'Another', layout: defaults },
        { id: 'reserved', name: 'review', layout: defaults },
        { id: 'review', name: 'Other', layout: defaults },
        { id: 'future', name: 'Future', layout: { version: 2 } },
      ],
    }),
    reserved,
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, 'My layout');
  assert.equal(parsed[0].layout.order[0], 'name');
  assert.equal(parsed[0].layout.widths.size, 300);
  assert.deepEqual(parsed[0].layout.hidden, ['kind']);
  for (const text of ['broken', 'null', '[]', '{"version":2,"presets":[]}'])
    assert.deepEqual(readColumnLayoutPresets(columns, text), []);
});
