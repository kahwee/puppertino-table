import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Page } from 'playwright';

export async function checkStorybookDocs(page: Page, base: string, evidence: string) {
  page.setDefaultTimeout(15000);
  console.log('Checking Storybook docs: render and readable source');
  await page.goto(`${base}/iframe.html?id=examples-finder--docs&viewMode=docs`);
  await page.locator('#finder-walkthrough').waitFor();
  const app = page.locator('#story--examples-finder--file-table .finder-demo-stage');
  await app.getByRole('table', { name: 'Project files' }).waitFor();
  assert.equal(await page.locator('video').count(), 3);
  assert.equal(await page.locator('img[src*="/media/"]').count(), 5);
  await page.waitForFunction(
    () => document.body.innerText.includes('createPuppertinoColumnHelper'),
    undefined,
    { timeout: 15000 },
  );
  assert.ok(
    !(await page.locator('body').innerText()).includes('<v\n'),
    'Sources use readable library recipes, not minified demo component names',
  );
  for (const video of await page.locator('video').all()) {
    console.log(`Checking Storybook video: ${await video.getAttribute('aria-label')}`);
    assert.equal(await video.getAttribute('autoplay'), null);
    assert.notEqual(await video.getAttribute('controls'), null);
    await video.evaluate(async (element) => {
      const player = element as HTMLVideoElement;
      await Promise.race([
        player.play(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Screencast playback timed out')), 15000),
        ),
      ]);
      player.pause();
    });
    assert.ok(
      await video.evaluate((element) => (element as HTMLVideoElement).duration > 0),
      'Each embedded screencast decodes',
    );
  }
  console.log('Checking Storybook docs: live app reset and controls');
  await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click({ button: 'right' });
  await app.getByRole('menuitem', { name: 'Move to Archive', exact: true }).click();
  assert.equal(await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).count(), 0);
  await app.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).waitFor();
  // Live behavior controls must preserve the app's current search.
  await app.getByRole('button', { name: 'Search', exact: true }).click();
  await app.getByRole('searchbox', { name: 'Search files' }).fill('brief');
  const toggleControl = async (name: string) => {
    const control = page.locator(`input[name="${name}"]`);
    await control.focus();
    await control.press('Space');
  };
  await toggleControl('selectable');
  await page.waitForFunction(
    () => !document.querySelector('#story--examples-finder--file-table input[type="checkbox"]'),
  );
  assert.equal(await app.getByRole('searchbox').inputValue(), 'brief');
  await toggleControl('resizable');
  await page.waitForFunction(
    () => !document.querySelector('#story--examples-finder--file-table [role="separator"]'),
  );
  await toggleControl('selectable');
  await toggleControl('resizable');
  await app.getByRole('searchbox').fill('');
  await page.locator('input[type="radio"][value="columns"]').check();
  await app.getByRole('region', { name: 'Workspace columns' }).waitFor();
  await page.locator('input[type="radio"][value="comfortable"]').check();
  await page.waitForFunction(
    () =>
      document
        .querySelector('#story--examples-finder--file-table [data-pt-density]')
        ?.getAttribute('data-pt-density') === 'comfortable',
    undefined,
    { timeout: 15000 },
  );
  await page.screenshot({ path: `${evidence}/finder-walkthrough.png` });

  console.log('Checking Storybook docs: typed integration guide');
  await page.goto(`${base}/iframe.html?id=start-here-typescript--docs&viewMode=docs`);
  await page.locator('#typescript-usage').waitFor();
  await page.getByRole('table', { name: 'People', exact: true }).waitFor();
  await page.waitForFunction(() => {
    const sources = Array.from(document.querySelectorAll('pre'), (node) => node.textContent ?? '');
    return [
      'satisfies PuppertinoTableProps<Asset>',
      'satisfies Meta<typeof AssetTable>',
      'StoryObj<typeof meta>',
    ].every((marker) => sources.some((source) => source.includes(marker)));
  });
  const typedSources = await page.locator('pre').allTextContents();
  assert.ok(
    typedSources.some((source) => source.includes('satisfies PuppertinoTableProps<Asset>')),
  );
  assert.ok(typedSources.some((source) => source.includes('satisfies Meta<typeof AssetTable>')));
  assert.ok(typedSources.some((source) => source.includes('StoryObj<typeof meta>')));
  assert.ok(typedSources.every((source) => !source.includes('../src/')));

  console.log('Checking Storybook docs: overview and manager navigation');
  await checkOverviewInstallation(page, base);
  assert.equal(
    await page.getByRole('table', { name: 'Choose a Storybook example' }).getByRole('row').count(),
    5,
  );
  assert.equal(
    await page.getByRole('link', { name: 'Finder primitives', exact: true }).getAttribute('href'),
    './?path=/docs/puppertino-finder-composition--docs',
  );
  const link = page.getByRole('link', { name: 'Finder walkthrough', exact: true });
  assert.equal(await link.getAttribute('target'), '_top');
  await link.click();
  await page.waitForURL((url) => url.searchParams.get('path') === '/docs/examples-finder--docs');
  await page.frameLocator('#storybook-preview-iframe').locator('#finder-walkthrough').waitFor();
  await checkTableRecipes(page, base);
  await checkThemeToolbar(page, base);
  console.log(
    'Storybook docs passed: media playback, readable source, live args, reset and manager navigation.',
  );
}

