import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { storyQuery } from './story-presets.mjs';

/** End-to-end contract: complete-table change notifications versus completed snapshots. */
export async function checkResizeEvents(page: Page, base: string) {
  for (const story of ['controlled-sizing', 'external-atoms']) {
    await page.goto(`${base}/iframe.html?${storyQuery(`puppertino-table--${story}`)}&embed=true`);
    const edge = page.getByRole('separator', { name: 'Resize Name column' });
    await edge.press('ArrowRight');
    assert.equal(
      await page.getByLabel('Committed name width').textContent(),
      '296',
      `${story} commits intended widths`,
    );
    await edge.press('Enter');
    assert.equal(
      await page.getByLabel('Committed name width').textContent(),
      '240',
      `${story} reset commits default`,
    );
  }
  await page.goto(
    `${base}/iframe.html?id=puppertino-table--resize-events&viewMode=story&embed=true`,
  );
  const handle = page.getByRole('separator', { name: 'Resize Name column' });
  const commits = page.getByLabel('Resize commits');
  const preview = page.getByLabel('Preview name width');
  const committed = page.getByLabel('Committed name width');
  const drag = async () => {
    const bounds = await handle.boundingBox();
    assert.ok(bounds);
    const x = bounds.x + bounds.width / 2,
      y = bounds.y + bounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 32, y);
  };
  await drag();
  assert.equal(await preview.textContent(), '272');
  assert.equal(await commits.textContent(), '0', 'previews do not commit');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.equal(await preview.textContent(), '240');
  assert.equal(await commits.textContent(), '0', 'cancellation does not commit');
  await drag();
  await page.mouse.up();
  assert.equal(await committed.textContent(), '272');
  assert.equal(await commits.textContent(), '1', 'pointer completion commits once');
}
