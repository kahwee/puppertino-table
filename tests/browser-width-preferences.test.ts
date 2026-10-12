import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  browserWidthPreferences,
  mergeBrowserWidthPreferences,
} from '../src/browser-width-preferences.js';

test('browser preferences reject malformed shapes and invalid entries, round positive widths and bound retained IDs', () => {
  for (const value of [null, [], 40, 'widths'])
    assert.deepEqual(browserWidthPreferences(value), {});
  assert.deepEqual(
    browserWidthPreferences({
      root: 248.7,
      tiny: 0.2,
      negative: -1,
      invalid: NaN,
      text: '300',
      '': 220,
      ['x'.repeat(1025)]: 200,
    }),
    { root: 249, tiny: 1 },
  );
  const entries = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`panel-${i}`, 240]));
  assert.equal(Object.keys(browserWidthPreferences(entries)).length, 100);
  const merged = mergeBrowserWidthPreferences(browserWidthPreferences(entries), {
    'panel-20': 300,
    newest: 400,
  });
  assert.equal(merged['panel-20'], 300);
  assert.equal(merged.newest, 400);
  assert.equal(merged['panel-21'], undefined);
  assert.equal(Object.keys(merged).length, 100);
});
