import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { build } from 'vite';
import type {} from '../tests/pointer-profile.fixture.js';

const directory = 'test-results/pointer-profile';
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
  for (const columns of [10, 40, 100]) {
    await page.goto(
      `http://127.0.0.1:${address.port}/tests/pointer-profile.html?columns=${columns}`,
    );
    const edge = page.getByRole('separator', { name: 'Resize Column 0 column', exact: true });
    await edge.waitFor();
    for (let run = 0; run < 4; run++) {
      const rect = await edge.boundingBox();
      assert.ok(rect);
      const x = rect.x + rect.width / 2,
        y = rect.y + rect.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.evaluate(() => window.pointerProfile.reset());
      const before = await metrics();
      await page.mouse.move(x + (run % 2 ? -40 : 40), y, { steps: 120 });
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
      const sorted = snapshot.durations.toSorted((a, b) => a - b);
      const result = {
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
  await writeFile(
    `${directory}/results.json`,
    `${JSON.stringify(
      {
        browser: await browser.version(),
        cpuThrottle: 4,
        method:
          'Production build; 100 rows; 120 CDP mouse moves per drag; one warmup then three samples per column count. Dispatch timing covers capture-to-bubble JavaScript; CDP task/layout totals include browser work. Synthetic stress results, not hardware latency guarantees.',
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
