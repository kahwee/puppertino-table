import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPuppertinoColumnHelper, OutlineView, SplitView } from '../src/index.js';
import { validateOutlineItems } from '../src/use-outline.js';

type Item = { id: string; name: string; children?: Item[] };
const id = (item: Item) => item.id;
const children = (item: Item) => item.children;
test('outline identifiers reject duplicates and cycles before row-model construction', () => {
  const root: Item = { id: 'root', name: 'Root' };
  root.children = [root];
  assert.throws(() => validateOutlineItems([root], id, children), /globally unique/);
  assert.throws(
    () =>
      validateOutlineItems(
        [
          { id: 'a', name: 'A' },
          { id: 'a', name: 'Again' },
        ],
        id,
        children,
      ),
    /globally unique/,
  );
  validateOutlineItems(
    [{ id: 'root', name: 'Root', children: [{ id: 'child', name: 'Child' }] }],
    id,
    children,
  );
});
test('outline sorting preserves parents and orders each sibling group', () => {
  const helper = createPuppertinoColumnHelper<Item>();
  const data: Item[] = [
    {
      id: 'z',
      name: 'Z parent',
      children: [
        { id: 'zc', name: 'Z child' },
        { id: 'ac', name: 'A child' },
      ],
    },
    { id: 'a', name: 'A root' },
  ];
  const markup = renderToStaticMarkup(
    createElement(OutlineView<Item>, {
      data,
      columns: helper.columns([helper.accessor('name', { header: 'Name' })]),
      getRowId: id,
      getRowLabel: (item) => item.name,
      getChildren: children,
      initialExpanded: { z: true },
      initialSorting: [{ id: 'name', desc: false }],
      ariaLabel: 'Outline',
    }),
  );
  assert.match(markup, /role="treegrid"/);
  assert.ok(markup.indexOf('A root') < markup.indexOf('Z parent'));
  assert.ok(markup.indexOf('Z parent') < markup.indexOf('A child'));
  assert.ok(markup.indexOf('A child') < markup.indexOf('Z child'));
  assert.match(markup, /aria-level="2" aria-posinset="1" aria-setsize="2"/);
  const collapsed = renderToStaticMarkup(
    createElement(OutlineView<Item>, {
      data,
      columns: helper.columns([helper.accessor('name', { header: 'Name' })]),
      getRowId: id,
      getRowLabel: (item) => item.name,
      getChildren: children,
      ariaLabel: 'Outline',
    }),
  );
  assert.doesNotMatch(collapsed, /A child|Z child/);
});
test('split view validates pane identities and size bounds, including the detail pane', () => {
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(SplitView, {
          ariaLabel: 'Split',
          panes: [
            { id: 'same', label: 'A', content: 'A' },
            { id: 'same', label: 'B', content: 'B' },
          ],
        }),
      ),
    /unique/,
  );
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(SplitView, {
          ariaLabel: 'Split',
          panes: [
            { id: 'a', label: 'A', content: 'A' },
            { id: 'b', label: 'B', content: 'B', minSize: -10 },
          ],
        }),
      ),
    /Invalid|positive|size/i,
  );
  const markup = renderToStaticMarkup(
    createElement(SplitView, {
      ariaLabel: 'Split',
      orientation: 'vertical',
      panes: [
        { id: 'a', label: 'A', content: 'A' },
        { id: 'b', label: 'B', content: 'B' },
      ],
    }),
  );
  assert.match(markup, /aria-orientation="horizontal"/);
  assert.match(markup, /data-orientation="vertical"/);
});

test('outline row/cell hooks compose without replacing hierarchy and selection semantics', () => {
  const helper = createPuppertinoColumnHelper<Item>();
  const markup = renderToStaticMarkup(
    createElement(OutlineView<Item>, {
      data: [{ id: 'group', name: 'Group', children: [{ id: 'file', name: 'File' }] }],
      columns: helper.columns([helper.accessor('name', { header: 'Name' })]),
      getRowId: id,
      getRowLabel: (item) => item.name,
      getChildren: children,
      initialExpanded: { group: true },
      selectable: true,
      isRowSelectable: (item) => !item.children,
      ariaLabel: 'Hooked outline',
      getRowProps: (row) => ({ 'data-item': row.id, role: 'button', className: 'custom-row' }),
      getCellProps: () => ({ 'data-cell': 'name' }),
    }),
  );
  assert.match(markup, /data-item="file"/);
  assert.match(markup, /data-cell="name"/);
  assert.match(markup, /custom-row/);
  assert.doesNotMatch(markup, /role="button"/);
  assert.match(markup, /aria-level="2"/);
  assert.match(markup, /aria-label="Select Group"[^>]*disabled/);
  assert.doesNotMatch(markup, /aria-label="Select File"[^>]*disabled/);
});
