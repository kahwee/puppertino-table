import assert from 'node:assert/strict';
import axe from 'axe-core';
import type { Page } from 'playwright';

export async function checkPagedWorkspace(page: Page, base: string, evidence: string) {
  const frame = page.frameLocator('#storybook-preview-iframe');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/?path=/story/puppertino-table--default`);
  await frame.getByRole('table', { name: 'People', exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Sort by Score' }).click();
  await page.getByRole('tab', { name: /^Actions/ }).click();
  await page.getByText('onSortingChange', { exact: true }).first().waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.locator('pre').filter({ hasText: "from './table-data'" }).waitFor();
  const code = (await page.locator('pre').allTextContents()).find((code) =>
    code.includes("from './table-data'"),
  );
  assert.ok(code && code.split('\n').length <= 30, 'the primary integration remains concise');

  // Manual Controls checks start without racing the default automated replay.
  await page.goto(`${base}/?path=/story/puppertino-table--paginated-selection&args=pageSize:5`);
  await frame.getByRole('button', { name: 'Reset example' }).waitFor();
  await frame.getByRole('button', { name: 'Reset example' }).click();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await frame.getByRole('checkbox', { name: 'Select all visible rows' }).click();
  await frame.getByRole('button', { name: 'Next page' }).click();
  await frame
    .getByLabel('Total selected')
    .filter({ hasText: '2 selected · 0 on this page' })
    .waitFor();
  await page.locator('#control-query').fill('Engineering');
  await frame.getByLabel('People page').filter({ hasText: 'Page 1 of 2' }).waitFor();
  assert.equal(
    await frame.getByRole('searchbox', { name: 'Filter people' }).inputValue(),
    'Engineering',
  );
  await frame.getByRole('searchbox', { name: 'Filter people' }).fill('missing teammate');
  await page.waitForFunction(
    () => document.querySelector<HTMLInputElement>('#control-query')?.value === 'missing teammate',
  );
  await frame.getByText('No matching people', { exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Clear search' }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLIFrameElement>('#storybook-preview-iframe')
        ?.contentDocument?.activeElement?.getAttribute('aria-label') === 'Filter people',
  );
  await frame
    .getByLabel('Total selected')
    .filter({ hasText: '2 selected · 2 on this page' })
    .waitFor();
  await page.locator('#control-pageSize').selectOption('25');
  await frame.getByLabel('People page').filter({ hasText: 'Page 1 of 1' }).waitFor();
  assert.equal(await frame.getByRole('button', { name: 'Next page' }).isDisabled(), true);
  await page.locator('#control-dataPreset').selectOption({ label: '1,000 rows' });
  await frame.getByLabel('People page').filter({ hasText: '1–25 of 1000' }).waitFor();
  await frame.getByLabel('Total selected').filter({ hasText: '0 selected' }).waitFor();
  await frame.getByRole('checkbox', { name: 'Select all visible rows' }).click();
  await frame.getByRole('button', { name: 'Next page' }).click();
  await frame
    .getByLabel('Total selected')
    .filter({ hasText: '25 selected · 0 on this page' })
    .waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.locator('pre').filter({ hasText: 'pageSize={25}' }).waitFor();
  await page.screenshot({ path: `${evidence}/paged-workspace.png` });
  await frame.getByRole('button', { name: 'Reset example' }).click();
  await frame.getByLabel('People page').filter({ hasText: 'Page 1 of 6' }).waitFor();
  await frame.getByLabel('Total selected').filter({ hasText: '0 selected' }).waitFor();

  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 390, height: 950 });
    await page.goto(
      `${base}/iframe.html?id=puppertino-table--paginated-selection&args=dataPreset:large;pageSize:25&globals=theme:${theme}`,
    );
    await page.getByRole('table', { name: 'Paged people' }).waitFor();
    await page.locator(theme === 'dark' ? 'html.p-dark-mode' : 'html:not(.p-dark-mode)').waitFor();
    // Theme transitions must finish before measuring text contrast.
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await Promise.allSettled(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished),
      );
    });
    // Keep this probe independent of Storybook's automatic axe instance.
    await page.addScriptTag({ content: `${axe.source}\nwindow.pagedWorkspaceAxe = window.axe;` });
    const violations = await page.evaluate(async () => {
      const result = await (
        window as unknown as { pagedWorkspaceAxe: typeof axe }
      ).pagedWorkspaceAxe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      });
      return result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      }));
    });
    assert.deepEqual(violations, [], `${theme} compact workspace is accessible`);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'only the table scrolls horizontally',
    );
    await page.screenshot({ path: `${evidence}/paged-workspace-${theme}-compact.png` });
  }
  console.log(
    'Paged workspace passed: Actions spies, concise Code, synchronized args, global ordering, off-page atom selection, empty recovery focus, reset, and compact light/dark accessibility.',
  );
}
