import assert from 'node:assert/strict';
import type { Page } from 'playwright';

function trackPlaygroundArgs() {
  const state = {} as Record<string, Record<string, unknown>>;
  Object.assign(window, { playgroundArgs: state });
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data?.event?.type === 'storyArgsUpdated') {
        const result = data.event.args[0];
        state[result.storyId] = result.args;
      }
    } catch {
      /* Ignore messages outside the Storybook channel. */
    }
  });
}

/** Exercise the actual manager Controls panel, including changes initiated inside the examples. */
export async function checkPlaygroundControls(page: Page, base: string, evidence: string) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/?path=/story/puppertino-column-view--column-workspace`);
  const frame = page.frameLocator('#storybook-preview-iframe');
  const files = frame.getByRole('region', { name: 'Project folders', exact: true });
  await files.waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.addInitScript(trackPlaygroundArgs);
  await page.evaluate(trackPlaygroundArgs);

  const summary = frame.getByLabel('Resource selection count');
  await files
    .getByRole('button', { name: 'Review note 03.txt', exact: true })
    .click({ modifiers: ['Control'] });
  assert.equal(await summary.textContent(), '2 selected');
  await frame.getByRole('button', { name: 'Toggle inspector' }).click();

  await page.locator('input[name="control-density"][value="comfortable"]').check();
  await frame.getByRole('combobox', { name: 'Density', exact: true }).waitFor();
  await page.waitForFunction(() => {
    const frame = document.querySelector<HTMLIFrameElement>('#storybook-preview-iframe');
    return (
      frame?.contentDocument?.querySelector<HTMLSelectElement>('[aria-label="Density"]')?.value ===
      'comfortable'
    );
  });
  await page.waitForFunction(
    () =>
      (window as unknown as { playgroundArgs: Record<string, Record<string, unknown>> })
        .playgroundArgs['puppertino-column-view--column-workspace']?.density === 'comfortable',
  );
  assert.equal(await summary.textContent(), '2 selected', 'Controls preserve workspace selection');
  await frame.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
  await page.locator('input[name="control-density"][value="compact"]').waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>('input[name="control-density"][value="compact"]')
        ?.checked,
  );

  await page.locator('#control-widthMode').selectOption({ label: 'Read only' });
  await page.waitForFunction(() => {
    const frame = document.querySelector<HTMLIFrameElement>('#storybook-preview-iframe');
    return frame?.contentDocument?.querySelectorAll('[role="separator"]').length === 0;
  });
  await page.locator('#control-widthMode').selectOption({ label: 'Controlled' });
  await files.getByRole('separator').first().waitFor();
  await frame.getByRole('checkbox', { name: 'Disable resizing', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector<HTMLInputElement>('input[name="resizeDisabled"]')?.checked,
  );
  await frame.getByRole('checkbox', { name: 'Disable resizing', exact: true }).click();

  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>('input[name="resizeDisabled"]')?.checked === false,
  );
  await frame.getByRole('button', { name: 'Toggle narrow layout' }).click();
  await page.waitForFunction(
    () => document.querySelector<HTMLInputElement>('input[name="narrow"]')?.checked,
  );
  await page.locator('input[name="control-view"][value="table"]').check();
  await frame.getByRole('table', { name: 'Project resources', exact: true }).waitFor();
  assert.equal(await summary.textContent(), '2 selected', 'Changing layout preserves selection');
  assert.equal(
    await frame.getByRole('complementary', { name: 'Resource details' }).isVisible(),
    true,
    'Changing layout preserves inspector state',
  );
  await page.locator('#control-widthMode').waitFor({ state: 'hidden' });
  await page.screenshot({ path: `${evidence}/resource-playground-controls.png` });

  await page.goto(`${base}/?path=/story/examples-finder--file-table`);
  const project = frame.getByRole('row').filter({ hasText: 'Project brief.pdf' });
  await project.click({ button: 'right' });
  await frame.getByRole('menuitem', { name: 'Move to Archive', exact: true }).click();
  await frame.getByRole('row').filter({ hasText: 'Budget.xlsx' }).click();
  const finderSummary = frame.getByLabel('Selection summary');
  assert.equal(await finderSummary.textContent(), '1 of 5 selected');
  await page.locator('input[name="control-initialView"][value="icons"]').check();
  await frame.getByRole('button', { name: /^Budget\.xlsx/ }).waitFor();
  assert.equal(
    await finderSummary.textContent(),
    '1 of 5 selected',
    'Finder args preserve selection and moved files',
  );
  assert.equal(await frame.getByRole('button', { name: /^Project brief\.pdf/ }).count(), 0);
  await frame.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>('input[name="control-initialView"][value="columns"]')
        ?.checked,
  );
  await page.locator('input[name="control-initialDensity"][value="comfortable"]').check();
  await page.waitForFunction(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('#storybook-preview-iframe');
    return (
      iframe?.contentDocument?.querySelector<HTMLSelectElement>('[aria-label="Row density"]')
        ?.value === 'comfortable'
    );
  });
  await page.waitForFunction(
    () =>
      (window as unknown as { playgroundArgs: Record<string, Record<string, unknown>> })
        .playgroundArgs['examples-finder--file-table']?.initialDensity === 'comfortable',
  );
  assert.equal(await finderSummary.textContent(), '1 of 5 selected');
  await frame.getByRole('combobox', { name: 'Row density' }).selectOption('compact');
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLInputElement>(
        'input[name="control-initialDensity"][value="compact"]',
      )?.checked,
  );
  await page.screenshot({ path: `${evidence}/finder-playground-controls.png` });

  await page.goto(`${base}/?path=/story/puppertino-tag-picker--assigned&args=mixedValue[0]:work`);
  await frame.getByRole('button', { name: 'Tags', exact: true }).waitFor();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  await frame.getByRole('option', { name: 'Work Some items' }).click();
  await frame.getByRole('button', { name: 'Remove tag Work' }).waitFor();
  await frame.getByRole('combobox', { name: 'Tag name' }).press('Escape');
  await page.locator('input[name="allowCreation"]').press('Space');
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  await frame.getByRole('combobox', { name: 'Tag name' }).fill('Client');
  assert.equal(await frame.getByRole('option', { name: /Create tag/ }).count(), 0);
  await frame.getByText('No matching tags').waitFor();
  await frame.getByRole('combobox', { name: 'Tag name' }).press('Escape');
  await page.locator('#control-optionSet').selectOption({ label: 'Disabled tags' });
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  assert.equal(await frame.getByRole('button', { name: 'Remove tag Review' }).isDisabled(), true);
  assert.equal(await frame.getByRole('button', { name: 'Remove tag Work' }).isDisabled(), true);
  await page.screenshot({ path: `${evidence}/tag-playground-controls.png` });
  console.log(
    'Playground Controls passed: live layout, width ownership, synchronized density/narrow/resizing, preserved workspace state, mixed and disabled tags, optional creation, and Finder view/density changes that preserve file moves.',
  );
}
