import assert from 'node:assert/strict';
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
  await page.locator('input[name="initialDark"]').focus();
  await page.locator('input[name="initialDark"]').press('Space');
  await page.waitForFunction(
    () => document.querySelector('#story--examples-finder--file-table .p-dark-mode'),
    undefined,
    { timeout: 15000 },
  );
  await page.screenshot({ path: `${evidence}/finder-walkthrough.png` });

  console.log('Checking Storybook docs: overview and manager navigation');
  await page.goto(`${base}/iframe.html?id=start-here-overview--docs&viewMode=docs`);
  await page.locator('#puppertino-table').waitFor();
  assert.equal(
    await page.getByRole('table', { name: 'Choose a Storybook example' }).getByRole('row').count(),
    4,
  );
  const link = page.getByRole('link', { name: 'Finder walkthrough', exact: true });
  assert.equal(await link.getAttribute('target'), '_top');
  await link.click();
  await page.waitForURL((url) => url.searchParams.get('path') === '/docs/examples-finder--docs');
  await page.frameLocator('#storybook-preview-iframe').locator('#finder-walkthrough').waitFor();
  console.log(
    'Storybook docs passed: media playback, readable source, live args, reset and manager navigation.',
  );
}
