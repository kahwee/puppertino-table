import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';

export async function checkFinderTools(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto(`${base}/iframe.html?id=examples-finder--file-table`);
  const window = page.locator('.pt-finder-container');
  const toolbar = page.getByRole('toolbar', { name: 'Finder toolbar', includeHidden: true });
  const table = page.getByRole('table', { name: 'Project files', exact: true });
  const nameMenu = table.getByRole('button', { name: 'Column options for Name', exact: true });
  const columns = page.getByRole('menu', { name: 'Column options', exact: true });
  await nameMenu.click();
  assert.equal(
    await columns
      .getByRole('menuitemcheckbox', { name: 'Name', exact: true })
      .getAttribute('aria-disabled'),
    'true',
  );
  await columns.getByRole('menuitemcheckbox', { name: 'Sort Descending', exact: true }).click();
  await table.locator('th[aria-sort="descending"]').waitFor();
  await nameMenu.focus();
  await nameMenu.press('Shift+F10');
  await columns.getByRole('menuitemcheckbox', { name: 'Sort Descending', exact: true }).waitFor();
  assert.equal(
    await columns
      .getByRole('menuitemcheckbox', { name: 'Sort Descending', exact: true })
      .getAttribute('aria-checked'),
    'true',
  );
  await columns.getByRole('menuitemcheckbox', { name: 'Kind', exact: true }).click();
  assert.equal(await table.getByRole('button', { name: 'Sort by Kind', exact: true }).count(), 0);
  await nameMenu.click();
  await columns.getByRole('menuitem', { name: 'Restore Default Columns' }).click();
  await table.getByRole('button', { name: 'Sort by Kind', exact: true }).waitFor();
  await table.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
  await page.getByLabel('Row density').focus();
  await page.waitForFunction(
    () => document.querySelector('.pt-finder-container')?.getAttribute('data-active') === 'false',
  );
  assert.equal(
    await table.locator('tr.p-selected').count(),
    1,
    'inactive windows retain selection',
  );
  await page.screenshot({ path: `${evidence}/finder-inactive.png` });
  await nameMenu.click();
  await columns.waitFor();
  assert.equal(
    await window.getAttribute('data-active'),
    'true',
    'owned portaled menus keep their window active',
  );
  await page.keyboard.press('Escape');
  const more = toolbar.getByRole('button', { name: 'More tools', exact: true });
  const customize = page.getByRole('dialog', { name: 'Customize Toolbar', exact: true });
  await more.click();
  await page.getByRole('menuitem', { name: 'Customize Toolbar…' }).click();
  await customize.waitFor();
  await customize.getByRole('checkbox', { name: 'Outline', exact: true }).uncheck();
  assert.equal(await toolbar.getByRole('button', { name: 'Outline', exact: true }).count(), 0);
  await customize.getByRole('button', { name: 'Move List earlier', exact: true }).click();
  assert.equal(
    await window.getAttribute('data-active'),
    'true',
    'reordering maintains window focus',
  );
  assert.equal(
    await customize
      .getByRole('checkbox')
      .first()
      .evaluate((node) => node.closest('label')?.textContent),
    'List',
  );
  await customize.getByRole('button', { name: 'Restore default tools' }).click();
  await page.keyboard.press('Escape');
  assert.equal(await more.evaluate((node) => node === document.activeElement), true);
  await toolbar.getByRole('button', { name: 'List', exact: true }).focus();
  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'More tools',
  );
  await more.click();
  await page.getByRole('menuitem', { name: 'Customize Toolbar…' }).click();
  await customize.waitFor();
  await page.setViewportSize({ width: 320, height: 360 });
  await page.waitForFunction(() => {
    const panel = document.querySelector('.pt-toolbar-customize')?.getBoundingClientRect();
    return (
      panel &&
      panel.left >= 7 &&
      panel.right <= innerWidth - 7 &&
      panel.top >= 7 &&
      panel.bottom <= innerHeight - 7
    );
  });
  await customize.getByRole('button', { name: 'Done', exact: true }).click();
  assert.equal(
    await more.evaluate((node) => node === document.activeElement),
    true,
    'Done returns focus to overflow',
  );
  for (const width of [480, 390]) {
    await page.setViewportSize({ width, height: 760 });
    await more.click();
    const menu = page.getByRole('menu', { name: 'More toolbar tools', exact: true });
    await menu.getByRole('menuitemcheckbox', { name: 'Gallery', exact: true }).waitFor();
    assert.equal(
      await toolbar
        .getByRole('button', { name: 'Search', exact: true, includeHidden: true })
        .isVisible(),
      true,
    );
    assert.equal(
      await toolbar
        .getByRole('button', { name: 'Back', exact: true, includeHidden: true })
        .isVisible(),
      true,
    );
    const title = await toolbar
      .getByRole('heading', { name: 'Projects', exact: true, includeHidden: true })
      .boundingBox();
    assert.ok(title && title.width >= 60, 'location remains visible');
    const bounds = await toolbar
      .getByRole('button', { name: 'More tools', exact: true, includeHidden: true })
      .boundingBox();
    assert.ok(
      bounds && bounds.x + bounds.width <= width,
      'overflow trigger stays inside the window',
    );
    await page.addScriptTag({
      content: `{const previous=window.axe;${axe.source}\nwindow.finderToolsAxe=window.axe;window.axe=previous;}`,
    });
    const violations = await page.evaluate(async () =>
      (
        await (window as unknown as { finderToolsAxe: typeof axe }).finderToolsAxe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        })
      ).violations.map((item) => item.id),
    );
    assert.deepEqual(violations, [], `compact tools accessibility at ${width}`);
    await page.screenshot({ path: `${evidence}/finder-overflow-${width}.png` });
    await page.keyboard.press('Escape');
  }
  await more.click();
  await page.getByRole('menuitemcheckbox', { name: 'Gallery', exact: true }).click();
  await page.getByRole('region', { name: 'Project file gallery' }).waitFor();
  console.log(
    'Finder tools passed: header sorting/visibility, inactive selection, portaled focus, customization/order/reset, resize focus and panel bounds, compact overflow and accessibility.',
  );
}