export async function checkOverviewInstallation(page: Page, base: string) {
  await page.goto(`${base}/iframe.html?id=start-here-overview--docs&viewMode=docs`);
  await page.locator('#puppertino-table').waitFor();
  await page.waitForFunction(() => document.body.innerText.includes('pnpm add puppertino-table@'));
  const { version } = JSON.parse(await readFile('package.json', 'utf8'));
  const overviewText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  assert.ok(
    overviewText.includes(`pnpm add puppertino-table@${version} `),
    'The public overview installation command must match the package version',
  );
}

async function checkThemeToolbar(page: Page, base: string) {
  console.log('Checking Storybook Themes toolbar and preserved Finder state');
  await page.goto(`${base}/?path=/story/examples-finder--file-table&globals=theme:light`);
  const frame = page.frameLocator('#storybook-preview-iframe');
  const rows = frame.getByRole('table', { name: 'Project files', exact: true }).locator('tbody tr');
  await rows.first().click();
  await frame.getByRole('button', { name: 'Tags', exact: true }).click();
  await frame.getByRole('option', { name: 'Review', exact: true }).click();
  await frame.getByRole('combobox', { name: 'Tag name' }).press('Escape');
  await frame.getByRole('button', { name: 'Search', exact: true }).click();
  await frame.getByRole('searchbox').fill('brief');
  await rows.first().click();
  await frame.getByLabel('Row density').selectOption('comfortable');
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', { name: 'Theme', exact: true }).click();
    await frame.locator(theme === 'dark' ? 'html.p-dark-mode' : 'html:not(.p-dark-mode)').waitFor();
    assert.equal(await rows.count(), 1, 'theme changes preserve filtering');
    assert.match((await rows.first().getAttribute('class')) ?? '', /p-selected/);
    assert.equal(await frame.getByRole('searchbox').inputValue(), 'brief');
    assert.equal(await frame.getByLabel('Row density').inputValue(), 'comfortable');
    await frame.getByRole('button', { name: 'Tags', exact: true }).click();
    await frame.getByRole('button', { name: 'Remove tag Review', exact: true }).waitFor();
    await frame.getByRole('combobox', { name: 'Tag name' }).press('Escape');
  }
  await page.goto(`${base}/?path=/docs/puppertino-table--docs&globals=theme:dark`);
  await frame.locator('html.p-dark-mode').waitFor();
  const preview = frame.locator('.sbdocs-preview').first();
  await preview.waitFor();
  assert.equal(
    await preview.evaluate((element) => getComputedStyle(element).backgroundColor),
    'rgb(36, 36, 38)',
    'Docs previews use a dark surface, keeping Puppertino text readable',
  );
}

async function checkTableRecipes(page: Page, base: string) {
  console.log('Checking table docs: public API recipes and primary example');
  await page.goto(`${base}/iframe.html?id=puppertino-table--docs&viewMode=docs`);
  await page.locator('#story--puppertino-table--default').waitFor();
  const primary = page.locator('.sbdocs-preview').first();
  await primary.getByRole('table', { name: 'People', exact: true }).waitFor();
  assert.equal(await primary.getByRole('heading', { name: 'Anchored item selection' }).count(), 0);
  for (const [story, marker] of [
    ['default', 'ariaLabel="People"'],
    ['selection', 'onRowSelectionChange={setSelection}'],
    ['server-owned-order', 'manualSorting\n'],
    ['external-atoms', 'atoms={{ columnSizing, sorting, rowSelection }}'],
    ['customized-rows', 'getRowProps='],
    ['paginated-selection', 'manualSorting\n'],
    ['date-columns', "sortFn: 'datetime'"],
    ['request-states', 'status={status}'],
  ]) {
    const preview = page
      .locator(`#story--puppertino-table--${story}`)
      .locator('xpath=ancestor::div[contains(@class,"sbdocs-preview")]/..');
    await preview.getByRole('switch', { name: 'Show code' }).click();
    const source = await preview.locator('pre').innerText();
    assert.ok(source.includes("from 'puppertino-table'"), `${story}: public imports`);
    assert.ok(source.includes('createPuppertinoColumnHelper<'), `${story}: typed columns`);
    assert.ok(source.includes(marker), `${story}: actual state wiring`);
    assert.ok(
      !source.includes('../src/') && !source.includes('<Example'),
      `${story}: consumer-ready source`,
    );
  }
}
