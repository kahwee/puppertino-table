import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PuppertinoTable } from '../src/index.js';
import { isCompositionKey } from '../src/item-navigation.js';

const props = {
  data: [{ id: 'a', name: 'Alpha' }],
  columns: [{ accessorKey: 'name', header: 'Name' }],
  getRowId: (row: { id: string; name: string }) => row.id,
  ariaLabel: 'Inventory',
};
test('virtualization is opt-in and keeps native semantics without rendering the full server dataset', () => {
  assert.match(
    renderToStaticMarkup(createElement(PuppertinoTable<{ id: string; name: string }>, props)),
    /Alpha/,
  );
  const html = renderToStaticMarkup(
    createElement(PuppertinoTable<{ id: string; name: string }>, {
      ...props,
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        name: `Resource ${i + 1}`,
      })),
      virtualization: { height: 400 },
    }),
  );
  assert.match(html, /aria-rowcount="1001"/);
  assert.doesNotMatch(html, /NaN|Resource 1000/);
  assert.ok((html.match(/data-virtual-row=/g) ?? []).length > 0);
  assert.ok((html.match(/data-virtual-row=/g) ?? []).length < 50);
});
test('invalid geometry and unsupported custom leading rows fail explicitly', () => {
  for (const virtualization of [
    { height: 0 },
    { height: Number.NaN },
    { height: 400, overscan: -1 },
    { height: 400, estimateRowHeight: 0 },
  ])
    assert.throws(
      () =>
        renderToStaticMarkup(
          createElement(PuppertinoTable<{ id: string; name: string }>, {
            ...props,
            virtualization,
          }),
        ),
      /Virtualization/,
    );
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(PuppertinoTable<{ id: string; name: string }>, {
          ...props,
          virtualization: { height: 400 },
          leadingRows: createElement('tr'),
        }),
      ),
    /leadingRows/,
  );
});
test('modern composition and legacy 229 events retain input-method ownership', () => {
  assert.equal(isCompositionKey({ isComposing: true }), true);
  assert.equal(isCompositionKey({ keyCode: 229 }), true);
  assert.equal(isCompositionKey({ isComposing: false, keyCode: 40 }), false);
});
