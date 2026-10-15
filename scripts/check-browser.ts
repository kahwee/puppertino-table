import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import axe from 'axe-core';
import { chromium } from 'playwright';
import { checkFinderStories } from './check-finder-stories.js';
import { checkOutlineViews } from './check-outline-views.js';
import { checkResizeEvents } from './check-resize-events.js';
import { checkResourceWorkspaces } from './check-resource-workspaces.js';
import { checkStorybookDocs } from './check-storybook-docs.js';
import { checkStorybookInteractions } from './check-storybook-interactions.js';
import { storyQuery } from './story-presets.mjs';
import { setStorybookTheme } from './storybook-theme.mjs';

async function serve(directory: string, mount = '/') {
  const root = path.resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (!pathname.startsWith(mount)) {
        response.writeHead(404).end();
        return;
      }
      const relative = pathname.slice(mount.length) || 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
      };
      const bytes = await readFile(file);
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    base: `http://127.0.0.1:${address.port}${mount.slice(0, -1)}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
const demo = await serve('demo-dist');
const stories = await serve('storybook-static', '/puppertino-table/');
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),
});
const evidence = 'test-results/browser';
await mkdir(evidence, { recursive: true });
const errors: string[] = [];
async function checkDemo() {
  const started = performance.now();
  for (const theme of process.env.PUPPERTINO_STORIES_ONLY ? [] : ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(demo.base);
    if (theme === 'dark') await page.getByRole('button', { name: 'Use dark theme' }).click();
    const nativeGeometry = await page.evaluate(() => {
      const table = document.querySelector<HTMLTableElement>('.pt-table')!;
      const native = document.createElement('table');
      native.className = 'p-table';
      native.style.cssText = 'position:fixed;left:-10000px;top:0';
      native.innerHTML =
        '<thead><tr><th scope="col">Native</th><th scope="col" aria-sort="ascending">Sorted</th></tr></thead><tbody><tr><td>First</td><td>Second</td></tr></tbody>';
      table.parentElement!.append(native);
      const header = table.querySelector<HTMLTableCellElement>('th:not(.pt-selection)')!;
      const reference = native.querySelectorAll('th')[header.hasAttribute('aria-sort') ? 1 : 0];
      const actual = getComputedStyle(table);
      const expected = getComputedStyle(native);
      const result = {
        borders: [actual.borderCollapse, expected.borderCollapse],
        spacing: [actual.borderSpacing, expected.borderSpacing],
        corners: [
          getComputedStyle(table.querySelector('tbody td')!).borderTopLeftRadius,
          getComputedStyle(native.querySelector('td')!).borderTopLeftRadius,
        ],
        header: [header.getBoundingClientRect().height, reference.getBoundingClientRect().height],
        weight: [getComputedStyle(header).fontWeight, getComputedStyle(reference).fontWeight],
      };
      native.remove();
      return result;
    });
    for (const [property, [actual, expected]] of Object.entries(nativeGeometry))
      assert.equal(actual, expected, `${theme}: shared ${property} matches Puppertino`);
    await page.evaluate(() => {
      document.body.dataset.checkboxBubbles = '0';
      document.body.addEventListener('click', () => {
        document.body.dataset.checkboxBubbles = String(
          Number(document.body.dataset.checkboxBubbles) + 1,
        );
      });
    });
    const selectAll = page.getByRole('checkbox', { name: 'Select all visible rows' });
    await selectAll.locator('..').dispatchEvent('click');
    assert.equal(await selectAll.isChecked(), true, 'header label selects the visible page');
    await selectAll.locator('..').dispatchEvent('click');
    assert.equal(await selectAll.isChecked(), false, 'header label clears the visible page');
    assert.equal(
      await page.locator('body').getAttribute('data-checkbox-bubbles'),
      '0',
      'header label activation does not reach parent commands',
    );
    const checks = page.getByRole('checkbox', { name: /^Select Person/ });
    await checks.nth(1).click();
    await checks.nth(4).click({ modifiers: ['Shift'] });
    assert.equal(await page.getByLabel('Selection count').textContent(), '4 selected');
    await checks.nth(2).click({ modifiers: ['Shift'] });
    assert.equal(await page.getByLabel('Selection count').textContent(), '2 selected');
    await checks.nth(6).focus();
    await checks.nth(6).press('Space');
    assert.equal(await page.getByLabel('Selection count').textContent(), '3 selected');
    await checks.nth(6).evaluate((el) => {
      (window as any).__checkbox = el;
      (window as any).__cell = document.querySelector('tbody td');
    });
    for (const label of ['Name', 'Team', 'Score', 'Status']) {
      const handle = page.getByRole('separator', { name: `Resize ${label} column`, exact: true });
      const width = async () => Number(await handle.getAttribute('aria-valuenow'));
      const initial = await width();
      const drag = async (delta: number) => {
        await handle.scrollIntoViewIfNeeded();
        const box = (await handle.boundingBox())!;
        await page.mouse.move(box.x + 6, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 6 + delta, box.y + box.height / 2, { steps: 2 });
        await page.mouse.up();
      };
      for (let index = 0; index < 64; index++) await drag(index % 2 ? -12 : 12);
      assert.equal(await width(), initial, '512 total pointer drags have no drift');
      await drag(40);
      assert.equal(await width(), initial + 40);
      const geometry = await handle.evaluate((el) => {
        const header = el.closest('th')!;
        const table = el.closest('table')!;
        const index = [...header.parentElement!.children].indexOf(header);
        return [
          header.getBoundingClientRect().width,
          table.querySelector('tbody tr')!.children[index].getBoundingClientRect().width,
        ];
      });
      assert.ok(
        Math.abs(geometry[0] - (initial + 40)) < 1 && Math.abs(geometry[0] - geometry[1]) < 1,
      );
      await handle.focus();
      await handle.press('Home');
      assert.equal(await width(), Number(await handle.getAttribute('aria-valuemin')));
      await handle.press('ArrowLeft');
      assert.equal(await width(), Number(await handle.getAttribute('aria-valuemin')));
      await handle.press('End');
      assert.equal(await width(), Number(await handle.getAttribute('aria-valuemax')));
      await handle.press('ArrowRight');
      assert.equal(await width(), Number(await handle.getAttribute('aria-valuemax')));
      await handle.press('Enter');
      assert.equal(await width(), initial);
      await handle.scrollIntoViewIfNeeded();
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + 6, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 66, box.y + box.height / 2);
      await page.keyboard.press('Escape');
      await page.mouse.up();
      assert.equal(await width(), initial);
      await drag(24);
      await handle.dblclick();
      assert.equal(await width(), initial);
      await drag(24);
    }
    assert.ok(
      await checks
        .nth(6)
        .evaluate(
          (el) =>
            el === (window as any).__checkbox &&
            document.querySelector('tbody td') === (window as any).__cell,
        ),
    );
    assert.equal(await page.getByLabel('Selection count').textContent(), '3 selected');
    const name = page.getByRole('separator', { name: 'Resize Name column' });
    await page.reload();
    await name.waitFor();
    assert.equal(Number(await name.getAttribute('aria-valuenow')), 264);
    if (theme === 'dark') await page.getByRole('button', { name: 'Use dark theme' }).click();
    await name.scrollIntoViewIfNeeded();
    const box = (await name.boundingBox())!;
    await page.mouse.move(box.x + 6, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 66, box.y + box.height / 2);
    await page
      .getByRole('button', { name: 'Unmount table' })
      .evaluate((el) => (el as HTMLButtonElement).click());
    await page.mouse.up();
    assert.equal(await page.locator('.pt-resizing').count(), 0);
    await page.getByRole('button', { name: 'Mount table' }).click();
    assert.equal(
      Number(await name.getAttribute('aria-valuenow')),
      264,
      'unmount does not save unfinished changes',
    );
    await page.getByRole('checkbox', { name: 'Disabled', exact: true }).check();
    assert.equal(await page.getByRole('separator').count(), 0);
    assert.equal(await checks.first().isDisabled(), true);
    await page.getByRole('checkbox', { name: 'Disabled', exact: true }).uncheck();
    for (const label of ['Name', 'Team', 'Score', 'Status']) {
      for (let direction = 0; direction < 2; direction++) {
        await page.getByRole('button', { name: `Sort by ${label}` }).click();
        const seen: string[] = [];
        for (let index = 0; index < 6; index++) {
          seen.push(
            ...(await page
              .locator('tbody tr')
              .evaluateAll((rows) => rows.map((row) => row.children[1].textContent!))),
          );
          if (index < 5) await page.getByRole('button', { name: 'Next page', exact: true }).click();
        }
        assert.equal(seen.length, 267);
        assert.equal(new Set(seen).size, 267, 'all pages preserve stable row identities');
        for (let index = 0; index < 5; index++)
          await page.getByRole('button', { name: 'Previous page', exact: true }).click();
      }
    }
    await page.addScriptTag({ content: axe.source });
    for (const width of [1440, 900, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const violations = await page.evaluate(
        async () =>
          (
            await (window as any).axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
            })
          ).violations,
      );
      assert.deepEqual(
        violations.map((v: any) => ({
          id: v.id,
          nodes: v.nodes.map((n: any) => ({ target: n.target, summary: n.failureSummary })),
        })),
        [],
        `${theme}-${width}`,
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${evidence}/${theme}-${width}.png` });
    }
    await page.close();
  }
  console.log(
    `Demo browser checks completed in ${((performance.now() - started) / 1000).toFixed(1)}s`,
  );
}

