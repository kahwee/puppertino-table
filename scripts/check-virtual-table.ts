import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import axe from 'axe-core';
import type { Page } from 'playwright';
import { setStorybookTheme } from './storybook-theme.mjs';

/** Real browser geometry, keyboard/IME, selection and semantic checks for the opt-in body. */
export async function checkVirtualTable(page: Page, base: string, evidence: string) {
  const samples: object[] = [];
  const open = async (args: string) => {
    await page.goto(
      `${base}/iframe.html?id=puppertino-table--large-inventory&viewMode=story&args=${encodeURIComponent(args)}&play=false`,
    );
    await page.getByRole('table', { name: 'Resource inventory' }).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('[data-virtual-row]').length > 0);
  };
  for (const width of [1280, 390])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 850 });
      // Error mode checks the request message alongside the retained data rows.
      await open('rowCount:10000;columnCount:100;virtualized:true;status:error');
      await setStorybookTheme(page, theme);
      const table = page.getByRole('table', { name: 'Resource inventory' });
      const scroll = page.getByRole('region', { name: 'Resource inventory scroll area' });
      assert.ok((await table.locator('[data-virtual-row]').count()) < 65);
      assert.equal(await table.getAttribute('aria-rowcount'), '10002');
      const first = table.locator('[data-virtual-row="resource-1"]');
      await first.focus();
      const composing = await first.evaluate((element) => {
        const event = new KeyboardEvent('keydown', {
          key: 'End',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert.equal(composing, false);
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('data-virtual-row')),
        'resource-1',
      );
      await first.press('End');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('data-virtual-row') === 'resource-10000',
      );
      assert.equal(
        await table.locator('[data-virtual-row="resource-10000"]').getAttribute('aria-rowindex'),
        '10002',
      );
      await page.waitForFunction(() => {
        const row = document
          .querySelector('[data-virtual-row="resource-10000"]')
          ?.getBoundingClientRect();
        const viewport = document.querySelector('.pt-scroll')?.getBoundingClientRect();
        return !!row && !!viewport && row.bottom <= viewport.bottom + 1 && row.top >= viewport.top;
      });
      await table.locator('[data-virtual-row="resource-10000"]').press('Home');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('data-virtual-row') === 'resource-1',
      );
      await first.press('PageDown');
      await page.waitForFunction(
        () => document.activeElement?.getAttribute('data-virtual-row') !== 'resource-1',
      );
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-virtual-row'),
      );
      await scroll.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        element.scrollLeft = element.scrollWidth;
      });
      await page.waitForFunction(
        () => !!document.querySelector('[data-virtual-row="resource-10000"]'),
      );
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('data-virtual-row')),
        focused,
        'Scrolling retains the focused row',
      );
      assert.ok((await table.locator('[data-virtual-row]').count()) < 65);
      const cells = await table.locator('[data-virtual-row] td').count();
      samples.push({
        width,
        theme,
        rows: 10000,
        columns: 100,
        mountedRows: await table.locator('[data-virtual-row]').count(),
        mountedCells: cells,
      });
      assert.ok(cells < 6600, 'Mounted cells stay proportional to the viewport, not the dataset');
      await page.addScriptTag({
        content: `{ const previous = window.axe; ${axe.source}\nwindow.virtualAxe=window.axe;window.axe=previous; }`,
      });
      const violations = await page.evaluate(async () =>
        (
          await (window as unknown as { virtualAxe: typeof axe }).virtualAxe.run(document)
        ).violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
      );
      assert.deepEqual(violations, []);
      await page.screenshot({ path: `${evidence}/virtual-table-${width}-${theme}.png` });
    }
  // Equal-data DOM comparison. No elapsed-time/frame-rate claim is inferred from cell counts.
  await page.goto(
    `${base}/iframe.html?id=puppertino-table--large-inventory&viewMode=story&args=${encodeURIComponent('rowCount:100;columnCount:100;virtualized:false;status:error')}`,
  );
  await page.getByRole('table', { name: 'Resource inventory' }).waitFor();
  const ordinaryCells = await page
    .getByRole('table', { name: 'Resource inventory' })
    .locator('tbody td')
    .count();
  await open('rowCount:100;columnCount:100;virtualized:true;status:error');
  const virtualCells = await page.locator('[data-virtual-row] td').count();
  assert.ok(virtualCells < ordinaryCells / 2);
  samples.push({ comparison: '100 rows × 100 columns, same data', ordinaryCells, virtualCells });
  // Filtering from the bottom must not leave an empty viewport or discard selection.
  await page.getByRole('checkbox', { name: 'Select Design archive 00001', exact: true }).click();
  await page.locator('[data-virtual-row="resource-1"]').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-virtual-row') === 'resource-100',
  );
  await page.getByRole('searchbox', { name: 'Find resources' }).fill('archive 00100');
  await page.waitForFunction(() => document.querySelectorAll('[data-virtual-row]').length === 1);
  assert.equal(
    await page.locator('[data-virtual-row]').getAttribute('data-virtual-row'),
    'resource-100',
  );
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-virtual-row]').length > 1);
  assert.match((await page.getByLabel('Inventory summary').textContent()) ?? '', /1 selected/);
  await page.evaluate(() =>
    (
      window as unknown as {
        __STORYBOOK_ADDONS_CHANNEL__: { emit(event: string, value: unknown): void };
      }
    ).__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', {
      storyId: 'puppertino-table--large-inventory',
      updatedArgs: { density: 'comfortable' },
    }),
  );
  await page.waitForFunction(
    () => (document.querySelector('[data-virtual-row]')?.getBoundingClientRect().height ?? 0) >= 36,
  );
  assert.ok(
    (await page.locator('[data-virtual-row]').count()) < 65,
    'Density changes keep rendering bounded',
  );
  await writeFile(`${evidence}/virtual-table-results.json`, JSON.stringify(samples, null, 2));
}
