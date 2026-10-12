import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import type { hydrate } from '../tests/browser-preferences.fixture.js';

declare global {
  interface Window {
    browserPreferences: Awaited<ReturnType<typeof hydrate>>;
  }
}
export async function checkBrowserPreferences(page: Page, base: string) {
  await page.addInitScript(() => {
    localStorage.setItem('browser-a', '{"root":9999,"branch":310,"hidden":280,"bad":"invalid"}');
    localStorage.setItem('browser-b', '{"root":280}');
  });
  await page.goto(`${base}/__browser`);
  const root = page.getByRole('separator', { name: 'Resize Root panel', exact: true });
  const branch = page.getByRole('separator', { name: 'Resize Branch panel', exact: true });
  const width = (expected: number) =>
    page.waitForFunction(
      (value) =>
        document.querySelector('.pt-panel-resizer')?.getAttribute('aria-valuenow') ===
        String(value),
      expected,
      { timeout: 15000 },
    );
  await width(400);
  assert.match(await page.evaluate(() => window.browserPreferences.firstHTML), /flex-basis:224px/);
  assert.deepEqual(await page.evaluate(() => window.browserPreferences.errors), []);
  assert.ok(
    (await page.evaluate(() => localStorage.getItem('browser-a')))?.includes('9999'),
    'Hydration does not rewrite stored preferences',
  );
  await root.press('ArrowLeft');
  await width(384);
  assert.deepEqual(
    JSON.parse((await page.evaluate(() => localStorage.getItem('browser-a'))) || '{}'),
    { hidden: 280, root: 384, branch: 310 },
  );
  await branch.press('ArrowRight');
  const saved = await page.evaluate(() => localStorage.getItem('browser-a'));
  const bounds = await branch.boundingBox();
  assert.ok(bounds);
  await page.mouse.move(bounds.x + 4, bounds.y + 30);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 64, bounds.y + 30);
  await page.evaluate(() => window.browserPreferences.branch(false));
  await page.mouse.up();
  assert.equal(await page.evaluate(() => localStorage.getItem('browser-a')), saved);
  await root.press('ArrowLeft');
  await page.evaluate(() => window.browserPreferences.branch(true));
  assert.equal(await branch.getAttribute('aria-valuenow'), '326');
  assert.equal(
    JSON.parse((await page.evaluate(() => localStorage.getItem('browser-a'))) || '{}').branch,
    326,
  );
  await page.evaluate(() => window.browserPreferences.key('browser-b'));
  await width(280);
  const bSaved = await page.evaluate(() => localStorage.getItem('browser-b'));
  const rootBounds = await root.boundingBox();
  assert.ok(rootBounds);
  await page.mouse.move(rootBounds.x + 4, rootBounds.y + 30);
  await page.mouse.down();
  await page.mouse.move(rootBounds.x + 60, rootBounds.y + 30);
  await page.evaluate(() => window.browserPreferences.key('browser-a'));
  await page.mouse.up();
  await width(368);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('browser-b')),
    bSaved,
    'Changing keys cancels previews without saving to either key',
  );
  const aSaved = await page.evaluate(() => localStorage.getItem('browser-a'));
  await page.evaluate(() => window.browserPreferences.mode('controlled'));
  await width(260);
  await root.press('ArrowRight');
  await width(276);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('browser-a')),
    aSaved,
    'Controlled widths ignore automatic persistence',
  );
  await page.evaluate(() => window.browserPreferences.mode('readonly'));
  await page.waitForFunction(
    () => document.querySelectorAll('.pt-panel-resizer').length === 0,
    undefined,
    { timeout: 15000 },
  );
  assert.equal(await page.getByRole('separator').count(), 0);
  await page.evaluate(() => window.browserPreferences.mode('local'));
  await width(368);
  await page.evaluate(() => window.browserPreferences.adapter('alternate'));
  await width(330);
  await page.evaluate(() => window.browserPreferences.adapter('unavailable'));
  await width(224);
  const commits = await page.evaluate(() => window.browserPreferences.commits());
  await root.press('ArrowRight');
  await width(240);
  assert.equal(
    await page.evaluate(() => window.browserPreferences.commits()),
    commits + 1,
    'Storage failure does not suppress completion callbacks',
  );
  assert.deepEqual(await page.evaluate(() => window.browserPreferences.errors), []);
  console.log(
    'Browser preferences passed: SSR hydration, clamps, hidden panels, cancelled previews, key/adapter changes, controlled ownership and unavailable storage.',
  );
}
