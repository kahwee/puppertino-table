import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { build } from 'vite';
import type {} from '../tests/column-profile.fixture.js';

const directory = 'test-results/column-profile';
await build({
  configFile: false,
  plugins: [
    {
      name: 'profile-only-render-counters',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/src/column-order.tsx')) {
          const marker = 'const drag = useContext(DragPreview);';
          assert.ok(code.includes(marker));
          return code.replace(marker, `window.columnProfile.headers++; ${marker}`);
        }
        if (id.endsWith('/src/column-layout-picker.tsx')) {
          return code.replace(
            'const persistence =',
            'window.columnProfile.pickers++; const persistence =',
          );
        }
      },
    },
  ],
  build: { outDir: directory, rollupOptions: { input: 'tests/column-profile.html' } },
  logLevel: 'error',
});
const root = path.resolve(directory);
const server = createServer(async (req, res) => {
  try {
    const file = path.resolve(root, `.${new URL(req.url || '/', 'http://localhost').pathname}`);
    if (!file.startsWith(root + path.sep)) return void res.writeHead(403).end();
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
  const metrics = async () =>
    Object.fromEntries(
      (await session.send('Performance.getMetrics')).metrics.map(
        (item: { name: string; value: number }) => [item.name, item.value],
      ),
    );
  const reset = () =>
    page.evaluate(() => {
      window.columnProfile = { headers: 0, pickers: 0, cells: 0, commits: 0 };
    });
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  for (const columns of [10, 40, 100]) {
    await page.goto(
      `http://127.0.0.1:${address.port}/tests/column-profile.html?columns=${columns}`,
    );
    const header = page.getByRole('button', { name: 'Sort by Column 1', exact: true });
    await header.waitFor();
    await page.waitForFunction(() => !document.querySelector('select')?.disabled);
    for (let run = 0; run < 4; run++) {
      const rect = await header.boundingBox();
      assert.ok(rect);
      const x = rect.x + rect.width / 2,
        y = rect.y + rect.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 10, y);
      await page.locator('[data-pt-dragging]').waitFor();
      await settle();
      await reset();
      const before = await metrics();
      // Move within one target: header chrome should not subscribe to the moving ghost.
      for (let step = 0; step < 60; step++) await page.mouse.move(x + 12 + (step % 15), y);
      await settle();
      const after = await metrics();
      const motion = await page.evaluate(() => window.columnProfile);
      assert.equal(motion.cells, 0, 'Previews must retain row rendering');
      assert.equal(motion.commits, 0, 'Previews must not persist');
      assert.ok(motion.headers <= 60, 'Only the active header subscribes to continuous motion');
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await settle();
      const resize = page.getByRole('separator', { name: 'Resize Column 0 column', exact: true });
      const edge = await resize.boundingBox();
      assert.ok(edge);
      const rx = edge.x + edge.width / 2,
        ry = edge.y + edge.height / 2;
      await page.mouse.move(rx, ry);
      await page.mouse.down();
      await settle();
      await reset();
      await page.mouse.move(rx + 30, ry, { steps: 30 });
      await settle();
      const sizing = await page.evaluate(() => window.columnProfile);
      assert.equal(sizing.cells, 0, 'Sizing previews must retain row rendering');
      assert.equal(sizing.headers, 0, 'Geometry changes must not rebuild header controls');
      assert.equal(sizing.pickers, 0, 'Width previews must not rerender the preset picker');
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await settle();
      const result = {
        columns,
        rows: 100,
        run,
        motion,
        sizing,
        taskMsPerMove: ((after.TaskDuration - before.TaskDuration) * 1000) / 60,
      };
      console.log(JSON.stringify({ ...result, warmup: run === 0 }));
      if (run > 0) samples.push(result);
    }
  }
  await writeFile(
    `${directory}/results.json`,
    `${JSON.stringify({ browser: await browser.version(), cpuThrottle: 4, samples }, null, 2)}\n`,
  );
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
