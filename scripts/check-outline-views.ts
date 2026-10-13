import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Locator, Page } from 'playwright';
import { storyQuery } from './story-presets.mjs';
import { setStorybookTheme } from './storybook-theme.mjs';

declare global {
  interface Window {
    outlineAxe: typeof axe;
  }
}
async function violations(page: Page) {
  await page.addScriptTag({
    content: `{ const previous = window.axe; ${axe.source}\nwindow.outlineAxe=window.axe;window.axe=previous; }`,
  });
  return page.evaluate(async () =>
    (await window.outlineAxe.run(document)).violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  );
}
export async function checkOutlineViews(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${base}/iframe.html?id=puppertino-outline-view--default&viewMode=story`);
  // Storybook broadcasts controlled args asynchronously; wait for the rendered value.
  const setCheckbox = async (checkbox: Locator, checked: boolean) => {
    if ((await checkbox.isChecked()) === checked) return;
    const label = await checkbox.getAttribute('aria-label');
    await checkbox.click();
    await page.waitForFunction(
      ({ label, checked }) =>
        Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(
          (input) => input.getAttribute('aria-label') === label,
        )?.checked === checked,
      { label, checked },
    );
  };
  const grid = page.getByRole('treegrid', { name: 'Document hierarchy' });
  await grid.waitFor();
  await page.getByRole('button', { name: 'Expand Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Expand Source', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Expand Source', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select index.ts', exact: true }).waitFor();
  await setCheckbox(page.getByRole('checkbox', { name: 'Select index.ts', exact: true }), true);
  const bulk = page.getByRole('checkbox', { name: 'Select all visible rows', exact: true });
  await page.getByRole('button', { name: 'Collapse Projects', exact: true }).click();
  assert.equal(
    await bulk.getAttribute('aria-checked'),
    'false',
    'hidden descendants do not affect the visible bulk state',
  );
  await setCheckbox(bulk, true);
  await setCheckbox(bulk, false);
  await page.getByRole('button', { name: 'Expand Projects', exact: true }).click();
  assert.equal(
    await page.getByRole('checkbox', { name: 'Select index.ts', exact: true }).isChecked(),
    true,
    'bulk clearing visible rows preserves hidden child selection',
  );
  assert.equal(
    await page.getByLabel('Child requests').textContent(),
    '2 requests',
    'cached expansion does not fetch again',
  );
  await page.getByRole('button', { name: 'Sort by Name', exact: true }).click();
  const names = await grid.getByRole('row').allTextContents();
  assert.ok(
    names[1].includes('Archive') &&
      names[2].includes('Projects') &&
      names[3].includes('package.json') &&
      names[4].includes('Source') &&
      names[5].includes('cell.tsx'),
    'sorting stays within sibling groups',
  );
  const child = grid.getByRole('row', { name: /index.ts/ });
  await child.focus();
  await child.press('ArrowLeft');
  const source = grid.getByRole('row', { name: /Source/ });
  assert.equal(await source.evaluate((node) => node === document.activeElement), true);
  await source.press('ArrowLeft');
  assert.equal(await child.count(), 0, 'Left collapses the focused branch');
  await page
    .getByRole('button', { name: 'Collapse Projects', exact: true })
    .click({ modifiers: ['Alt'] });
  await page
    .getByRole('button', { name: 'Expand Projects', exact: true })
    .click({ modifiers: ['Alt'] });
  await page.getByRole('checkbox', { name: 'Select index.ts', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Child requests').textContent(), '2 requests');
  await setCheckbox(page.getByRole('checkbox', { name: 'Select index.ts', exact: true }), true);
  for (const theme of ['light', 'dark']) {
    await setStorybookTheme(page, theme);
    assert.deepEqual(await violations(page), [], `outline ${theme}`);
    await page.screenshot({ path: `${evidence}/outline-${theme}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () => document.querySelector('.pt-split-view')?.getAttribute('data-compact') === 'true',
  );
  await page.getByRole('button', { name: 'Detail', exact: true }).click();
  await page.getByRole('region', { name: 'Document detail', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Outline', exact: true }).click();
  await grid.waitFor();
  assert.equal(
    await page.getByRole('checkbox', { name: 'Select index.ts', exact: true }).isChecked(),
    true,
  );
  assert.equal(await page.getByLabel('Child requests').textContent(), '2 requests');
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'compact navigation has no page overflow',
  );
  assert.deepEqual(await violations(page), [], 'compact outline');
  await page.screenshot({ path: `${evidence}/outline-compact.png` });

  await page.getByRole('button', { name: 'Reload children', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Child requests"]')?.textContent === '4 requests' &&
      !!document.querySelector('input[aria-label="Select index.ts"]'),
  );
  assert.equal(
    await page.getByRole('checkbox', { name: 'Select index.ts', exact: true }).isChecked(),
    true,
    'cache invalidation fetches new children while retaining ID-based selection',
  );
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${base}/iframe.html?${storyQuery('puppertino-split-view--vertical')}`);
  const divider = page.getByRole('separator', { name: 'Resize Sidebar pane', exact: true });
  await divider.waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Resize Sidebar pane"]')
        ?.getAttribute('aria-orientation') === 'horizontal',
  );
  const initial = Number(await divider.getAttribute('aria-valuenow'));
  await divider.focus();
  await divider.press('ArrowDown');
  assert.ok(
    Number(await divider.getAttribute('aria-valuenow')) > initial,
    'vertical keyboard resizing uses Up/Down',
  );
  const before = Number(await divider.getAttribute('aria-valuenow'));
  const committed = await page.getByLabel('Committed pane sizes').textContent();
  const box = await divider.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 40);
  assert.ok(
    Number(await divider.getAttribute('aria-valuenow')) > before,
    'vertical pointers resize using Y',
  );
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.ok(Math.abs(Number(await divider.getAttribute('aria-valuenow')) - before) < 0.01);
  assert.equal(
    await page.getByLabel('Committed pane sizes').textContent(),
    committed,
    'cancelled preview never commits',
  );
  const next = await divider.boundingBox();
  assert.ok(next);
  await page.mouse.move(next.x + next.width / 2, next.y + next.height / 2);
  await page.mouse.down();
  await page.mouse.move(next.x + next.width / 2, next.y + next.height / 2 + 40);
  await page.mouse.up();
  assert.notEqual(
    await page.getByLabel('Committed pane sizes').textContent(),
    committed,
    'completed vertical gestures commit',
  );
  console.log(
    'Outline/split views passed: sibling sorting, lazy cache, recursive disclosure, hidden-selection safety, keyboard hierarchy, light/dark/compact axe, vertical pointer completion/cancellation.',
  );
}
