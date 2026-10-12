import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import type { Page } from 'playwright';

/** Shared example page checks, separate from the table gesture stress suite. */
export async function checkResourceWorkspaces(page: Page, base: string, evidence: string) {
  for (const story of [
    'column-workspace',
    'density-table',
    'controlled-panels',
    'read-only-panels',
  ]) {
    await page.goto(`${base}/iframe.html?id=puppertino-resource-browser--${story}&viewMode=story`);
    const tableView = story === 'density-table';
    const target = tableView
      ? page.getByRole('row').filter({ hasText: 'Project brief.pdf' })
      : page.getByRole('button', { name: 'Project brief.pdf', exact: true });
    await target.waitFor();
    const density = page.getByRole('combobox', { name: 'Density', exact: true });
    for (const [mode, iconSize] of [
      ['native', 14],
      ['compact', 16],
      ['comfortable', 20],
    ] as const) {
      await density.selectOption(mode);
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
    await density.selectOption('compact');
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
    assert.ok(
      await menu
        .getByRole('menuitem', { name: 'Show details' })
        .evaluate((element) => element === document.activeElement),
    );
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
    await page.keyboard.press('ArrowDown');
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
    await page.keyboard.press('End');
    assert.ok(
      await menu
        .getByRole('menuitem', { name: 'Open resource link' })
        .evaluate((element) => element === document.activeElement),
      'Menu navigation skips disabled links/actions and separators',
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
    await target.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await target.click({ button: 'right' });
    await menu.waitFor();
    await page.getByRole('button', { name: 'Toggle dark theme' }).click();
    await menu.waitFor({ state: 'detached' });
    await page.addScriptTag({ content: axe.source });
    for (const theme of ['dark', 'light']) {
      if (theme === 'light') await page.getByRole('button', { name: 'Toggle dark theme' }).click();
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
