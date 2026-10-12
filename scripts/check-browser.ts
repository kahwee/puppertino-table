import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import axe from 'axe-core';

async function serve(directory: string, mount = '/') {
  const root = path.resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (!pathname.startsWith(mount)) { response.writeHead(404).end(); return; }
      const relative = pathname.slice(mount.length) || 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
      const bytes = await readFile(file); response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); response.end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  return { base: `http://127.0.0.1:${address.port}${mount.slice(0, -1)}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
const demo = await serve('demo-dist'); const stories = await serve('storybook-static', '/puppertino-table/');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()) });
const evidence = 'test-results/browser'; await mkdir(evidence, { recursive: true });
const errors: string[] = [];
try {
  for (const theme of process.env.PUPPERTINO_STORIES_ONLY ? [] : ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(demo.base); if (theme === 'dark') await page.getByRole('button', { name: 'Use dark theme' }).click();
    const checks = page.getByRole('checkbox', { name: /^Select Person/ });
    await checks.nth(1).click(); await checks.nth(4).click({ modifiers: ['Shift'] });
    assert.equal(await page.getByLabel('Selection count').textContent(), '4 selected');
    await checks.nth(2).click({ modifiers: ['Shift'] }); assert.equal(await page.getByLabel('Selection count').textContent(), '1 selected');
    await checks.nth(6).focus(); await checks.nth(6).press('Space'); assert.equal(await page.getByLabel('Selection count').textContent(), '2 selected');
    await checks.nth(6).evaluate(el => { (window as any).__checkbox = el; (window as any).__cell = document.querySelector('tbody td'); });
    for (const label of ['Name', 'Team', 'Score', 'Status']) {
      const handle = page.getByRole('separator', { name: `Resize ${label} column`, exact: true });
      const width = async () => Number(await handle.getAttribute('aria-valuenow'));
      const initial = await width();
      const drag = async (delta: number) => {
        await handle.scrollIntoViewIfNeeded(); const box = (await handle.boundingBox())!;
        await page.mouse.move(box.x + 6, box.y + box.height / 2); await page.mouse.down();
        await page.mouse.move(box.x + 6 + delta, box.y + box.height / 2, { steps: 2 }); await page.mouse.up();
      };
      for (let index = 0; index < 64; index++) await drag(index % 2 ? -12 : 12);
      assert.equal(await width(), initial, '512 total pointer drags have no drift');
      await drag(40); assert.equal(await width(), initial + 40);
      const geometry = await handle.evaluate(el => {
        const header = el.closest('th')!; const table = el.closest('table')!; const index = [...header.parentElement!.children].indexOf(header);
        return [header.getBoundingClientRect().width, table.querySelector('tbody tr')!.children[index].getBoundingClientRect().width];
      }); assert.ok(Math.abs(geometry[0] - (initial + 40)) < 1 && Math.abs(geometry[0] - geometry[1]) < 1);
      await handle.focus(); await handle.press('Home'); assert.equal(await width(), Number(await handle.getAttribute('aria-valuemin')));
      await handle.press('ArrowLeft'); assert.equal(await width(), Number(await handle.getAttribute('aria-valuemin')));
      await handle.press('End'); assert.equal(await width(), Number(await handle.getAttribute('aria-valuemax')));
      await handle.press('ArrowRight'); assert.equal(await width(), Number(await handle.getAttribute('aria-valuemax')));
      await handle.press('Enter'); assert.equal(await width(), initial);
      await handle.scrollIntoViewIfNeeded(); let box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + 6, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 66, box.y + box.height / 2);
      await page.keyboard.press('Escape'); await page.mouse.up(); assert.equal(await width(), initial);
      await drag(24); await handle.dblclick(); assert.equal(await width(), initial);
      await drag(24);
    }
    assert.ok(await checks.nth(6).evaluate(el => el === (window as any).__checkbox && document.querySelector('tbody td') === (window as any).__cell));
    assert.equal(await page.getByLabel('Selection count').textContent(), '2 selected');
    const name = page.getByRole('separator', { name: 'Resize Name column' });
    await page.reload(); await name.waitFor(); assert.equal(Number(await name.getAttribute('aria-valuenow')), 264);
    if (theme === 'dark') await page.getByRole('button', { name: 'Use dark theme' }).click();
    await name.scrollIntoViewIfNeeded(); const box = (await name.boundingBox())!;
    await page.mouse.move(box.x + 6, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 66, box.y + box.height / 2);
    await page.getByRole('button', { name: 'Unmount table' }).evaluate(el => (el as HTMLButtonElement).click()); await page.mouse.up();
    assert.equal(await page.locator('.pt-resizing').count(), 0);
    await page.getByRole('button', { name: 'Mount table' }).click(); assert.equal(Number(await name.getAttribute('aria-valuenow')), 264, 'unmount does not save unfinished changes');
    await page.getByRole('checkbox', { name: 'Disabled', exact: true }).check();
    assert.equal(await page.getByRole('separator').count(), 0); assert.equal(await checks.first().isDisabled(), true);
    await page.getByRole('checkbox', { name: 'Disabled', exact: true }).uncheck();
    for (const label of ['Name', 'Team', 'Score', 'Status']) {
      for (let direction = 0; direction < 2; direction++) {
        await page.getByRole('button', { name: `Sort by ${label}` }).click();
        const seen: string[] = [];
        for (let index = 0; index < 6; index++) {
          seen.push(...await page.locator('tbody tr').evaluateAll(rows => rows.map(row => row.children[1].textContent!)));
          if (index < 5) await page.getByRole('button', { name: 'Next page', exact: true }).click();
        }
        assert.equal(seen.length, 267); assert.equal(new Set(seen).size, 267, 'all pages preserve stable row identities');
        for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Previous page', exact: true }).click();
      }
    }
    await page.addScriptTag({ content: axe.source });
    for (const width of [1440, 900, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const violations = await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
      assert.deepEqual(violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => ({ target: n.target, summary: n.failureSummary })) })), [], `${theme}-${width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${evidence}/${theme}-${width}.png` });
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${stories.base}/?path=/story/puppertino-table--default`);
  await page.frameLocator('#storybook-preview-iframe').getByRole('table').waitFor();
  await page.getByRole('link', { name: 'Default', exact: true }).waitFor();
  await page.screenshot({ path: `${evidence}/storybook-pages.png` });
  for (const story of ['default', 'selection', 'keyboard-resize', 'dark', 'narrow', 'empty', 'disabled', 'read-only', 'server-owned-order', 'different-schema', 'grouped-headers', 'standalone-resize']) {
    await page.goto(`${stories.base}/iframe.html?id=puppertino-table--${story}&viewMode=story`);
    await page.getByRole('table').waitFor();
    assert.equal(await page.locator('#storybook-root').getByRole('table').count(), 1);
    if (story === 'selection') await page.waitForFunction(() => document.querySelector('output')?.textContent === '4 selected');
    if (story === 'default') await page.waitForFunction(() => document.querySelector('th[aria-sort]')?.getAttribute('aria-sort') === 'ascending');
    if (story === 'grouped-headers') {
      assert.ok(await page.locator('thead tr').count() >= 2);
      assert.ok(await page.getByRole('columnheader', { name: 'Identity', exact: true }).isVisible());
      assert.equal(await page.getByRole('separator', { name: 'Resize Name column', exact: true }).count(), 1);
    }
    if (story === 'empty') assert.ok(await page.getByText('No people match this view.').isVisible());
    if (story === 'disabled') assert.equal(await page.getByRole('checkbox').first().isDisabled(), true);
    if (story === 'different-schema') assert.ok(await page.getByRole('table', { name: 'Inventory' }).isVisible());
    if (story === 'standalone-resize') {
      assert.equal(await page.getByRole('separator').count(), 2, 'only two leaf headers expose standalone handles');
      assert.equal(await page.getByRole('separator', { name: 'Resize identity column', exact: true }).count(), 0);
      const handle = page.getByRole('separator', { name: 'Resize name column', exact: true });
      const initial = Number(await handle.getAttribute('aria-valuenow'));
      await handle.scrollIntoViewIfNeeded(); const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + 6, box.y + box.height / 2); await page.mouse.down();
      await page.mouse.move(box.x + 66, box.y + box.height / 2);
      assert.equal(Number(await page.getByLabel('Standalone name width').textContent()), initial + 60);
      await page.getByRole('button', { name: 'Remove resize controls', exact: true }).evaluate(el => (el as HTMLButtonElement).click());
      await page.mouse.up();
      assert.equal(Number(await page.getByLabel('Standalone name width').textContent()), initial, 'removing controls cancels preview sizing in a surviving table');
      assert.equal(await page.locator('.pt-resizing').count(), 0);
      await page.getByRole('button', { name: 'Mount resize controls', exact: true }).click();
      await handle.focus(); await handle.press('ArrowRight');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), initial + 16, 'remounted controls remain usable');
    }
  }
  await page.close(); assert.deepEqual(errors, []);
  console.log(process.env.PUPPERTINO_STORIES_ONLY ? 'Twelve Storybook stories including standalone-control cancellation passed.' : '512 repeated pointer drags, geometry, limits, keyboard/reset/cancellation/persistence, selection, disabled/unmount recovery, standalone-control cancellation, 267 rows across six pages, six light/dark axe layouts and twelve Storybook stories passed.');
} finally { await browser.close(); await demo.close(); await stories.close(); }
