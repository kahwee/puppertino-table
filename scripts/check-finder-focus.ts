import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { storyQuery } from './story-presets.mjs';

export async function checkFinderFocus(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1080, height: 720 });
  for (const theme of ['light', 'dark']) {
    await page.goto(
      `${base}/iframe.html?${storyQuery(`examples-finder--comfortable-table`)}&globals=theme:${theme}`,
    );
    await page.waitForFunction(
      (dark) => document.documentElement.classList.contains('p-dark-mode') === dark,
      theme === 'dark',
    );
    await page.getByRole('button', { name: 'Icons', exact: true }).focus();
    await page.keyboard.press('Tab');
    const list = page.getByRole('button', { name: 'List', exact: true });
    assert.equal(await list.evaluate((node) => node.matches(':focus-visible')), true);
    assert.deepEqual(
      await list.evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.outlineWidth, style.outlineOffset];
      }),
      ['3px', '-1px'],
      'Puppertino owns toolbar focus, without a Finder override',
    );
    await page.screenshot({ path: `${evidence}/focus-${theme}-toolbar.png` });
    await page.getByRole('button', { name: 'Icons', exact: true }).click();
    await list.click();
    assert.equal(
      await list.evaluate((node) => node.matches(':focus-visible')),
      false,
      'Pointer focus stays quiet',
    );

    const sort = page.getByRole('button', { name: 'Sort by Name', exact: true });
    await sort.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await sort.evaluate((node) => getComputedStyle(node).outlineOffset),
      '-2px',
      'Header focus stays inside its clipped cell',
    );
    await page.screenshot({ path: `${evidence}/focus-${theme}-header.png` });
    await page.keyboard.press('Tab');
    await page.screenshot({ path: `${evidence}/focus-${theme}-resizer.png` });

    await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
    await page.keyboard.press('ArrowDown');
    await page.screenshot({ path: `${evidence}/focus-${theme}-row.png` });
    await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
    await page.getByRole('button', { name: 'Tags', exact: true }).click();
    await page.getByRole('option', { name: 'Project Alpine', exact: true }).click();
    const input = page.getByRole('combobox', { name: 'Tag name' });
    await input.focus();
    const field = page.locator('.pt-tag-field');
    assert.notEqual(await field.evaluate((node) => getComputedStyle(node).boxShadow), 'none');
    assert.equal(await input.evaluate((node) => getComputedStyle(node).boxShadow), 'none');
    await page.screenshot({ path: `${evidence}/focus-${theme}-tag-input.png` });
    await page.getByRole('option', { name: 'Work', exact: true }).hover();
    await input.press('ArrowDown');
    assert.equal(
      await page
        .getByRole('listbox', { name: 'Available tags' })
        .getByRole('option', { selected: true })
        .count(),
      1,
      'Pointer and keyboard suggestions share one active item',
    );
    await input.press('Backspace');
    assert.equal(
      await page
        .getByRole('listbox', { name: 'Available tags' })
        .getByRole('option', { selected: true })
        .count(),
      0,
      'Token focus clears the active suggestion',
    );
    assert.equal(
      await field.evaluate((node) => getComputedStyle(node).boxShadow),
      'none',
      'Focusing a token removes the input ring',
    );
    assert.equal(
      await page
        .getByRole('button', { name: 'Remove tag Project Alpine' })
        .evaluate((node) => node.matches(':focus-visible')),
      true,
    );
    await page.screenshot({ path: `${evidence}/focus-${theme}-tag-token.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Actions', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle),
      'none',
      'Menus use their highlighted row, not another outer ring',
    );
    const menu = page.getByRole('menu');
    const highlights = () =>
      menu
        .locator('[role="menuitem"]')
        .evaluateAll(
          (items) =>
            items.filter((item) => getComputedStyle(item).backgroundColor !== 'rgba(0, 0, 0, 0)')
              .length,
        );
    assert.equal(
      await highlights(),
      1,
      'Keyboard menu focus leaves exactly one highlighted command',
    );
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).hover();
    assert.equal(
      await page
        .getByRole('menuitem', { name: 'Move to Trash', exact: true })
        .evaluate((node) => node === document.activeElement),
      true,
    );
    await page.keyboard.press('ArrowUp');
    assert.equal(
      await highlights(),
      1,
      'A stationary pointer cannot retain a second menu highlight',
    );
    await page.screenshot({ path: `${evidence}/focus-${theme}-menu.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Archive', exact: true }).focus();
    await page.screenshot({ path: `${evidence}/focus-${theme}-sidebar.png` });
    await page.getByRole('button', { name: 'Icons', exact: true }).click();
    const icon = page.locator('.pt-finder-icon-item').first();
    await icon.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await icon.evaluate((node) => getComputedStyle(node).outlineOffset), '-2px');
    await page.screenshot({ path: `${evidence}/focus-${theme}-icon.png` });
    await page.getByRole('button', { name: 'Gallery', exact: true }).click();
    const thumbnail = page.locator('.pt-finder-filmstrip > button').first();
    await thumbnail.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await thumbnail.evaluate((node) => getComputedStyle(node).outlineOffset), '-2px');
    await page.screenshot({ path: `${evidence}/focus-${theme}-gallery.png` });
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  await page.getByRole('combobox', { name: 'Tag name' }).focus();
  assert.equal(
    await page.locator('.pt-tag-field').evaluate((node) => getComputedStyle(node).outlineStyle),
    'solid',
    'Forced colors retain a visible field focus indicator',
  );
  await page.screenshot({ path: `${evidence}/focus-forced-colors.png` });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).hover();
  assert.notEqual(
    await page
      .getByRole('menuitem', { name: 'Move to Trash', exact: true })
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    await page.getByRole('menu').evaluate((node) => getComputedStyle(node).backgroundColor),
    'Forced colors preserve pointer menu highlighting',
  );
  await page.keyboard.press('Escape');
  await page.emulateMedia({ forcedColors: 'none' });
  console.log(
    'Finder focus passed: pointer/keyboard toolbar, clipped headers, tag input/token, menu and forced colors.',
  );
}
