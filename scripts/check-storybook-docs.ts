import assert from 'node:assert/strict';
import type { Page } from 'playwright';

export async function checkStorybookDocs(page: Page, base: string, evidence: string) {
  await page.goto(`${base}/iframe.html?id=examples-finder--docs&viewMode=docs`);
  await page.locator('#finder-walkthrough').waitFor();
  const app = page.locator('#story--examples-finder--file-table .finder-demo-window');
  await app.getByRole('table', { name: 'Project files' }).waitFor();
  assert.equal(await page.locator('video').count(), 3);
  assert.equal(await page.locator('img[src*="/media/"]').count(), 4);
  await page.waitForFunction(() =>
    document.body.innerText.includes('createPuppertinoColumnHelper'),
  );
  assert.ok(
    !(await page.locator('body').innerText()).includes('<v\n'),
    'Sources use readable library recipes, not minified demo component names',
  );
  for (const video of await page.locator('video').all()) {
    assert.equal(await video.getAttribute('autoplay'), null);
    assert.notEqual(await video.getAttribute('controls'), null);
    await video.evaluate(async (element) => {
      const player = element as HTMLVideoElement;
      await player.play();
      player.pause();
    });
    assert.ok(
      await video.evaluate((element) => (element as HTMLVideoElement).duration > 0),
      'Each embedded screencast decodes',
    );
  }
  await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click({ button: 'right' });
  await app.getByRole('menuitem', { name: 'Move to Archive', exact: true }).click();
  assert.equal(await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).count(), 0);
  await app.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await app.getByRole('row').filter({ hasText: 'Project brief.pdf' }).waitFor();
  await page.locator('input[type="radio"][value="columns"]').check();
  await app.getByRole('region', { name: 'Workspace columns' }).waitFor();
  await page.locator('input[type="radio"][value="comfortable"]').check();
  await page.waitForFunction(
    () =>
      document
        .querySelector('#story--examples-finder--file-table [data-pt-density]')
        ?.getAttribute('data-pt-density') === 'comfortable',
  );
  await page.locator('input[name="initialDark"]').focus();
  await page.locator('input[name="initialDark"]').press('Space');
  await page.waitForFunction(() =>
    document.querySelector('#story--examples-finder--file-table .p-dark-mode'),
  );
  await page.screenshot({ path: `${evidence}/finder-walkthrough.png` });

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
