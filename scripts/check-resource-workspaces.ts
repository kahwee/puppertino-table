import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import type { Page } from 'playwright';
import { setStorybookTheme } from './storybook-theme.mjs';

/** Shared example page checks, separate from the table gesture stress suite. */
export async function checkResourceWorkspaces(page: Page, base: string, evidence: string) {
  await page.goto(`${base}/iframe.html?id=puppertino-column-view--custom-styling&viewMode=story`);
  const styled = page.getByRole('region', { name: 'Styled workspace' });
  await styled.waitFor();
  const selected = styled.locator('.pt-browser-item.p-selected');
  assert.equal(await selected.evaluate((element) => getComputedStyle(element).gap), '12px');
  assert.equal(await selected.evaluate((element) => getComputedStyle(element).borderRadius), '8px');
  assert.equal(
    await selected.locator('.pt-icon').evaluate((element) => getComputedStyle(element).color),
    await selected.evaluate((element) => getComputedStyle(element).color),
  );
  assert.equal(
    await selected
      .locator('.pt-item-secondary')
      .evaluate((element) => getComputedStyle(element).color),
    await selected.evaluate((element) => getComputedStyle(element).color),
  );
  assert.equal(
    await styled
      .locator('.pt-browser-panel')
      .first()
      .evaluate((element) => getComputedStyle(element).borderRightColor),
    'rgb(131, 147, 167)',
  );
  await page.screenshot({ path: `${evidence}/custom-styling.png` });
  await page.goto(
    `${base}/iframe.html?id=puppertino-column-view--density-inheritance&viewMode=story`,
  );
  const inherited = page.getByRole('table', { name: 'Inherited table', exact: true });
  await inherited.waitFor();
  const padding = (name: string) =>
    page
      .getByRole('table', { name, exact: true })
      .locator('th')
      .first()
      .evaluate((element) => getComputedStyle(element).paddingTop);
  const icon = (name: string) =>
    page
      .getByRole('table', { name, exact: true })
      .locator('.pt-icon')
      .first()
      .evaluate((element) => element.getBoundingClientRect().width);
  const nativePadding = await padding('Standalone table');
  assert.equal(await padding('Inherited table'), '8px');
  assert.equal(await icon('Inherited table'), 20);
  assert.equal(
    await padding('Native override'),
    nativePadding,
    'Explicit native opts out of inherited table spacing',
  );
  assert.equal(await icon('Native override'), 14);
  assert.equal(
    await padding('Partial metrics'),
    '8px',
    'Partial metric scopes retain inherited row spacing',
  );
  assert.equal(await icon('Partial metrics'), 22);
  assert.equal(
    await page
      .getByRole('region', { name: 'Inherited browser', exact: true })
      .locator('.pt-icon')
      .evaluate((element) => element.getBoundingClientRect().width),
    20,
  );
  assert.equal(
    await page
      .getByRole('region', { name: 'Compact override', exact: true })
      .locator('.pt-icon')
      .evaluate((element) => element.getBoundingClientRect().width),
    16,
  );
  assert.equal(
    await page
      .getByRole('region', { name: 'Standalone browser', exact: true })
      .locator('.pt-icon')
      .evaluate((element) => element.getBoundingClientRect().width),
    16,
  );
  await page.getByLabel('Workspace density').selectOption('compact');
  assert.equal(await padding('Inherited table'), '3px');
  assert.equal(await icon('Inherited table'), 16);
  assert.equal(await padding('Native override'), nativePadding);
  await page.getByLabel('Workspace density').selectOption('native');
  assert.equal(await padding('Inherited table'), nativePadding);
  await page.screenshot({ path: `${evidence}/density-inheritance.png` });
  await page.goto(
    `${base}/iframe.html?id=puppertino-column-view--column-workspace&viewMode=story&args=widthMode:persistent`,
  );
  await page.getByRole('region', { name: 'Project folders' }).waitFor();
  await page.evaluate(() =>
    localStorage.setItem(
      'puppertino.stories.panels.v1',
      JSON.stringify({ workspace: 300, projects: 310, hidden: 280 }),
    ),
  );
  await page.reload();
  const rootHandle = page.getByRole('separator', { name: 'Resize Workspace panel', exact: true });
  const projectHandle = page.getByRole('separator', { name: 'Resize Projects panel', exact: true });
  await page.waitForFunction(
    () => document.querySelector('.pt-panel-resizer')?.getAttribute('aria-valuenow') === '300',
  );
  await rootHandle.press('ArrowRight');
  await projectHandle.press('ArrowRight');
  const stored = await page.evaluate(() => localStorage.getItem('puppertino.stories.panels.v1'));
  assert.deepEqual(JSON.parse(stored || '{}'), { hidden: 280, workspace: 316, projects: 326 });
  const bounds = await projectHandle.boundingBox();
  assert.ok(bounds);
  await page.mouse.move(bounds.x + 4, bounds.y + 20);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 44, bounds.y + 20);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('puppertino.stories.panels.v1')),
    stored,
  );
  await page
    .getByRole('button', { name: 'Toggle root view' })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await page.mouse.up();
  assert.equal(
    await page.evaluate(() => localStorage.getItem('puppertino.stories.panels.v1')),
    stored,
  );
  await page.getByRole('button', { name: 'Toggle root view' }).click();
  assert.equal(await projectHandle.getAttribute('aria-valuenow'), '326');
  await rootHandle.press('ArrowRight');
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector('.pt-panel-resizer')?.getAttribute('aria-valuenow') === '332',
  );
  assert.equal(
    await projectHandle.getAttribute('aria-valuenow'),
    '326',
    'Cancelled hidden-panel previews never become saved widths',
  );
  assert.equal(
    JSON.parse(
      (await page.evaluate(() => localStorage.getItem('puppertino.stories.panels.v1'))) || '{}',
    ).hidden,
    280,
  );
  await page.screenshot({ path: `${evidence}/persistent-panels.png` });
  for (const story of [
    'column-workspace',
    'density-table',
    'controlled-panels',
    'read-only-panels',
    'delegated-menus',
    'delegated-table-menus',
  ]) {
    const presets: Record<string, string> = {
      'column-workspace': '',
      'density-table': 'view:table',
      'controlled-panels': 'widthMode:controlled',
      'read-only-panels': 'widthMode:readOnly',
      'delegated-menus': 'menuMode:delegated',
      'delegated-table-menus': 'view:table;menuMode:delegated',
    };
    await page.goto(
      `${base}/iframe.html?id=puppertino-column-view--column-workspace&viewMode=story&args=${encodeURIComponent(presets[story])}`,
    );
    const tableView = story === 'density-table' || story === 'delegated-table-menus';
    const target = tableView
      ? page.getByRole('row').filter({ hasText: 'Project brief.pdf' })
      : page.getByRole('button', { name: 'Project brief.pdf', exact: true });
    await target.waitFor();
    const density = page.getByRole('combobox', { name: 'Density', exact: true });
    const selectDensity = async (mode: string) => {
      await density.selectOption(mode);
      await page.waitForFunction(
        (expected) =>
          document.querySelector('.demo-browser-workspace')?.getAttribute('data-pt-density') ===
          expected,
        mode,
      );
    };
    for (const [mode, iconSize] of [
      ['native', 14],
      ['compact', 16],
      ['comfortable', 20],
    ] as const) {
      await selectDensity(mode);
      assert.equal(
        await target
          .locator('.pt-icon')
          .evaluate((element) => element.getBoundingClientRect().width),
        iconSize,
        `${story} ${mode} shares icon sizing`,
      );
      if (!tableView)
        assert.ok(
          (await target.evaluate((element) => element.getBoundingClientRect().height)) >=
            (mode === 'comfortable' ? 36 : mode === 'compact' ? 24 : 20),
        );
    }
    await selectDensity('compact');
    await page.screenshot({ path: `${evidence}/${story}-wide.png` });
    if (!tableView) {
      if (story === 'read-only-panels')
        assert.equal(await page.locator('.pt-panel-resizer').count(), 0);
      else {
        const handle = page.getByRole('separator', { name: 'Resize Workspace panel', exact: true });
        const initial = Number(await handle.getAttribute('aria-valuenow'));
        await handle.press('ArrowRight');
        assert.equal(Number(await handle.getAttribute('aria-valuenow')), initial + 16);
        assert.equal(await page.getByLabel('Panel resize commits').textContent(), '1');
        assert.equal(
          JSON.parse((await page.getByLabel('Committed panel widths').textContent()) || '{}')
            .workspace,
          initial + 16,
        );
        await handle.press('Enter');
        assert.equal(Number(await handle.getAttribute('aria-valuenow')), initial);
        const box = await handle.boundingBox();
        assert.ok(box);
        await page.mouse.move(box.x + box.width / 2, box.y + 20);
        await page.mouse.down();
        await page.mouse.move(box.x + 40, box.y + 20);
        await page.keyboard.press('Escape');
        await page.mouse.up();
        assert.equal(
          Number(await handle.getAttribute('aria-valuenow')),
          initial,
          `${story} Escape restores panel width`,
        );
        assert.equal(
          await page.getByLabel('Panel resize commits').textContent(),
          '2',
          'Escape never emits a commit',
        );
        const completed = await handle.boundingBox();
        assert.ok(completed);
        const startX = completed.x + completed.width / 2;
        await page.mouse.move(startX, completed.y + 20);
        await page.mouse.down();
        await page.mouse.move(startX + 48, completed.y + 20);
        assert.equal(
          await page.getByLabel('Panel resize commits').textContent(),
          '2',
          'Pointer previews never commit',
        );
        await page.mouse.up();
        assert.equal(await page.getByLabel('Panel resize commits').textContent(), '3');
        assert.equal(
          JSON.parse((await page.getByLabel('Committed panel widths').textContent()) || '{}')
            .workspace,
          initial + 48,
        );
        await handle.press('Enter');
        const box2 = await handle.boundingBox();
        assert.ok(box2);
        await page.mouse.move(box2.x + box2.width / 2, box2.y + 20);
        await page.mouse.down();
        await page.mouse.move(box2.x + 40, box2.y + 20);
        await page
          .getByRole('button', { name: 'Toggle root view' })
          .evaluate((element) => (element as HTMLButtonElement).click());
        await page.mouse.up();
        assert.equal(
          await page.locator('.pt-resizing').count(),
          0,
          'Removing dragged panels cancels the gesture',
        );
        assert.equal(
          await page.getByLabel('Panel resize commits').textContent(),
          '4',
          'Unmount cancellation never commits',
        );
        await page.getByRole('button', { name: 'Toggle root view' }).click();
      }
    }
    if (!tableView) {
      const guide = page.getByRole('link', { name: 'Workspace guide', exact: true });
      assert.equal(await guide.getAttribute('aria-pressed'), null, 'Links retain native semantics');
      const disabledGuide = page.getByRole('link', { name: 'Unavailable guide', exact: true });
      assert.equal(await disabledGuide.getAttribute('href'), null);
      assert.equal(await disabledGuide.getAttribute('aria-disabled'), 'true');
      const popupPromise = page.context().waitForEvent('page');
      await guide.click({ modifiers: ['Control'] });
      const popup = await popupPromise;
      await popup.waitForURL((url) => url.hash === '#workspace-guide');
      await popup.close();
      await page.bringToFront();
      await page.waitForFunction(() => document.hasFocus());
    }
    await target.click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'Resource commands', exact: true });
    await menu.waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menu');
    assert.equal(await menu.getByRole('separator').count(), 1);
    assert.equal(
      await menu.getByRole('menuitem', { name: 'Unavailable resource link' }).getAttribute('href'),
      null,
    );
    assert.equal(
      await menu
        .getByRole('menuitem', { name: 'Unavailable resource link' })
        .getAttribute('aria-disabled'),
      'true',
    );
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'detached' });
    assert.ok(
      await target.evaluate((element) => element === document.activeElement),
      `${story} dismissing a menu restores the target`,
    );
    await target.press('Shift+F10');
    await menu.waitFor();
    const downloadPromise = page.waitForEvent('download');
    await menu.getByRole('menuitem', { name: 'Download sample' }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'sample-resource.txt');
    const downloadedPath = await download.path();
    assert.ok(downloadedPath);
    assert.equal(await readFile(downloadedPath, 'utf8'), 'Sample resource');
    await menu.waitFor({ state: 'detached' });
    await target.press('Shift+F10');
    await menu.waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menu');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(
      () => document.activeElement?.textContent === 'Select only this item',
    );
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      'Select only this item',
    );
    await page.keyboard.press('Enter');
    await menu.waitFor({ state: 'detached' });
    assert.equal(await page.getByLabel('Resource selection count').textContent(), '1 selected');
    if (!tableView) {
      await page
        .getByRole('button', { name: 'Review note 04.txt', exact: true })
        .click({ modifiers: ['Shift'] });
      assert.equal(
        await page.getByLabel('Resource selection count').textContent(),
        '4 selected',
        'Menu selection establishes the range anchor',
      );
    }
    await target.dispatchEvent('keydown', { key: 'ContextMenu', bubbles: true });
    await menu.waitFor();
    await menu.getByRole('menuitem', { name: 'Show details' }).click();
    await page.getByRole('complementary', { name: 'Resource details', exact: true }).waitFor();
    await target.dispatchEvent('contextmenu', { clientX: 1278, clientY: 898, bubbles: true });
    await menu.waitFor();
    const rect = await menu.boundingBox();
    assert.ok(rect);
    assert.ok(
      rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 1280 && rect.y + rect.height <= 900,
      `${story} menu fits viewport corners`,
    );
    await menu.getByRole('menuitem', { name: 'Clear selection' }).click();
    await target.click({ button: 'right' });
    await menu.waitFor();
    assert.ok(await menu.getByRole('menuitem', { name: 'Clear selection' }).isDisabled());
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menu');
    await page.keyboard.press('End');
    await page.waitForFunction(
      () => document.activeElement?.textContent === 'Unavailable resource link',
    );
    assert.ok(
      await menu
        .getByRole('menuitem', { name: 'Unavailable resource link' })
        .evaluate((element) => element === document.activeElement),
      'Base UI keeps disabled commands discoverable through keyboard navigation',
    );
    await page.keyboard.press('Enter');
    assert.equal(
      await menu.isVisible(),
      true,
      'Disabled links cannot activate or dismiss the menu',
    );
    await page.keyboard.press('ArrowUp');
    await page.waitForFunction(() => document.activeElement?.textContent === 'Open resource link');
    assert.ok(
      await menu
        .getByRole('menuitem', { name: 'Open resource link' })
        .evaluate((element) => element === document.activeElement),
      'Arrow navigation reaches the previous enabled link',
    );
    const popupPromise = page.context().waitForEvent('page');
    await page.keyboard.press(story === 'controlled-panels' ? ' ' : 'Enter');
    const popup = await popupPromise;
    await popup.waitForURL((url) => url.hash === '#resource-0');
    await popup.close();
    await page.bringToFront();
    await page.waitForFunction(() => document.hasFocus());
    await menu.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Toggle narrow layout' }).click();
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLElement>('[aria-label="Resource workspace"]')?.style.maxWidth ===
        '520px',
    );
    if (!tableView)
      await page.waitForFunction(
        () => {
          const surface = (
            document.querySelector('.pt-column-browser') as HTMLElement
          ).getBoundingClientRect();
          const current = (
            document.querySelector('.pt-browser-panel:last-child') as HTMLElement
          ).getBoundingClientRect();
          const visible = Array.from(document.querySelectorAll('.pt-browser-panel'))
            .map((element) => element.getBoundingClientRect())
            .find((rect) => rect.right > surface.left + 1);
          return (
            !!visible &&
            current.left >= surface.left - 1 &&
            current.right <= surface.right + 1 &&
            Math.abs(visible.left - surface.left) <= 1
          );
        },
        undefined,
        { timeout: 10000 },
      );
    // A wide table row can still scroll when Playwright clicks its clipped center.
    // Use the visible filename so that scrolling settles before opening the menu.
    const pointerTarget = tableView
      ? target.getByText('Project brief.pdf', { exact: true })
      : target;
    await pointerTarget.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await pointerTarget.click({ button: 'right' });
    await menu.waitFor();
    await page.keyboard.press('Escape');
    await setStorybookTheme(page, 'dark');
    await menu.waitFor({ state: 'detached' });
    await page.addScriptTag({ content: axe.source });
    for (const theme of ['dark', 'light']) {
      if (theme === 'light') await setStorybookTheme(page, 'light');
      await target.press('Shift+F10');
      await menu.waitFor();
      const violations = await page.evaluate(
        async () =>
          (
            await (window as unknown as { axe: typeof axe }).axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
            })
          ).violations,
      );
      assert.deepEqual(
        violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
        [],
        `${story}-${theme}`,
      );
      await page.screenshot({ path: `${evidence}/${story}-${theme}.png` });
      await page.keyboard.press('Escape');
    }
  }
}
