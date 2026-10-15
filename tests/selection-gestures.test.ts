import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applySelectionGesture } from '../src/selection-gestures.js';

const ids = ['folder', 'a', 'b', 'c', 'd'];
test('item selection replaces and toggles without changing caller inputs', () => {
  const selection = Object.freeze({ folder: true, offPage: true });
  assert.deepEqual(applySelectionGesture(ids, selection, 'folder', 'c'), {
    selection: { c: true },
    anchor: 'c',
  });
  assert.deepEqual(applySelectionGesture(ids, selection, 'folder', 'c', { toggle: true }), {
    selection: { folder: true, offPage: true, c: true },
    anchor: 'c',
  });
  assert.deepEqual(applySelectionGesture(ids, selection, 'folder', 'folder', { toggle: true }), {
    selection: { offPage: true },
    anchor: 'folder',
  });
});

test('Shift ranges extend and shrink from the original anchor in either direction', () => {
  const wide = applySelectionGesture(ids, { a: true }, 'a', 'd', { shift: true });
  assert.deepEqual(wide, { selection: { a: true, b: true, c: true, d: true }, anchor: 'a' });
  assert.deepEqual(applySelectionGesture(ids, wide.selection, wide.anchor, 'b', { shift: true }), {
    selection: { a: true, b: true },
    anchor: 'a',
  });
  assert.deepEqual(applySelectionGesture(ids, { d: true }, 'd', 'folder', { shift: true }), {
    selection: { folder: true, a: true, b: true, c: true, d: true },
    anchor: 'd',
  });
  assert.deepEqual(
    applySelectionGesture(ids, { offPage: true }, 'a', 'c', { shift: true, toggle: true }),
    {
      selection: { offPage: true, a: true, b: true, c: true },
      anchor: 'a',
    },
  );
});

test('unknown IDs do nothing and a stale anchor becomes the clicked item', () => {
  const selection = { offPage: true } as const;
  const unknown = applySelectionGesture(ids, selection, 'a', 'missing', { shift: true });
  assert.equal(unknown.selection, selection);
  assert.equal(unknown.anchor, 'a');
  assert.deepEqual(applySelectionGesture(ids, selection, 'offPage', 'b', { shift: true }), {
    selection: { b: true },
    anchor: 'b',
  });
});

test('caller IDs are treated as data, including empty and prototype-like keys', () => {
  const order = ['', '__proto__', 'constructor', '__proto__'];
  const result = applySelectionGesture(order, {}, '', 'constructor', { shift: true });
  assert.deepEqual(Object.keys(result.selection), ['', '__proto__', 'constructor']);
  assert.equal(Object.getPrototypeOf(result.selection), Object.prototype);
  assert.deepEqual(
    applySelectionGesture(order, {}, null, '__proto__', { toggle: true }).selection,
    {
      ['__proto__']: true,
    },
  );
});

test('duplicate IDs retain first-occurrence range order in both directions', () => {
  const order = Object.freeze(['a', 'b', 'a', 'c', 'b', 'd']);
  for (const [anchor, target] of [
    ['a', 'c'],
    ['c', 'a'],
  ]) {
    const result = applySelectionGesture(order, { offPage: true }, anchor, target, {
      shift: true,
    });
    assert.deepEqual(result, { selection: { a: true, b: true, c: true }, anchor });
  }
  assert.deepEqual(applySelectionGesture(order, {}, 'missing', 'b', { shift: true }), {
    selection: { b: true },
    anchor: 'b',
  });
});
