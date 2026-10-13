import assert from 'node:assert/strict';
import type { Page } from 'playwright';

/** Verify native scenario navigation, matching Code and resets through the actual manager. */
export async function checkStorybookQuality(page: Page, base: string, evidence: string) {
  const frame = page.frameLocator('#storybook-preview-iframe');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/?path=/docs/puppertino-table--docs`);
  await frame.getByRole('link', { name: 'Comfortable, disabled table', exact: true }).click();
  await page.waitForURL(
    (url) => url.searchParams.get('path') === '/story/puppertino-table--default',
  );
  await frame.getByRole('table', { name: 'People', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.waitForFunction(
    (marker) =>
      [...document.querySelectorAll('pre')].some((node) => node.textContent?.includes(marker)),
    'density="comfortable"',
  );
  assert.ok(
    (await page.locator('pre').allTextContents()).some((code) => code.includes('disabled={true}')),
  );
  await frame.getByRole('button', { name: 'Reset example', exact: true }).click();
  await page.waitForFunction(
    (marker) =>
      [...document.querySelectorAll('pre')].some((node) => node.textContent?.includes(marker)),
    'density="native"',
  );
  await frame.getByRole('button', { name: 'Sort by Score', exact: true }).click();

  await page.goto(`${base}/?path=/story/puppertino-table--selection`);
  await frame.getByLabel('Checked rows').waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.locator('input[name="control-stateOwner"][value="atoms"]').check();
  await frame.getByLabel('Atom name width').waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('pre')].some((node) =>
      node.textContent?.includes('atoms={{ columnSizing, sorting, rowSelection }}'),
    ),
  );

  await page.goto(`${base}/?path=/story/puppertino-finder-composition--composed`);
  await frame.getByRole('row', { name: /Brief.pdf/ }).click();
  await frame
    .getByRole('region', { name: 'Document preview', exact: true })
    .getByRole('heading', { name: 'Brief.pdf' })
    .waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await frame.getByRole('button', { name: 'Hide preview', exact: true }).click();
  await frame
    .getByRole('region', { name: 'Document preview', exact: true })
    .waitFor({ state: 'hidden' });
  await frame
    .getByRole('navigation', { name: 'Workspace panes' })
    .getByRole('button', { name: 'Preview', exact: true })
    .click();
  await frame.getByRole('region', { name: 'Document preview', exact: true }).waitFor();
  await frame
    .getByRole('navigation', { name: 'Document locations' })
    .getByRole('button', { name: /^Archive/ })
    .click();
  await frame.getByRole('row', { name: /Launch report.pdf/ }).waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>('input[name="control-section"][value="Archive"]')
        ?.checked,
  );
  await frame.getByRole('button', { name: 'Reset example', exact: true }).click();
  await frame.getByRole('row', { name: /Brief.pdf/ }).waitFor();
  await page.screenshot({ path: `${evidence}/document-workspace.png` });
  await page.setViewportSize({ width: 750, height: 1000 });
  await frame.getByRole('region', { name: 'Document collection', exact: true }).waitFor();
  await frame
    .getByRole('navigation', { name: 'Workspace panes' })
    .getByRole('button', { name: 'Locations', exact: true })
    .click();
  await frame.getByRole('region', { name: 'Locations', exact: true }).waitFor();
  await page.screenshot({ path: `${evidence}/document-workspace-compact.png` });
  await page.setViewportSize({ width: 1440, height: 1100 });

  await page.goto(
    `${base}/?path=/story/puppertino-outline-view--default&args=loadingDelay:0;simulateError:false`,
  );
  await frame.getByRole('button', { name: 'Expand Projects', exact: true }).click();
  await frame.getByRole('button', { name: 'Expand Source', exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Reset example', exact: true }).click();
  await frame.getByRole('button', { name: 'Expand Projects', exact: true }).waitFor();
  assert.equal(await frame.getByRole('button', { name: 'Expand Source', exact: true }).count(), 0);
  await frame.getByRole('button', { name: 'Expand Archive', exact: true }).click();
  await frame.getByRole('button', { name: 'Retry Archive', exact: true }).waitFor();

  await page.goto(`${base}/?path=/story/puppertino-split-view--default`);
  await frame.getByRole('separator', { name: 'Resize Sidebar pane' }).press('ArrowRight');
  await frame.getByLabel('Committed pane sizes').filter({ hasText: '216' }).waitFor();
  await frame.getByRole('button', { name: 'Reset example', exact: true }).click();
  await frame
    .getByLabel('Committed pane sizes')
    .filter({ hasText: /^\{\}$/ })
    .waitFor();

  await page.goto(`${base}/?path=/story/puppertino-tag-picker--assigned`);
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  await frame.getByRole('combobox', { name: 'Tag name' }).fill('Client');
  await frame.getByRole('option', { name: /Create tag/ }).click();
  await frame.getByRole('button', { name: 'Remove tag Client', exact: true }).waitFor();
  await frame.getByRole('combobox', { name: 'Tag name' }).press('Escape');
  await frame.getByRole('button', { name: 'Reset example', exact: true }).click();
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  await frame.getByRole('button', { name: 'Remove tag Review', exact: true }).waitFor();
  assert.equal(await frame.getByRole('option', { name: 'Client', exact: true }).count(), 0);
  assert.equal(
    await frame.getByRole('button', { name: 'Remove tag Client', exact: true }).count(),
    0,
  );
  const codeIncludes = async (marker: string) =>
    page.waitForFunction(
      (text) =>
        [...document.querySelectorAll('pre')].some((node) => node.textContent?.includes(text)),
      marker,
    );
  await page.goto(
    `${base}/?path=/story/puppertino-tag-picker--assigned&args=allowCreation:false;optionSet:disabledTags`,
  );
  await frame.getByRole('button', { name: 'Tags', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await codeIncludes('disabled": true');
  assert.ok(
    (await page.locator('pre').allTextContents()).some(
      (code) => code.includes('DocumentTags') && !code.includes('onCreate='),
    ),
  );
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.locator('input[name="allowCreation"]').press('Space');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await codeIncludes('onCreate=');

  await page.goto(
    `${base}/?path=/story/puppertino-outline-view--default&args=loadingDelay:1200;simulateError:false;density:compact`,
  );
  await frame.getByRole('treegrid').waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await codeIncludes('loadingDelay={1200}');
  await codeIncludes('simulateError={false}');
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.locator('input[name="simulateError"]').press('Space');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await codeIncludes('simulateError={true}');

  await page.goto(
    `${base}/?path=/story/puppertino-split-view--default&args=orientation:vertical;container:compact;sidebarHidden:true`,
  );
  await frame.getByRole('region', { name: 'Content', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await codeIncludes('orientation={"vertical"}');
  await codeIncludes('width: 390');
  await codeIncludes('useState(true)');
  await page.goto(`${base}/?path=/docs/start-here-overview--docs`);
  await frame.locator('pre').filter({ hasText: 'pnpm add puppertino-table@' }).waitFor();
  await frame.getByRole('navigation', { name: 'State ownership choices' }).waitFor();
  await frame.getByRole('navigation', { name: 'State ownership choices' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${evidence}/integration-guide.png` });
  await frame
    .getByRole('navigation', { name: 'State ownership choices' })
    .getByRole('link', { name: /^React/ })
    .click();
  await page.waitForURL(
    (url) => url.searchParams.get('path') === '/story/puppertino-table--selection',
  );
  await frame.getByLabel('Checked rows').waitFor();
  await page.goto(`${base}/?path=/docs/puppertino-table--docs`);
  await frame.getByRole('link', { name: 'Select across pages', exact: true }).click();
  await page.waitForURL(
    (url) => url.searchParams.get('path') === '/story/puppertino-table--paginated-selection',
  );
  await page.getByRole('tab', { name: 'Interactions', exact: true, selected: true }).waitFor();
  await page.getByText('Return to the selected first page', { exact: false }).waitFor();
  console.log(
    'Story quality passed: typed scenario links, matching configuration/ownership Code, full data resets, synchronized archive/preview controls, and compact workspace navigation.',
  );
}
