import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitColumnBrowser, fitColumnPanels } from '../src/column-browser-layout.js';

test('independent panel widths reveal the nearest complete ancestors', () => {
  assert.deepEqual(fitColumnPanels(724, [180, 300, 224], 288), {
    currentWidth: 500,
    scrollLeft: 480,
    visibleAncestors: 1,
  });
  assert.deepEqual(fitColumnPanels(1000, [180, 300, 224], 288), {
    currentWidth: 296,
    scrollLeft: 0,
    visibleAncestors: 3,
  });
  assert.deepEqual(fitColumnPanels(280, [180, 300], 288), {
    currentWidth: 280,
    scrollLeft: 480,
    visibleAncestors: 0,
  });
});

const defaults = {
  availableWidth: 1216,
  ancestorWidth: 224,
  ancestorCount: 3,
  minimumCurrentWidth: 288,
};
test('spare room belongs to the current panel, never imaginary ancestors', () => {
  assert.deepEqual(fitColumnBrowser(defaults), {
    currentWidth: 544,
    scrollLeft: 0,
    visibleAncestors: 3,
  });
  assert.deepEqual(fitColumnBrowser({ ...defaults, ancestorCount: 0 }), {
    currentWidth: 1216,
    scrollLeft: 0,
    visibleAncestors: 0,
  });
});
test('narrow surfaces reveal complete panels and retain a fully visible current panel', () => {
  assert.deepEqual(fitColumnBrowser({ ...defaults, availableWidth: 724 }), {
    currentWidth: 500,
    scrollLeft: 448,
    visibleAncestors: 1,
  });
  assert.deepEqual(fitColumnBrowser({ ...defaults, availableWidth: 280 }), {
    currentWidth: 280,
    scrollLeft: 672,
    visibleAncestors: 0,
  });
  assert.deepEqual(fitColumnBrowser({ ...defaults, availableWidth: 512 }), {
    currentWidth: 288,
    scrollLeft: 448,
    visibleAncestors: 1,
  });
  assert.deepEqual(fitColumnBrowser({ ...defaults, availableWidth: 0 }), {
    currentWidth: 0,
    scrollLeft: 672,
    visibleAncestors: 0,
  });
});
test('invalid dimensions fail explicitly rather than publishing NaN geometry', () => {
  for (const patch of [
    { availableWidth: -1 },
    { availableWidth: Infinity },
    { ancestorWidth: 0 },
    { ancestorWidth: Number.NaN },
    { ancestorCount: 1.5 },
    { ancestorCount: -1 },
    { minimumCurrentWidth: -1 },
  ])
    assert.throws(() => fitColumnBrowser({ ...defaults, ...patch }), RangeError);
});
