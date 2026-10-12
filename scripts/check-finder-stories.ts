import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';

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
    await page.addScriptTag({ content: axe.source });
    assert.deepEqual(
      await page.evaluate(async () =>
        (await window.axe.run(document)).violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ),
      [],
      story,
    );
    await page.screenshot({ path: `${evidence}/finder-${story}.png` });
    if (!story.includes('dark') && story !== 'narrow-columns') {
      await page.getByLabel('Toggle dark theme').click();
      assert.deepEqual(
        await page.evaluate(async () =>
          (await window.axe.run(document)).violations.map((v) => v.id),
        ),
        [],
        `${story} dark`,
      );
      await page.screenshot({ path: `${evidence}/finder-${story}-dark.png` });
    }
  }
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
  await page.getByRole('searchbox', { name: 'Search files' }).fill('budget');
  assert.equal(await page.getByRole('row').count(), 2);
  await page.getByRole('row').filter({ hasText: 'Budget.xlsx' }).waitFor();
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
  console.log(
    'Finder stories passed: four views, light/dark/narrow, axe, search, history, shared keyboard menus and reset.',
  );
}
