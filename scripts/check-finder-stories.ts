import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';
import { checkFinderFocus } from './check-finder-focus.js';
import { storyQuery } from './story-presets.mjs';
import { setStorybookTheme } from './storybook-theme.mjs';

declare global {
  interface Window {
    finderAxe: typeof axe;
  }
}

async function finderViolations(page: Page) {
  // Keep the test scanner separate from Storybook's concurrent addon scanner.
  await page.addScriptTag({
    content: `{ const previousAxe = window.axe; ${axe.source}
window.finderAxe = window.axe; window.axe = previousAxe; }`,
  });
  return page.evaluate(async () =>
    (await window.finderAxe.run(document)).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  );
}

export async function checkFinderStories(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1080, height: 640 });
  for (const story of [
    'file-table',
    'column-workspace',
    'icon-workspace',
    'gallery-workspace',
    'outline-workspace',
    'narrow-columns',
  ]) {
    await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--${story}`)}`);
    const app = page.getByRole('region', { name: 'Finder-style demo' });
    await app.waitFor();
    assert.deepEqual(await finderViolations(page), [], story);
    await page.screenshot({ path: `${evidence}/finder-${story}.png` });
    await setStorybookTheme(page, 'dark');
    assert.deepEqual(await finderViolations(page), [], `${story} dark`);
    await page.screenshot({ path: `${evidence}/finder-${story}-dark.png` });
  }
  // Check the same modal in both themes through the shared Storybook globals.
  await page.goto(`${base}/iframe.html?id=examples-finder--file-table&viewMode=story`);
  await page.getByRole('row', { name: /Project brief.pdf/ }).click();
  await page.keyboard.press('Space');
  await page.getByRole('dialog', { name: 'Quick Look' }).waitFor();
  for (const theme of ['light', 'dark']) {
    await setStorybookTheme(page, theme);
    assert.deepEqual(await finderViolations(page), [], `Quick Look ${theme}`);
  }
  await page.keyboard.press('Escape');
  // Mix native checkboxes, row keyboard gestures and view changes through one anchor.
  await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--checkbox-selection`)}`);
  const rows = page.getByRole('table', { name: 'Project files', exact: true }).locator('tbody tr');
  await page.getByRole('checkbox', { name: 'Select Project brief.pdf', exact: true }).check();
  await rows.nth(2).press('Shift+Enter');
  assert.equal(await page.locator('tbody input:checked').count(), 3, 'checkbox anchors row ranges');
  await page
    .getByRole('checkbox', { name: 'Select Research notes.txt', exact: true })
    .click({ modifiers: ['Shift'] });
  assert.equal(
    await page.locator('tbody input:checked').count(),
    2,
    'checkbox range shrinks from shared anchor',
  );
  await page.getByRole('button', { name: 'Icons', exact: true }).click();
  await page
    .getByRole('button', { name: 'Cover artwork.png PNG image', exact: true })
    .click({ modifiers: ['Shift'] });
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select Project brief.pdf', exact: true }).waitFor();
  assert.equal(
    await page.locator('tbody input:checked').count(),
    4,
    'range anchor survives a view change',
  );
  await finderCommand(page, 'Deselect All');
  await rows.nth(1).click();
  await page
    .getByRole('checkbox', { name: 'Select Cover artwork.png', exact: true })
    .click({ modifiers: ['Shift'] });
  assert.equal(await page.locator('tbody input:checked').count(), 3, 'row anchors checkbox ranges');
  await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--file-table`)}`);
  const favorites = page.getByRole('navigation', { name: 'Favorites' });
  assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).isDisabled(), true);
  await favorites.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('heading', { name: 'Archive', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('heading', { name: 'Projects', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Forward', exact: true }).click();
  await page.getByRole('heading', { name: 'Archive', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  for (const theme of ['dark', 'light']) {
    await setStorybookTheme(page, theme);
    const search = page.getByRole('searchbox', { name: 'Search files' });
    await search.focus();
    const appearance = await search.evaluate((input) => {
      const field = input.parentElement as HTMLElement;
      const bounds = input.getBoundingClientRect();
      const fieldBounds = field.getBoundingClientRect();
      return {
        extraIcons: field.querySelectorAll('svg').length,
        nativeIcon: getComputedStyle(field, '::before').maskImage !== 'none',
        outerOutline: getComputedStyle(field).outlineStyle,
        outerShadow: getComputedStyle(field).boxShadow,
        widthDifference: Math.abs(bounds.width - fieldBounds.width),
        height: bounds.height,
      };
    });
    assert.deepEqual(
      appearance,
      {
        extraIcons: 0,
        nativeIcon: true,
        outerOutline: 'none',
        outerShadow: 'none',
        widthDifference: 0,
        height: 36,
      },
      `${theme}: Puppertino owns the single search glyph and input capsule`,
    );
  }

  await page.getByRole('searchbox', { name: 'Search files' }).fill('budget');
  assert.equal(await page.getByRole('row').count(), 2);
  await page.getByRole('row').filter({ hasText: 'Budget.xlsx' }).waitFor();
  await page.getByRole('searchbox', { name: 'Search files' }).press('Escape');
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Search');
  assert.equal(await page.getByRole('searchbox', { name: 'Search files' }).count(), 0);
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).waitFor();
  await page.keyboard.press('Space');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Search files',
  );
  await page.getByRole('searchbox', { name: 'Search files' }).fill('budget');
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.getByRole('region', { name: 'Workspace columns' }).waitFor();
  await page.getByRole('button', { name: 'Budget.xlsx', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Project brief.pdf', exact: true }).count(),
    0,
  );
  await page.getByRole('button', { name: 'Icons', exact: true }).click();
  const budgetIcon = page.getByRole('button', { name: 'Budget.xlsx Spreadsheet', exact: true });
  await budgetIcon.click();
  await budgetIcon.focus();
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Get Info', exact: true }).click();
  await page.getByRole('complementary', { name: 'File details' }).waitFor();
  await page.getByRole('button', { name: 'Close details' }).click();
  assert.equal(await budgetIcon.getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Gallery', exact: true }).click();
  await page.getByRole('heading', { name: 'Budget.xlsx', exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Search files' }).fill('no matching file');
  await page.getByText('No file selected', { exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Search files' }).fill('');
  await page.getByRole('button', { name: 'Research notes.txt', exact: true }).focus();
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Move to Archive', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Research notes.txt', exact: true }).count(),
    0,
  );
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Research notes.txt', exact: true }).waitFor();
  await page.setViewportSize({ width: 560, height: 640 });
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.getByRole('region', { name: 'Workspace columns' }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
    'Narrow chrome does not overflow the page; columns scroll inside the browser',
  );
  await page.screenshot({ path: `${evidence}/finder-narrow-viewport.png` });
  await page.setViewportSize({ width: 1080, height: 640 });
  await checkFinderBulkActions(page, base, evidence);
  await checkFinderTags(page, base, evidence);
  await checkFinderFocus(page, base, evidence);
  await checkFinderOutline(page, base, evidence);
  console.log(
    'Finder stories passed: five views, light/dark/narrow, axe, search, history, shared keyboard menus and reset.',
  );
}

async function checkFinderBulkActions(page: Page, base: string, evidence: string) {
  const favorites = page.getByRole('navigation', { name: 'Favorites' });
  const summary = page.getByLabel('Selection summary');
  const remove = () => finderCommand(page, 'Move to Trash');
  const selectAll = async (_view: string) => finderCommand(page, 'Select All');
  for (const [story, view] of [
    ['file-table', 'list'],
    ['icon-workspace', 'icons'],
    ['column-workspace', 'columns'],
    ['gallery-workspace', 'gallery'],
    ['outline-workspace', 'outline'],
  ]) {
    await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--${story}`)}`);
    await page.getByRole('heading', { name: 'Projects', exact: true }).waitFor();
    assert.equal(await commandDisabled(page, 'Move to Trash'), true);
    if (view === 'list' || view === 'outline') {
      await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
      await page
        .getByRole('row')
        .filter({ hasText: 'Budget.xlsx' })
        .click({ modifiers: ['Control'] });
    } else {
      const suffix = view === 'icons' ? ' PDF document' : '';
      await page.getByRole('button', { name: `Project brief.pdf${suffix}`, exact: true }).click();
      await page
        .getByRole('button', {
          name: view === 'icons' ? 'Budget.xlsx Spreadsheet' : 'Budget.xlsx',
          exact: true,
        })
        .click({ modifiers: ['Control'] });
    }
    assert.match(await summary.innerText(), /2 of 6 selected/);
    if (view === 'list') await page.screenshot({ path: `${evidence}/finder-bulk-selection.png` });
    await remove();
    assert.match(await summary.innerText(), /4 items/);
    await finderCommand(page, 'Undo Move to Trash');
    assert.match(await summary.innerText(), /6 items/);
    await selectAll(view);
    await remove();
    assert.match(await summary.innerText(), /0 items/);
    await favorites.getByRole('button', { name: 'Trash', exact: true }).click();
    assert.match(await summary.innerText(), /6 items/);
    await selectAll(view);
    await finderCommand(page, 'Put Back');
    assert.match(await summary.innerText(), /0 items/);
    assert.equal(await commandDisabled(page, 'Undo Move to Trash'), true);
    await favorites.getByRole('button', { name: 'Projects', exact: true }).click();
    assert.match(await summary.innerText(), /6 items/);
  }
  await page.getByRole('button', { name: 'Icons', exact: true }).click();
  await page.getByRole('button', { name: 'Project brief.pdf PDF document', exact: true }).click();
  await page
    .getByRole('button', { name: 'Budget.xlsx Spreadsheet', exact: true })
    .click({ modifiers: ['Shift'] });
  assert.match(await summary.innerText(), /3 of 6 selected/, 'Shift extends a visible file range');
  await finderCommand(page, 'Deselect All');
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
  await page
    .getByRole('row')
    .filter({ hasText: 'Budget.xlsx' })
    .click({ modifiers: ['Control'] });
  for (const view of ['Icons', 'Columns', 'Gallery', 'List']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    assert.match(await summary.innerText(), /2 of 6 selected/, 'selection survives changing views');
  }
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search files' }).fill('brief');
  assert.equal(
    await commandDisabled(page, 'Move to Trash'),
    true,
    'search clears selection before a bulk action',
  );
  await selectAll('list');
  await remove();
  await page.getByRole('searchbox', { name: 'Search files' }).fill('');
  await page.getByRole('row').filter({ hasText: 'Budget.xlsx' }).waitFor();
  assert.match(await summary.innerText(), /5 items/, 'hidden search results were not deleted');
  await finderCommand(page, 'Undo Move to Trash');
  await page
    .getByRole('row')
    .filter({ hasText: 'Budget.xlsx' })
    .click({ modifiers: ['Control'] });
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
  assert.equal(
    await page.getByRole('row').filter({ hasText: 'Budget.xlsx' }).count(),
    1,
    'context action on an unselected file does not delete selected siblings',
  );
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await selectAll('list');
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).focus();
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
  assert.match(await summary.innerText(), /0 items/);
  await favorites.getByRole('button', { name: 'Trash', exact: true }).click();
  await selectAll('list');
  await page.screenshot({ path: `${evidence}/finder-trash.png` });
  assert.deepEqual(await finderViolations(page), [], 'Trash and bulk action accessibility');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await favorites.getByRole('button', { name: 'Trash', exact: true }).click();
  assert.match(await summary.innerText(), /0 items/, 'reset empties Trash');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
  await page
    .getByRole('row')
    .filter({ hasText: 'Budget.xlsx' })
    .click({ modifiers: ['Control'] });
  await page
    .getByRole('row')
    .filter({ hasText: 'Project brief.pdf' })
    .dragTo(favorites.getByRole('button', { name: 'Archive', exact: true }));
  assert.match(await summary.innerText(), /4 items/, 'dragging a selected file moves the group');
  await favorites.getByRole('button', { name: 'Archive', exact: true }).click();
  assert.match(await summary.innerText(), /2 items/);
  await selectAll('list');
  await remove();
  await favorites.getByRole('button', { name: 'Trash', exact: true }).click();
  await selectAll('list');
  await finderCommand(page, 'Put Back');
  await favorites.getByRole('button', { name: 'Archive', exact: true }).click();
  assert.match(await summary.innerText(), /2 items/, 'restore returns archived files to Archive');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await selectAll('list');
  await page.setViewportSize({ width: 390, height: 760 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
    'bulk actions wrap on narrow screens',
  );
  await page.screenshot({ path: `${evidence}/finder-bulk-narrow.png` });
  await page.setViewportSize({ width: 1080, height: 640 });
  console.log(
    'Finder bulk actions passed: shared selection, five-view delete/undo/restore, hidden-result safety, keyboard context commands, Trash and narrow accessibility.',
  );
}

async function finderCommand(page: Page, name: string) {
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page
    .getByRole('menu', { name: 'Finder actions' })
    .getByRole('menuitem', { name, exact: true })
    .click();
}
async function commandDisabled(page: Page, name: string) {
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  const disabled = await page
    .getByRole('menu', { name: 'Finder actions' })
    .getByRole('menuitem', { name, exact: true })
    .isDisabled();
  await page.keyboard.press('Escape');
  return disabled;
}

async function checkFinderTags(page: Page, base: string, evidence: string) {
  await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--file-table`)}`);
  const rows = page.getByRole('table', { name: 'Project files', exact: true }).locator('tbody tr');
  assert.equal(
    await page.getByRole('button', { name: 'Move to Trash', exact: true }).count(),
    0,
    'delete is only exposed in menus',
  );
  assert.equal(await page.getByRole('checkbox').count(), 0, 'native Finder uses row selection');
  await rows.nth(0).click();
  await rows.nth(2).click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Assign tags' });
  await dialog.getByRole('option', { name: 'Review', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove tag Review', exact: true }).waitFor();
  assert.equal(
    await dialog.getByRole('option', { name: 'Review', exact: true }).count(),
    0,
    'assigned tag becomes a token, not a suggestion',
  );
  await dialog.getByRole('combobox', { name: 'Tag name' }).fill('Client');
  await page.keyboard.press('Enter');
  await dialog.getByRole('button', { name: 'Remove tag Client', exact: true }).waitFor();
  assert.deepEqual(await finderViolations(page), [], 'tag popover accessibility');
  await page.screenshot({ path: `${evidence}/finder-tags.png` });
  await page.keyboard.press('Escape');
  assert.equal(
    await page
      .getByRole('button', { name: 'Tags', exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  const sidebar = page.getByRole('navigation', { name: 'Favorites' });
  await sidebar.getByRole('button', { name: 'Client', exact: true }).click();
  await page.getByRole('heading', { name: 'Client', exact: true }).waitFor();
  assert.equal(await rows.count(), 2, 'sidebar tag finds assigned files');
  await rows.nth(0).click();
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove tag Review', exact: true }).click();
  await page.keyboard.press('Escape');
  await sidebar.getByRole('button', { name: 'Review', exact: true }).click();
  assert.equal(await rows.count(), 1, 'removing a token updates tag filtering');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  assert.equal(
    await sidebar.getByRole('button', { name: 'Client', exact: true }).count(),
    0,
    'reset clears custom tags',
  );
  await rows.nth(0).click();
  await setStorybookTheme(page, 'dark');
  await page.setViewportSize({ width: 390, height: 760 });
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  const bounds = await dialog.boundingBox();
  assert.ok(
    bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390,
    'tag popover stays within a narrow viewport',
  );
  assert.deepEqual(await finderViolations(page), [], 'dark tag popover accessibility');
  await page.screenshot({ path: `${evidence}/finder-tags-dark-narrow.png` });
  await page.setViewportSize({ width: 1080, height: 640 });
  console.log(
    'Finder tags passed: bulk assignment, tokens, creation, removal, sidebar filters, Escape focus and accessibility.',
  );
}

export async function checkFinderOutline(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${base}/iframe.html?${storyQuery('examples-finder--outline-workspace')}`);
  const grid = page.getByRole('treegrid', { name: 'Project file hierarchy' });
  await grid.waitFor();
  const brief = grid.locator('[data-file-id="brief"]');
  await brief.click();
  assert.equal(await brief.getAttribute('aria-selected'), 'true');
  const summary = page.getByLabel('Selection summary');
  assert.equal(await summary.textContent(), '1 of 6 selected');
  await page.getByRole('button', { name: 'Collapse PDFs', exact: true }).click();
  assert.equal(await brief.count(), 0);
  assert.equal(
    await commandDisabled(page, 'Move to Trash'),
    true,
    'Collapsed selections cannot become bulk command targets',
  );
  await page.getByRole('button', { name: 'List', exact: true }).click();
  const listBrief = page.getByRole('table').locator('[data-file-id="brief"]');
  assert.equal(
    (await listBrief.getAttribute('class'))?.includes('p-selected'),
    true,
    'File selection survives view changes',
  );
  const handle = page.getByRole('separator', { name: 'Resize Name column' });
  await handle.focus();
  await handle.press('ArrowRight');
  const width = await handle.getAttribute('aria-valuenow');
  await page.getByRole('button', { name: 'Outline', exact: true }).click();
  assert.equal(
    await page.getByRole('separator', { name: 'Resize Name column' }).getAttribute('aria-valuenow'),
    width,
    'List and Outline share widths',
  );
  await page.getByRole('button', { name: 'Expand PDFs', exact: true }).click();
  assert.equal(await brief.getAttribute('aria-selected'), 'true');
  await brief.click({ modifiers: ['Control'] });
  assert.equal(
    await brief.getAttribute('aria-selected'),
    'false',
    'Custom row hooks do not double-toggle selection',
  );
  await brief.focus();
  await brief.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'File actions' });
  await menu.waitFor();
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  const rename = page.getByRole('textbox', { name: 'New filename' });
  await rename.waitFor();
  assert.equal(
    await rename.evaluate((element) => element === document.activeElement),
    true,
    'Menu command does not steal modal input focus',
  );
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await brief.click();
  await brief.press('ArrowLeft');
  assert.equal(
    await grid
      .locator('[data-outline-id]')
      .filter({ hasText: 'PDFs' })
      .evaluate((element) => element === document.activeElement),
    true,
    'Left returns to the parent group',
  );
  await brief.focus();
  await brief.press('Control+1');
  await page.getByRole('button', { name: 'Project brief.pdf PDF document', exact: true }).waitFor();
  await page.keyboard.press('Control+5');
  await brief.waitFor();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-file-id') === 'brief',
  );
  await brief.dblclick();
  await page.getByRole('dialog', { name: 'Quick Look' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Quick Look' }).waitFor({ state: 'hidden' });
  for (const theme of ['light', 'dark']) {
    await setStorybookTheme(page, theme);
    await brief.click({ button: 'right' });
    await menu.waitFor();
    assert.deepEqual(await finderViolations(page), [], `Outline ${theme} with Base UI menu`);
    await page.screenshot({ path: `${evidence}/finder-outline-${theme}.png` });
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(await finderViolations(page), [], 'Narrow outline accessibility');
  await page.screenshot({ path: `${evidence}/finder-outline-narrow.png` });
  console.log(
    'Finder Outline passed: shared selection/widths, collapse safety, row-hook cancellation, hierarchy keys, view focus, menus, rename, Quick Look, and light/dark/narrow accessibility.',
  );
}
