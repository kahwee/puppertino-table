import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ColumnBrowser, ColumnBrowserItem } from '../src/column-browser.js';

const panels = [
  { id: 'root', label: 'Root', content: 'Root entries' },
  { id: 'current', label: 'Current', content: 'Current entries' },
];
test('browser rendering is server-safe and controlled widths without callbacks stay read-only', () => {
  const html = renderToStaticMarkup(
    createElement(ColumnBrowser, { panels, ariaLabel: 'Folders', widths: { root: 300 } }),
  );
  assert.match(html, /flex-basis:300px/);
  assert.match(html, /aria-label="Current"/);
  assert.doesNotMatch(html, /role="separator"/);
});
test('browser schemas reject duplicate IDs and invalid width policies', () => {
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(ColumnBrowser, { panels: [panels[0], panels[0]], ariaLabel: 'Folders' }),
      ),
    /unique stable IDs/,
  );
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(ColumnBrowser, {
          panels,
          ariaLabel: 'Folders',
          minimumCurrentWidth: Number.NaN,
        }),
      ),
    RangeError,
  );
});
test('browser item selection, path indication and disabled state keep native button semantics', () => {
  const html = renderToStaticMarkup(
    createElement(
      ColumnBrowserItem,
      {
        selected: true,
        pathSelected: true,
        disabled: true,
      },
      'Example',
    ),
  );
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-current="location"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /^<button type="button"/);
});
