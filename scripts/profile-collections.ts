import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { nextItemId } from '../src/item-navigation.js';
import { applySelectionGesture } from '../src/selection-gestures.js';

// Fixed workloads and median samples make comparisons repeatable without brittle
// wall-clock assertions on shared CI runners. Compare reports on the same machine.
const iterations = 2000;
const samples = 7;
const results: { rows: number; operation: string; medianMs: number; samplesMs: number[] }[] = [];
for (const size of [100, 1000, 10000]) {
  const mutable = Array.from({ length: size }, (_, index) => `row-${index}`);
  const frozen = Object.freeze([...mutable]);
  const currentId = mutable[size - 2];
  const operations = {
    selection: () => applySelectionGesture(frozen, {}, null, currentId).anchor,
    'navigation-mutable': () => nextItemId({ orderedIds: mutable, currentId, key: 'ArrowDown' }),
    'navigation-frozen': () => nextItemId({ orderedIds: frozen, currentId, key: 'ArrowDown' }),
    'navigation-ignored': () => nextItemId({ orderedIds: frozen, currentId, key: 'Enter' }),
  };
  for (const [operation, run] of Object.entries(operations)) {
    const expected =
      operation === 'selection'
        ? currentId
        : operation === 'navigation-ignored'
          ? undefined
          : mutable.at(-1);
    for (let warmup = 0; warmup < 100; warmup++) assert.equal(run(), expected);
    const samplesMs: number[] = [];
    for (let sample = 0; sample < samples; sample++) {
      const started = performance.now();
      let result: string | null | undefined;
      for (let iteration = 0; iteration < iterations; iteration++) result = run();
      samplesMs.push(performance.now() - started);
      assert.equal(result, expected);
    }
    const medianMs = [...samplesMs].sort((a, b) => a - b)[Math.floor(samples / 2)];
    results.push({ rows: size, operation, medianMs, samplesMs });
  }
}
await mkdir('test-results/performance', { recursive: true });
await writeFile(
  'test-results/performance/collections.json',
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model,
      iterations,
      samples,
      results,
    },
    null,
    2,
  ),
);
console.table(results.map(({ samplesMs: _, ...result }) => result));
