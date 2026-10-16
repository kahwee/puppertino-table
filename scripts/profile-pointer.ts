import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { build } from 'vite';
import type {} from '../tests/pointer-profile.fixture.js';

const bursts = process.env.PUPPERTINO_POINTER_BURSTS === '1';
const directory = bursts ? 'test-results/pointer-bursts' : 'test-results/pointer-profile';
await build({
  configFile: false,
  build: { outDir: directory, rollupOptions: { input: 'tests/pointer-profile.html' } },
  logLevel: 'error',
});
const root = path.resolve(directory);
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      'Content-Type',
      path.extname(file) === '.js'
        ? 'text/javascript'
        : path.extname(file) === '.css'
          ? 'text/css'
          : 'text/html',
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const samples: object[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const metrics = async () => {
    const result = await session.send('Performance.getMetrics');
    return Object.fromEntries(
      result.metrics.map((metric: { name: string; value: number }) => [metric.name, metric.value]),
    ) as Record<string, number>;
  };
  for (const mode of bursts ? ['immediate', 'frame'] : ['frame']) {
    for (const columns of [10, 40, 100]) {
      await page.goto(
        `http://127.0.0.1:${address.port}/tests/pointer-profile.html?columns=${columns}&mode=${mode}`,
      );
      const edge = page.getByRole('separator', { name: 'Resize Column 0 column', exact: true });
      await edge.waitFor();
      for (let run = 0; run < 4; run++) {
        const initialWidth = Number(await edge.getAttribute('aria-valuenow'));
        const rect = await edge.boundingBox();
        assert.ok(rect);
        const x = rect.x + rect.width / 2,
          y = rect.y + rect.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.evaluate(() => window.pointerProfile.reset());
        const before = await metrics();
        const delta = run % 2 ? -40 : 40;
        if (bursts) {
          // Synthetic high-rate input: eight updates per frame over thirty frames.
          // Real pointer capture starts/ends the gesture; no hardware-rate claim.
          await page.evaluate(
            async ({ x, y, delta }) => {
              const target = document.querySelector('[aria-label="Resize Column 0 column"]');
              if (!target) throw new Error('Missing resize handle');
              for (let frame = 0; frame < 30; frame++) {
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                for (let event = 1; event <= 8; event++) {
                  target.dispatchEvent(
                    new PointerEvent('pointermove', {
                      bubbles: true,
                      pointerId: window.pointerProfile.pointerId,
                      pointerType: 'mouse',
                      buttons: 1,
                      clientX: x + (delta * (frame * 8 + event)) / 240,
                      clientY: y,
                    }),
                  );
                }
              }
            },
            { x, y, delta },
          );
        } else await page.mouse.move(x + delta, y, { steps: 120 });
        await page.mouse.up();
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const after = await metrics();
        const snapshot = await page.evaluate(() => window.pointerProfile.snapshot());
        assert.equal(snapshot.cells, 0, 'Resizing must not render row cells');
        assert.ok(snapshot.durations.length > 0);
        assert.equal(Number(await edge.getAttribute('aria-valuenow')), initialWidth + delta);
        assert.equal(snapshot.commits, 1, 'Only completion persists');
        if (bursts) {
          assert.equal(snapshot.durations.length, 240);
          assert.ok(
            mode === 'immediate' ? snapshot.updates === 240 : snapshot.updates <= 30,
            'Frame batching applies at most one preview per burst',
          );
        }
        const sorted = snapshot.durations.toSorted((a, b) => a - b);
        const result = {
          mode,
          updates: snapshot.updates,
          commits: snapshot.commits,
          columns,
          rows: 100,
          run,
          events: sorted.length,
          cellRenders: snapshot.cells,
          dispatchMedianMs: sorted[Math.floor(sorted.length * 0.5)],
          dispatchP95Ms: sorted[Math.floor(sorted.length * 0.95)],
          taskMsPerEvent: ((after.TaskDuration - before.TaskDuration) * 1000) / sorted.length,
          layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
        };
        if (run > 0) samples.push(result);
        console.log(JSON.stringify({ ...result, warmup: run === 0 }));
      }
    }
  }
  await writeFile(
    `${directory}/results.json`,
    `${JSON.stringify(
      {
        browser: await browser.version(),
        cpuThrottle: 4,
        method: bursts
          ? 'Production build; 100 rows; 30 frames of eight synthetic pointermoves per frame; real mouse down/up; immediate versus frame-scheduled previews; one warmup and three samples. Synthetic burst stress, not hardware latency guarantees.'
          : 'Production build; 100 rows; 120 CDP mouse moves per drag; one warmup then three samples per column count. Dispatch timing covers capture-to-bubble JavaScript; CDP task/layout totals include browser work. Synthetic stress results, not hardware latency guarantees.',
        samples,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