async function checkStories() {
  const started = performance.now();
  await checkStorybookInteractions(browser, stories.base);
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${stories.base}/?path=/story/puppertino-table--default`);
  await page.frameLocator('#storybook-preview-iframe').getByRole('table').waitFor();
  await page.getByRole('link', { name: 'Playground', exact: true }).waitFor();
  for (const name of ['State ownership', 'Date Columns']) {
    assert.equal(await page.getByRole('link', { name, exact: true }).count(), 1);
  }
  for (const name of ['Dark', 'Narrow', 'Keyboard Resize', 'Controlled Sizing']) {
    assert.equal(await page.getByRole('link', { name, exact: true }).count(), 0);
  }
  await page.screenshot({ path: `${evidence}/storybook-pages.png` });
  for (const story of [
    'default',
    'selection',
    'paginated-selection',
    'external-atoms',
    'keyboard-resize',
    'controlled-sizing',
    'narrow',
    'empty',
    'disabled',
    'read-only',
    'server-owned-order',
    'different-schema',
    'grouped-headers',
    'standalone-resize',
    'customized-rows',
    'leading-rows-when-empty',
    'hook-layout',
    'independent-tables',
    'uncontrolled-state',
    'checkbox-primitive',
  ]) {
    if (story === 'standalone-resize')
      await page.addInitScript(() => {
        const target = window as any;
        const listeners = { keydown: new Set(), blur: new Set() };
        target.__resizeListeners = listeners;
        const add = window.addEventListener.bind(window),
          remove = window.removeEventListener.bind(window);
        window.addEventListener = ((type: string, listener: any, options: any) => {
          if (type === 'keydown' || type === 'blur') listeners[type].add(listener);
          add(type, listener, options);
        }) as typeof window.addEventListener;
        window.removeEventListener = ((type: string, listener: any, options: any) => {
          if (type === 'keydown' || type === 'blur') listeners[type].delete(listener);
          remove(type, listener, options);
        }) as typeof window.removeEventListener;
      });
    await page.goto(`${stories.base}/iframe.html?${storyQuery(`puppertino-table--${story}`)}`);
    await page.getByRole('table').first().waitFor();
    assert.equal(
      await page.locator('#storybook-root').getByRole('table').count(),
      story === 'independent-tables' ? 2 : 1,
    );
    if (story === 'default') {
      for (const theme of ['dark', 'light']) {
        await setStorybookTheme(page, theme);
        const selection = await page.locator('table.pt-table').evaluate((table) => {
          const header = table.querySelector('thead .pt-selection-control > span');
          const row = table.querySelector('tbody .pt-selection-control > span');
          return {
            headerX: header?.getBoundingClientRect().x ?? -1,
            rowX: row?.getBoundingClientRect().x ?? -2,
            width: row?.getBoundingClientRect().width,
            puppertino: row?.parentElement?.classList.contains('p-checkbox'),
          };
        });
        assert.equal(selection.headerX, selection.rowX, 'selection controls align');
        assert.equal(selection.width, 16);
        assert.equal(selection.puppertino, true);
      }
    }
    if (story === 'external-atoms') {
      await page.waitForFunction(
        () => document.querySelector('[aria-label="Atom name width"]')?.textContent === '200',
      );
      await page.locator('th[aria-sort="descending"]').waitFor();
      await page.getByRole('checkbox', { name: 'Select all visible rows', exact: true }).uncheck();
      await page.getByRole('checkbox', { name: 'Select person-0', exact: true }).check();
      const all = page.getByRole('checkbox', { name: 'Select all visible rows', exact: true });
      assert.equal(await all.getAttribute('aria-checked'), 'mixed');
      await all.check();
      assert.equal(await page.locator('tbody input:checked').count(), 5);
      await all.uncheck();
      assert.equal(await page.locator('tbody input:checked').count(), 0);
    }
    if (story === 'empty' || story === 'disabled') {
      assert.equal(
        await page
          .getByRole('checkbox', { name: 'Select all visible rows', exact: true })
          .isDisabled(),
        true,
      );
    }
    if (story === 'selection') {
      await page.waitForFunction(
        () => document.querySelector('output')?.textContent === '4 selected',
      );
      const selected = page.locator('tbody tr.p-selected').first();
      await selected.hover();
      const colors = await selected.evaluate((row) => {
        const native = document.createElement('table');
        native.className = 'p-table';
        native.style.cssText = 'position:fixed;left:-10000px;top:0';
        native.innerHTML = '<tbody><tr class="p-selected"><td>Native selection</td></tr></tbody>';
        row.closest('table')!.parentElement!.append(native);
        const actual = getComputedStyle(row.querySelector('td')!);
        const expected = getComputedStyle(native.querySelector('td')!);
        const result = [
          [actual.backgroundColor, actual.color],
          [expected.backgroundColor, expected.color],
        ];
        native.remove();
        return result;
      });
      assert.deepEqual(
        colors[0],
        colors[1],
        'selection keeps native Puppertino colors while hovered',
      );
    }
    if (story === 'default') {
      const table = page.getByRole('table', { name: 'People' });
      const score = table.getByRole('button', { name: 'Sort by Score' });
      await score.click();
      assert.match((await table.locator('tbody tr').first().textContent()) ?? '', /86/);
      await score.click();
      assert.match((await table.locator('tbody tr').first().textContent()) ?? '', /Maya Chen/);
    }
    if (story === 'grouped-headers') {
      assert.ok((await page.locator('thead tr').count()) >= 2);
      assert.ok(
        await page.getByRole('columnheader', { name: 'Identity', exact: true }).isVisible(),
      );
      assert.equal(
        await page.getByRole('separator', { name: 'Resize Name column', exact: true }).count(),
        1,
      );
    }
    if (story === 'customized-rows') {
      const rows = page
        .getByRole('table', { name: 'Customized people', exact: true })
        .locator('tbody tr');
      assert.equal(await rows.count(), 3);
      await page.getByRole('button', { name: 'Open folder' }).click();
      assert.equal(await page.getByLabel('Context action').textContent(), 'Folder opened');
      const first = rows.nth(1);
      await first.locator('td[title]').first().click();
      assert.equal(await first.getAttribute('aria-current'), 'true');
      await first.click({ button: 'right' });
      assert.match((await page.getByLabel('Context action').textContent()) ?? '', /Person/);
      await first.getByRole('checkbox').check();
      assert.match((await first.getAttribute('class')) ?? '', /p-selected/);
      assert.match((await first.getAttribute('class')) ?? '', /active-row/);
      await first.locator('td[title]').first().dblclick();
      assert.equal(await page.getByLabel('Context action').textContent(), 'name');
      const before = await page.getByLabel('Active row').textContent();
      await rows.nth(2).getByRole('checkbox').check();
      assert.equal(
        await page.getByLabel('Active row').textContent(),
        before,
        'selection does not trigger app row click',
      );
      await first.evaluate((el) => {
        (window as any).__customRow = el;
      });
      await page.getByRole('separator', { name: 'Resize Name column' }).press('ArrowRight');
      assert.ok(
        await first.evaluate((el) => el === (window as any).__customRow),
        'custom row remains mounted on geometry updates',
      );
    }
    if (story === 'leading-rows-when-empty') {
      assert.equal(
        await page
          .getByRole('table', { name: 'Customized people', exact: true })
          .locator('tbody tr')
          .count(),
        2,
      );
      assert.ok(await page.getByRole('button', { name: 'Open folder' }).isVisible());
      assert.ok(await page.getByText('No rows', { exact: true }).isVisible());
    }
    if (story === 'hook-layout') {
      const table = page.getByRole('table', { name: 'Hook layout', exact: true });
      const first = await table.locator('tbody tr').first().textContent();
      await page.getByRole('button', { name: 'Sort by Score', exact: true }).click();
      assert.notEqual(
        await table.locator('tbody tr').first().textContent(),
        first,
        'hook enables opt-in local sorting',
      );
      await table.getByRole('checkbox').first().check();
      assert.equal(await table.getByRole('checkbox').first().isChecked(), true);
      const handle = page.getByRole('separator', { name: 'Resize Name column', exact: true });
      const before = Number(await handle.getAttribute('aria-valuenow'));
      await handle.press('ArrowRight');
      assert.equal(Number(await handle.getAttribute('aria-valuenow')), before + 16);
      await page.getByRole('button', { name: 'Toggle read-only selection' }).click();
      assert.equal(
        await table.getByRole('checkbox').first().isDisabled(),
        true,
        'controlled selection without callback is read-only',
      );
    }
    if (story === 'independent-tables') {
      const first = page
        .getByRole('table', { name: 'First table', exact: true })
        .getByRole('separator', { name: 'Resize Name column' });
      const second = page
        .getByRole('table', { name: 'Second table', exact: true })
        .getByRole('separator', { name: 'Resize Name column' });
      const firstWidth = Number(await first.getAttribute('aria-valuenow'));
      const secondWidth = Number(await second.getAttribute('aria-valuenow'));
      const box = (await first.boundingBox())!;
      await page.mouse.move(box.x + 6, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 46, box.y + box.height / 2);
      await second.dispatchEvent('keydown', { key: 'ArrowRight', bubbles: true });
      assert.equal(
        Number(await second.getAttribute('aria-valuenow')),
        secondWidth + 16,
        'another table can resize independently',
      );
      await page.keyboard.press('Escape');
      await page.mouse.up();
      assert.equal(Number(await first.getAttribute('aria-valuenow')), firstWidth);
      assert.equal(
        Number(await second.getAttribute('aria-valuenow')),
        secondWidth + 16,
        'cancel restores only the active table',
      );
    }
    if (story === 'uncontrolled-state') {
      const table = page.getByRole('table', { name: 'Uncontrolled people', exact: true });
      assert.equal(await table.locator('th[aria-sort]').getAttribute('aria-sort'), 'descending');
      assert.equal(await table.locator('input:checked').count(), 1, 'initial selection is applied');
      await table.locator('input:checked').uncheck();
      assert.equal(
        await table.locator('input:checked').count(),
        0,
        'uncontrolled selection updates while notifying the host',
      );
      assert.equal(await page.getByLabel('Selection notifications').textContent(), '1');
      const all = table.getByRole('checkbox', { name: 'Select all visible rows', exact: true });
      await all.check();
      assert.equal(await table.locator('tbody input:checked').count(), 3);
      await all.uncheck();
      assert.equal(await table.locator('tbody input:checked').count(), 0);
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      assert.equal(await page.getByLabel('Sorting notifications').textContent(), '1');
      assert.equal(await table.locator('th[aria-sort]').getAttribute('aria-sort'), 'ascending');
      assert.equal(
        await table.locator('tbody tr').first().locator('td').getAttribute('colspan'),
        '5',
      );
      assert.equal(
        await table.locator('tr[data-row-id]').first().getAttribute('data-column-count'),
        '5',
      );
      assert.equal(
        await table.locator('td[data-selectable]').first().getAttribute('data-selectable'),
        'true',
      );
    }
    if (story === 'checkbox-primitive') {
      const checkboxes = page
        .getByRole('table', { name: 'Custom checkbox layout' })
        .getByRole('checkbox');
      await checkboxes.first().click();
      await checkboxes.nth(2).click({ modifiers: ['Shift'] });
      assert.equal(await page.locator('#storybook-root input:checked').count(), 3);
      await checkboxes.nth(1).press('Space');
      assert.equal(await checkboxes.nth(1).isChecked(), false);
    }
    if (story === 'empty')
      assert.ok(await page.getByText('No people match this view.').isVisible());
    if (story === 'disabled')
      assert.equal(await page.getByRole('checkbox').first().isDisabled(), true);
    if (story === 'different-schema')
      assert.ok(await page.getByRole('table', { name: 'Inventory' }).isVisible());
    if (story === 'standalone-resize') {
      const listenerCounts = () =>
        page.evaluate(() => {
          const listeners = (window as any).__resizeListeners;
          return [listeners.keydown.size, listeners.blur.size];
        });
      const mountedCounts = await listenerCounts();
      await page.getByRole('button', { name: 'Remove resize controls', exact: true }).click();
      const unmountedCounts = await listenerCounts();
      assert.deepEqual(
        mountedCounts.map((count, index) => count - unmountedCounts[index]),
        [1, 1],
        'all standalone handles share exactly one keydown and blur listener',
      );
      await page.getByRole('button', { name: 'Mount resize controls', exact: true }).click();
      assert.deepEqual(
        await listenerCounts(),
        mountedCounts,
        'remount retains one controller listener pair',
      );
      assert.equal(
        await page.getByRole('separator').count(),
        2,
        'only two leaf headers expose standalone handles',
      );
      assert.equal(
        await page.getByRole('separator', { name: 'Resize identity column', exact: true }).count(),
        0,
      );
      const handle = page.getByRole('separator', { name: 'Resize name column', exact: true });
      const initial = Number(await handle.getAttribute('aria-valuenow'));
      await handle.scrollIntoViewIfNeeded();
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + 6, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 66, box.y + box.height / 2);
      assert.equal(
        Number(await page.getByLabel('Standalone name width').textContent()),
        initial + 60,
      );
      const other = page.getByRole('separator', { name: 'Resize score column', exact: true });
      const otherWidth = Number(await other.getAttribute('aria-valuenow'));
      await other.dispatchEvent('keydown', { key: 'ArrowRight', bubbles: true });
      await other.dispatchEvent('pointerdown', {
        button: 0,
        pointerId: 99,
        clientX: 0,
        bubbles: true,
      });
      await other.dispatchEvent('pointermove', { pointerId: 99, clientX: 100, bubbles: true });
      assert.equal(
        Number(await other.getAttribute('aria-valuenow')),
        otherWidth,
        'another column cannot change during an active shared gesture',
      );
      await page
        .getByRole('button', { name: 'Remove name handle', exact: true })
        .evaluate((el) => (el as HTMLButtonElement).click());
      await page.mouse.up();
      assert.equal(
        Number(await page.getByLabel('Standalone name width').textContent()),
        initial,
        'removing only the active handle restores widths',
      );
      assert.deepEqual(
        await listenerCounts(),
        mountedCounts,
        'remaining handles retain the shared listener pair',
      );
      await page.getByRole('button', { name: 'Mount name handle', exact: true }).click();
      const newBox = (await handle.boundingBox())!;
      await page.mouse.move(newBox.x + 6, newBox.y + newBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(newBox.x + 66, newBox.y + newBox.height / 2);
      await page
        .getByRole('button', { name: 'Remove resize controls', exact: true })
        .evaluate((el) => (el as HTMLButtonElement).click());
      await page.mouse.up();
      assert.equal(
        Number(await page.getByLabel('Standalone name width').textContent()),
        initial,
        'removing controls cancels preview sizing in a surviving table',
      );
      assert.equal(await page.locator('.pt-resizing').count(), 0);
      await page.getByRole('button', { name: 'Mount resize controls', exact: true }).click();
      await handle.focus();
      await handle.press('ArrowRight');
      assert.equal(
        Number(await handle.getAttribute('aria-valuenow')),
        initial + 16,
        'remounted controls remain usable',
      );
    }
  }
  for (const story of [
    'item-selection-gestures',
    'uncontrolled-item-gestures',
    'atom-item-gestures',
  ]) {
    await page.goto(`${stories.base}/iframe.html?${storyQuery(`puppertino-table--${story}`)}`);
    const items = page.getByRole('list', { name: 'Selectable items' }).getByRole('button');
    const count = page.getByLabel('Gesture selection count');
    await items.first().waitFor();
    await items.nth(0).click();
    await items.nth(4).click({ modifiers: ['Shift'] });
    assert.equal(
      await count.textContent(),
      '5 selected',
      `${story} includes caller-owned leading items`,
    );
    await page.getByRole('button', { name: 'Switch layout' }).click();
    await items.nth(2).click({ modifiers: ['Shift'] });
    assert.equal(
      await count.textContent(),
      '3 selected',
      `${story} retains its anchor across layouts`,
    );
    await items.nth(1).click({ modifiers: ['Control'] });
    assert.equal(await count.textContent(), '2 selected');
    await items.nth(5).click({ modifiers: ['Meta'] });
    assert.equal(await count.textContent(), '3 selected');
    await items.nth(3).focus();
    await items.nth(3).press('Space');
    assert.equal(
      await count.textContent(),
      '1 selected',
      `${story} native keyboard activation selects`,
    );
    for (const label of [
      'Disable gestures',
      'Disable gesture hook',
      ...(story === 'item-selection-gestures' ? ['Read-only selection'] : []),
    ]) {
      await page.getByRole('checkbox', { name: label, exact: true }).check();
      await items.nth(0).dispatchEvent('click');
      await page.getByRole('button', { name: 'Clear selection' }).dispatchEvent('click');
      assert.equal(
        await count.textContent(),
        '1 selected',
        `${story} ${label} guards imperative gestures`,
      );
      await page.getByRole('checkbox', { name: label, exact: true }).uncheck();
      await items.nth(2).click({ modifiers: ['Shift'] });
      assert.equal(
        await count.textContent(),
        '2 selected',
        `${story} blocked gestures preserve the anchor`,
      );
      await items.nth(3).click();
    }
    await page.getByRole('button', { name: 'Clear selection' }).click();
    assert.equal(await count.textContent(), '0 selected');
    await items.nth(0).click();
    await items.nth(2).click({ modifiers: ['Shift'] });
    await page.addScriptTag({ content: axe.source });
    assert.deepEqual(
      (await page.evaluate(async () => (await (window as any).axe.run(document)).violations)).map(
        (violation: any) => violation.id,
      ),
      [],
      story,
    );
    await page.screenshot({ path: `${evidence}/${story}.png` });
  }
  await checkOutlineViews(page, stories.base, evidence);
  await checkResizeEvents(page, stories.base);
  await checkResourceWorkspaces(page, stories.base, evidence);
  await checkFinderStories(page, stories.base, evidence);
  await checkStorybookDocs(page, stories.base, evidence);
  await page.close();
  console.log(
    `Storybook browser checks completed in ${((performance.now() - started) / 1000).toFixed(1)}s`,
  );
}

try {
  // Each suite owns separate contexts and screenshot paths. Keep concurrency at two
  // so pointer gestures and accessibility scans do not overwhelm a hosted runner.
  // Wait for both before closing Chromium, including when either suite fails.
  const results = await Promise.allSettled([checkDemo(), checkStories()]);
  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason);
  if (failures.length) throw new AggregateError(failures, 'Browser verification failed');
  assert.deepEqual(errors, []);
  console.log(
    process.env.PUPPERTINO_STORIES_ONLY
      ? 'Storybook stories, customization, hook layouts, shared resize controllers and anchored gestures with controlled/local/atom selection, shared density, resizable browser panels and keyboard/context-menu workflows passed.'
      : '512 repeated pointer drags, geometry, limits, keyboard/reset/cancellation/persistence, selection, disabled/unmount recovery, standalone-control cancellation, 267 rows across six pages, six light/dark axe layouts, Storybook customization and anchored gestures with controlled/local/atom selection, shared density, resizable browser panels and keyboard/context-menu workflows passed.',
  );
} finally {
  await browser.close();
  await demo.close();
  await stories.close();
}
