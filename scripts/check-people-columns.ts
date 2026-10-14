import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';
import { peopleLayoutKey } from '../demo/people-layout.js';

export async function checkPeopleColumns(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1100, height: 850 });
  const url = `${base}/iframe.html?id=puppertino-table--paginated-selection&args=pageSize:5`;
  await page.goto(url);
  await page.evaluate((key) => localStorage.removeItem(key), peopleLayoutKey);
  await page.reload();
  const trigger = page.getByRole('button', { name: 'Columns', exact: true });
  const panel = page.getByRole('dialog', { name: 'Columns', exact: true });
  const table = page.getByRole('table', { name: 'Paged people' });
  const setVisible = async (label: string, visible: boolean) => {
    const checkbox = panel.getByRole('checkbox', { name: label, exact: true });
    if ((await checkbox.isChecked()) !== visible)
      await panel.locator('label').filter({ hasText: label }).click();
    assert.equal(await checkbox.isChecked(), visible);
  };
  const scoreEdge = page.getByRole('separator', { name: 'Resize Score column' });
  await scoreEdge.press('ArrowRight');
  const scoreWidth = await scoreEdge.getAttribute('aria-valuenow');
  await table.getByRole('checkbox', { name: 'Select Maya Chen' }).check();
  await trigger.click();
  await panel.waitFor();
  assert.equal(await panel.getByRole('checkbox', { name: 'Name', exact: true }).isDisabled(), true);
  await setVisible('Score', false);
  await table.getByRole('button', { name: 'Sort by Score' }).waitFor({ state: 'hidden' });
  assert.equal(await table.getByRole('checkbox', { name: 'Select Maya Chen' }).isChecked(), true);
  await page.keyboard.press('Escape');
  assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  const nameEdge = page.getByRole('separator', { name: 'Resize Name column' });
  await nameEdge.press('ArrowRight');
  const nameWidth = await nameEdge.getAttribute('aria-valuenow');
  const saved = await page.evaluate((key) => localStorage.getItem(key), peopleLayoutKey);
  const box = await nameEdge.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 70, box.y + box.height / 2);
  await page.waitForFunction(
    (width) =>
      document.querySelector('[aria-label="Resize Name column"]')?.getAttribute('aria-valuenow') !==
      width,
    nameWidth,
  );
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), peopleLayoutKey),
    saved,
    'cancelled previews never overwrite the saved layout',
  );
  await page.reload();
  await trigger.waitFor();
  await table.getByRole('button', { name: 'Sort by Score' }).waitFor({ state: 'hidden' });
  await nameEdge.waitFor();
  await page.waitForFunction(
    (width) =>
      document.querySelector('[aria-label="Resize Name column"]')?.getAttribute('aria-valuenow') ===
      width,
    nameWidth,
  );
  await trigger.click();
  await setVisible('Score', true);
  await scoreEdge.waitFor();
  assert.equal(
    await scoreEdge.getAttribute('aria-valuenow'),
    scoreWidth,
    'a hidden column retains its width after resizing another column',
  );
  await setVisible('Team', false);
  await setVisible('Score', false);
  await setVisible('Status', false);
  assert.equal(
    await table.getByRole('columnheader').count(),
    2,
    'Name and selection stay available',
  );
  await panel.getByRole('button', { name: 'Restore default layout' }).click();
  await table.getByRole('button', { name: 'Sort by Score' }).waitFor();
  assert.equal(await nameEdge.getAttribute('aria-valuenow'), '240');
  assert.equal(await scoreEdge.getAttribute('aria-valuenow'), '120');
  await page.keyboard.press('Escape');
  await table.getByRole('button', { name: 'Sort by Score' }).click();
  await trigger.click();
  await setVisible('Score', false);
  assert.equal(
    await table.locator('[aria-sort]').count(),
    0,
    'hiding the sorted column clears its ordering',
  );
  await panel.getByRole('button', { name: 'Restore default layout' }).click();
  await page.keyboard.press('Escape');
  const headerMenu = table.getByRole('button', { name: 'Column options for Score' });
  await headerMenu.click();
  await page.getByRole('menuitem', { name: 'Move Score earlier', exact: true }).click();
  const headerOrder = () => table.getByRole('columnheader').allTextContents();
  assert.ok(
    (await headerOrder()).join('|').indexOf('Score') <
      (await headerOrder()).join('|').indexOf('Team'),
  );
  await page.reload();
  await headerMenu.waitFor();
  await page.waitForFunction(() => {
    const headers = [...document.querySelectorAll('th')]
      .map((element) => element.textContent || '')
      .join('|');
    return headers.indexOf('Score') < headers.indexOf('Team');
  });
  await headerMenu.click();
  await page.getByRole('menuitem', { name: 'Restore default layout', exact: true }).click();
  await trigger.click();
  await page.screenshot({ path: `${evidence}/people-columns.png` });
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.goto(`${url}&globals=theme:${theme}`);
    await page.locator(theme === 'dark' ? 'html.p-dark-mode' : 'html:not(.p-dark-mode)').waitFor();
    await trigger.click();
    await panel.waitFor();
    const bounds = await panel.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await Promise.allSettled(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished),
      );
    });
    await page.addScriptTag({
      content: `{const previous=window.axe; ${axe.source}\nwindow.peopleColumnsAxe=window.axe;window.axe=previous;}`,
    });
    const violations = await page.evaluate(async () =>
      (
        await (window as unknown as { peopleColumnsAxe: typeof axe }).peopleColumnsAxe.run(
          document,
          { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } },
        )
      ).violations.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) })),
    );
    assert.deepEqual(violations, [], `${theme} compact Columns menu`);
    await page.screenshot({ path: `${evidence}/people-columns-${theme}-compact.png` });
    await page.keyboard.press('Escape');
  }
  await page.evaluate((key) => localStorage.removeItem(key), peopleLayoutKey);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage unavailable', 'SecurityError');
      },
    });
  });
  await page.goto(url);
  await trigger.click();
  await setVisible('Team', false);
  await table.getByRole('button', { name: 'Sort by Team' }).waitFor({ state: 'hidden' });
  assert.equal(await panel.getByRole('status').textContent(), 'Layout updated for this visit.');
  await panel.getByRole('button', { name: 'Restore default layout' }).click();
  await table.getByRole('button', { name: 'Sort by Team' }).waitFor();
  await page.keyboard.press('Escape');
  console.log(
    'Columns passed: visibility, stable selection, saved layout/widths, cancelled previews, restore defaults, sorting recovery, Escape focus and compact light/dark accessibility.',
  );
}
