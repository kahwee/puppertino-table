import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';

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
    'dark-columns',
    'narrow-columns',
  ]) {
    await page.goto(`${base}/iframe.html?id=examples-finder--${story}&viewMode=story`);
    const app = page.getByRole('region', { name: 'Finder-style demo' });
    await app.waitFor();
    assert.deepEqual(await finderViolations(page), [], story);
    await page.screenshot({ path: `${evidence}/finder-${story}.png` });
    if (!story.includes('dark') && story !== 'narrow-columns') {
      await page.getByLabel('Toggle dark theme').click();
      assert.deepEqual(await finderViolations(page), [], `${story} dark`);
      await page.screenshot({ path: `${evidence}/finder-${story}-dark.png` });
    }
  }
  // Mix native checkboxes, row keyboard gestures and view changes through one anchor.
  await page.goto(`${base}/iframe.html?id=examples-finder--checkbox-selection&viewMode=story`);
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
  await page.goto(`${base}/iframe.html?id=examples-finder--file-table&viewMode=story`);
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
  console.log(
    'Finder stories passed: four views, light/dark/narrow, axe, search, history, shared keyboard menus and reset.',
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
  ]) {
    await page.goto(`${base}/iframe.html?id=examples-finder--${story}&viewMode=story`);
    await page.getByRole('heading', { name: 'Projects', exact: true }).waitFor();
    assert.equal(await commandDisabled(page, 'Move to Trash'), true);
    if (view === 'list') {
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
    'Finder bulk actions passed: shared selection, four-view delete/undo/restore, hidden-result safety, keyboard context commands, Trash and narrow accessibility.',
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
  await page.goto(`${base}/iframe.html?id=examples-finder--file-table&viewMode=story`);
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
  await page.getByLabel('Toggle dark theme').click();
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
