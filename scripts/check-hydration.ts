import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { createServer as createViteServer } from 'vite';
import type { hydrate } from '../tests/sizing-hydration.fixture.js';

declare global {
  interface Window {
    sizing: Awaited<ReturnType<typeof hydrate>>;
  }
}
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
const fixture = await vite.ssrLoadModule('/tests/sizing-hydration.fixture.tsx');
const html = fixture.serverHTML() as string;
assert.match(html, />150</);
const server = createServer(async (req, res) => {
  if (req.url === '/__sizing') {
    res.setHeader('Content-Type', 'text/html');
    res.end(
      await vite.transformIndexHtml(
        '/__sizing',
        `<div id="root">${html}</div><script type="module">import { hydrate } from '/tests/sizing-hydration.fixture.tsx'; window.sizing = await hydrate();</script>`,
      ),
    );
  } else vite.middlewares(req, res);
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => console.error(error.message));
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('a', '{"name":300,"stale":500}');
    localStorage.setItem('b', '{"name":900}');
    localStorage.setItem('invalid', '{broken');
    localStorage.setItem('nonnumeric', '{"name":"bad"}');
  });
  await page.goto(`http://127.0.0.1:${address.port}/__sizing`);
  const width = (value: number) =>
    page.waitForFunction(
      (expected) => document.getElementById('width')?.textContent === String(expected),
      value,
    );
  await width(300);
  assert.match(await page.evaluate(() => window.sizing.firstHTML), />150</);
  assert.deepEqual(await page.evaluate(() => window.sizing.errors), []);
  for (const [key, expected] of [
    ['b', 400],
    ['invalid', 150],
    ['nonnumeric', 150],
    ['missing', 150],
  ] as const) {
    await page.evaluate((key) => window.sizing.key(key), key);
    await width(expected);
  }
  await page.evaluate(() => window.sizing.mode('controlled'));
  await width(220);
  await page.evaluate(() => window.sizing.key('a'));
  await width(220);
  await page.evaluate(() => window.sizing.resize(260));
  await width(260);
  assert.equal(await page.evaluate(() => window.sizing.updates()), 1);
  await page.evaluate(() => window.sizing.widths({ name: 180 }));
  await width(180);
  await page.evaluate(() => window.sizing.mode('readonly'));
  await page.evaluate(() => window.sizing.resize(330));
  await width(180);
  assert.equal(await page.evaluate(() => window.sizing.updates()), 1);
  assert.equal(await page.evaluate(() => localStorage.getItem('a')), '{"name":300,"stale":500}');
  await page.evaluate(() => window.sizing.mode('local'));
  await width(300);
  await page.evaluate(() => window.sizing.resize(280));
  await width(280);
  await page.evaluate(() => window.sizing.adapter(true));
  await width(310);
  await page.evaluate(() => window.sizing.adapter(false));
  await width(300);
  const blocked = await browser.newPage();
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await blocked.goto(`http://127.0.0.1:${address.port}/__sizing`);
  await blocked.waitForFunction(() => !!window.sizing);
  assert.equal(await blocked.locator('#width').textContent(), '150');
  assert.deepEqual(await blocked.evaluate(() => window.sizing.errors), []);
  await blocked.close();
  assert.deepEqual(errors, []);
  console.log(
    'SSR hydration, persisted key changes, invalid preferences, controlled updater and read-only sizing passed.',
  );
} finally {
  await browser.close();
  await vite.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
