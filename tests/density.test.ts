import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DensityScope, densityStyle } from '../src/density.js';

test('density metrics generate scoped pixel tokens without altering caller styles', () => {
  assert.deepEqual(densityStyle(), {});
  assert.deepEqual(densityStyle({ rowHeight: 28, rowPaddingBlock: 0, iconSize: 18 }), {
    '--pt-row-height': '28px',
    '--pt-row-padding-block': '0px',
    '--pt-icon-size': '18px',
  });
  const html = renderToStaticMarkup(
    createElement(
      DensityScope,
      {
        density: 'compact',
        metrics: { rowHeight: 28 },
        style: { width: 400 },
      },
      'Items',
    ),
  );
  assert.match(html, /data-pt-density="compact"/);
  assert.match(html, /--pt-row-height:28px;width:400px/);
});
test('invalid density metrics are rejected', () => {
  for (const metrics of [
    { rowHeight: 0 },
    { iconSize: -1 },
    { rowPaddingBlock: -1 },
    { rowPaddingInline: Infinity },
    { iconSize: Number.NaN },
  ])
    assert.throws(() => densityStyle(metrics), RangeError);
});
