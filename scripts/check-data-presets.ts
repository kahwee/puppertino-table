import assert from 'node:assert/strict';
import type { Page } from 'playwright';

export async function checkDataPresets(page: Page, base: string, evidence: string) {
  const frame = page.frameLocator('#storybook-preview-iframe');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/?path=/story/puppertino-table--default`);
  await frame.getByRole('table', { name: 'People', exact: true }).waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.locator('#control-dataPreset').selectOption({ label: 'Empty' });
  await frame.getByRole('checkbox', { name: 'Select all visible rows' }).waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLIFrameElement>('#storybook-preview-iframe')
        ?.contentDocument?.querySelectorAll('#storybook-root .pt-table tbody input').length === 0,
  );
  await page.locator('#control-dataPreset').selectOption({ label: '1,000 rows' });
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLIFrameElement>('#storybook-preview-iframe')
        ?.contentDocument?.querySelectorAll('#storybook-root .pt-table tbody tr').length === 1000,
  );
  await page.locator('#control-dataPreset').selectOption({ label: 'Read-only rows' });
  await frame.getByRole('checkbox', { name: 'Select Maya Chen', exact: true }).waitFor();
  assert.equal(
    await frame.getByRole('checkbox', { name: 'Select Maya Chen', exact: true }).isDisabled(),
    true,
  );
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('pre')].some((node) =>
      node.textContent?.includes('isRowSelectable={() => false}'),
    ),
  );

  await page.goto(`${base}/?path=/docs/puppertino-outline-view--docs`);
  const support = frame.locator('details.storybook-supporting');
  assert.equal(await support.getAttribute('open'), null);
  await support.locator('summary').click();
  await support.locator('pre').filter({ hasText: 'export function OutlineViewExample' }).waitFor();
  await page.screenshot({ path: `${evidence}/short-code-and-support.png` });

  await page.goto(`${base}/?path=/story/puppertino-finder-composition--composed`);
  await frame.getByRole('row', { name: /Brief.pdf/ }).waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.locator('#control-dataPreset').selectOption({ label: 'Read-only record' });
  await frame.getByRole('row', { name: /Brief.pdf/ }).click();
  await frame.getByLabel('Workspace selection').filter({ hasText: 'Read only' }).waitFor();
  assert.equal(await frame.getByRole('button', { name: 'Tags', exact: true }).isDisabled(), true);
  await frame.getByRole('button', { name: 'Actions', exact: true }).click();
  assert.equal(
    await frame
      .getByRole('menuitem', { name: 'Move to Trash', exact: true })
      .getAttribute('aria-disabled'),
    'true',
  );
  await page.keyboard.press('Escape');
  await page.locator('#control-dataPreset').selectOption({ label: '250 documents' });
  await frame.getByLabel('Document count').filter({ hasText: '200 items' }).waitFor();
  await page.locator('#control-dataPreset').selectOption({ label: 'Empty' });
  await frame.getByRole('heading', { name: 'No documents here', exact: true }).waitFor();
  await page.locator('#control-dataPreset').selectOption({ label: 'Standard' });
  await frame.getByRole('row', { name: /Brief.pdf/ }).waitFor();
  await page.locator('#control-query').fill('missing document');
  await frame.getByRole('heading', { name: 'No matching documents', exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Clear search', exact: true }).click();
  await frame.getByRole('row', { name: /Brief.pdf/ }).waitFor();
  await frame.getByRole('row', { name: /Brief.pdf/ }).click();
  await frame.getByRole('row', { name: /Notes.md/ }).click({ modifiers: ['Control'] });
  await frame.getByLabel('Workspace selection').filter({ hasText: '2 of 2 selected' }).waitFor();
  await frame.getByRole('button', { name: 'Actions', exact: true }).click();
  await frame.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
  await frame.getByLabel('Workspace activity').filter({ hasText: 'Moved 2 documents' }).waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLIFrameElement>('#storybook-preview-iframe')
        ?.contentDocument?.activeElement?.getAttribute('aria-label') === 'Document list',
  );
  await frame.getByRole('button', { name: 'Undo Trash', exact: true }).click();
  await frame
    .getByLabel('Workspace activity')
    .filter({ hasText: 'Restored 2 documents' })
    .waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLIFrameElement>('#storybook-preview-iframe')
        ?.contentDocument?.activeElement?.getAttribute('aria-label') === 'Document list',
  );
  await page.screenshot({ path: `${evidence}/workspace-selection-feedback.png` });
  await page.locator('#control-dataPreset').selectOption({ label: 'Long filenames' });
  await frame.getByRole('row', { name: /international launch.*Brief.pdf/ }).waitFor();
  await page.setViewportSize({ width: 750, height: 1000 });
  await frame.getByRole('row', { name: /international launch.*Brief.pdf/ }).waitFor();
  await page.screenshot({ path: `${evidence}/workspace-long-names-compact.png` });
  console.log(
    'Data presets passed: empty, large, read-only and long names; expandable code; shared selection, recovery, announcements and command focus.',
  );
}
