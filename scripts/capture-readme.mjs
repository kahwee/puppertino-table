import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import axe from 'axe-core';
import { chromium } from 'playwright';
import { storyQuery } from './story-presets.mjs';
import { setStorybookTheme } from './storybook-theme.mjs';

// Capture real Storybook interactions; ffmpeg supplies README GIFs and MP4 downloads.
const root = path.resolve('storybook-static');
const media = path.resolve('docs/media');
await mkdir(media, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const file = path.resolve(root, `.${new URL(request.url, 'http://localhost').pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
    };
    response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),
});
const errors = [];
const captureStarts = new WeakMap();
const pause = (page) => page.waitForTimeout(1000);
async function accessibility(page) {
  await page.addScriptTag({
    content: `{ const previousAxe = window.axe; ${axe.source}
window.captureAxe = window.axe; window.axe = previousAxe; }`,
  });
  const violations = await page.evaluate(async () =>
    (await window.captureAxe.run(document)).violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  );
  assert.deepEqual(violations, []);
}
async function open(story, recording = false, closeup = false, args = '') {
  const viewport = closeup ? { width: 864, height: 512 } : { width: 1080, height: 640 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: recording ? (closeup ? 1.25 : 1) : 2,
    ...(recording ? { recordVideo: { dir: 'test-results/readme-video', size: viewport } } : {}),
  });
  const createdAt = performance.now();
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  const storyId = story.includes('--') ? story : `examples-finder--${story}`;
  await page.goto(
    `${base}/iframe.html?${storyQuery(storyId)}${args ? `&args=${encodeURIComponent(args)}` : ''}`,
  );
  if (storyId.startsWith('examples-finder--'))
    await page.getByRole('region', { name: 'Finder-style demo' }).waitFor();
  else if (storyId === 'puppertino-table--paginated-selection')
    await page.getByRole('button', { name: 'Columns', exact: true }).waitFor();
  else await page.getByRole('main').waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (recording) await recordingOverlay(page);
  captureStarts.set(page, (performance.now() - createdAt) / 1000);
  return { context, page };
}
async function recordingOverlay(page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent =
      '#capture-cursor {position:fixed;left:0;top:0;width:18px;height:24px;visibility:hidden;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 1px 2px #0008)} #capture-caption {position:fixed;bottom:18px;left:36px;right:36px;padding:12px 18px;border-radius:10px;background:#182332f2;color:#fff;font:500 16px system-ui;box-shadow:0 4px 20px #0003;z-index:2147483646;pointer-events:none}';
    document.head.append(style);
    const cursor = document.createElement('div');
    cursor.id = 'capture-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML =
      '<svg viewBox="0 0 18 24"><path d="M1 1v19l5-5 4 8 3-2-4-8h7Z" fill="white" stroke="#182332" stroke-width="1.5"/></svg>';
    const caption = document.createElement('div');
    caption.id = 'capture-caption';
    caption.setAttribute('role', 'status');
    document.body.append(cursor, caption);
    const move = (event) => {
      cursor.style.visibility = 'visible';
      cursor.style.transform = `translate(${event.clientX}px,${event.clientY}px)`;
    };
    document.addEventListener('mousemove', move, true);
    document.addEventListener('dragover', move, true);
    document.addEventListener(
      'pointerdown',
      () => {
        cursor.style.filter = 'drop-shadow(0 0 7px #007aff)';
      },
      true,
    );
    document.addEventListener(
      'pointerup',
      () => {
        cursor.style.filter = 'drop-shadow(0 1px 2px #0008)';
      },
      true,
    );
  });
}
async function caption(page, text) {
  await page.locator('#capture-caption').evaluate((element, text) => {
    element.textContent = text;
  }, text);
}
async function screenshot(page, name, selector = '.pt-finder-window') {
  await page.evaluate(() => {
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.closest('[role="dialog"], [role="menu"]')
    )
      document.activeElement.blur();
  });
  const box = await page.locator(selector).boundingBox();
  assert.ok(box);
  const viewport = page.viewportSize();
  const x = Math.max(0, box.x - 14);
  const y = Math.max(0, box.y - 14);
  await page.screenshot({
    path: path.join(media, `${name}.png`),
    clip: {
      x,
      y,
      width: Math.min(viewport.width - x, box.width + 28),
      height: Math.min(viewport.height - y, box.height + 28),
    },
  });
}
async function pointerClick(page, target, options) {
  const box = await target.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
  await page.waitForTimeout(350);
  await target.click(options);
  await page.waitForTimeout(650);
}
async function finish(context, page, name) {
  const video = page.video();
  await context.close();
  const input = await video.path();
  execFileSync(
    process.env.FFMPEG_EXECUTABLE || 'ffmpeg',
    [
      '-y',
      '-i',
      input,
      '-ss',
      captureStarts.get(page).toFixed(3),
      '-vf',
      'scale=1080:640:flags=lanczos',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '30',
      '-an',
      path.join(media, `${name}.webm`),
    ],
    { stdio: 'pipe' },
  );
  execFileSync(
    process.env.FFMPEG_EXECUTABLE || 'ffmpeg',
    [
      '-y',
      '-i',
      input,
      '-ss',
      captureStarts.get(page).toFixed(3),
      '-vf',
      'fps=15,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=bayer',
      '-loop',
      '0',
      path.join(media, `${name}.gif`),
    ],
    { stdio: 'pipe' },
  );
  execFileSync(
    process.env.FFMPEG_EXECUTABLE || 'ffmpeg',
    [
      '-y',
      '-i',
      input,
      '-ss',
      captureStarts.get(page).toFixed(3),
      '-vf',
      'scale=1080:640:flags=lanczos',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '20',
      '-movflags',
      '+faststart',
      '-an',
      path.join(media, `${name}.mp4`),
    ],
    { stdio: 'pipe' },
  );
}
async function drag(page, handle, delta) {
  const box = await handle.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await pause(page);
  await page.mouse.down();
  for (let step = 1; step <= 24; step++) {
    await page.mouse.move(box.x + box.width / 2 + (delta * step) / 24, box.y + box.height / 2);
    await page.waitForTimeout(35);
  }
  await page.mouse.up();
  await pause(page);
}
async function capturePagedWorkspace() {
  const { context, page } = await open(
    'puppertino-table--paginated-selection',
    true,
    true,
    'pageSize:5',
  );
  const table = page.getByRole('table', { name: 'Paged people' });
  const columns = page.getByRole('button', { name: 'Columns', exact: true });
  const panel = page.getByRole('dialog', { name: 'Columns', exact: true });
  const nameEdge = page.getByRole('separator', { name: 'Resize Name column' });
  await caption(page, '1 / 5 · Select a teammate. Keep the selection across pages.');
  await pause(page);
  await pointerClick(page, table.getByRole('checkbox', { name: 'Select Maya Chen' }));
  await pointerClick(page, page.getByRole('button', { name: 'Next page' }));
  assert.equal(
    await page.getByLabel('Total selected').textContent(),
    '1 selected · 0 on this page',
  );
  await pause(page);
  await pointerClick(page, page.getByRole('button', { name: 'Previous page' }));
  assert.equal(await table.getByRole('checkbox', { name: 'Select Maya Chen' }).isChecked(), true);
  await caption(page, '2 / 5 · Hide Score. Selection stays intact.');
  await pointerClick(page, columns);
  await pointerClick(page, panel.locator('label').filter({ hasText: 'Score' }));
  assert.equal(await table.getByRole('button', { name: 'Sort by Score' }).count(), 0);
  await accessibility(page);
  await page.locator('#capture-caption, #capture-cursor').evaluateAll((elements) => {
    for (const element of elements) element.style.visibility = 'hidden';
  });
  // A clean poster pairs the open Columns menu with a selected row.
  const workspaceBox = await page
    .getByRole('region', { name: 'Team directory workspace' })
    .boundingBox();
  const panelBox = await panel.boundingBox();
  assert.ok(workspaceBox && panelBox);
  const y = Math.max(0, workspaceBox.y - 8);
  await page.screenshot({
    path: path.join(media, 'paged-workspace.png'),
    clip: {
      x: 0,
      y,
      width: page.viewportSize().width,
      height: Math.min(
        page.viewportSize().height - y,
        Math.max(workspaceBox.y + workspaceBox.height, panelBox.y + panelBox.height) + 14 - y,
      ),
    },
  });
  await page.locator('#capture-caption, #capture-cursor').evaluateAll((elements) => {
    for (const element of elements) element.style.visibility = '';
  });
  await pause(page);
  await page.keyboard.press('Escape');
  await caption(page, '3 / 5 · Resize Name. Only finished changes are saved.');
  const before = await nameEdge.getAttribute('aria-valuenow');
  await drag(page, nameEdge, 80);
  const width = await nameEdge.getAttribute('aria-valuenow');
  assert.notEqual(width, before);
  await caption(page, '4 / 5 · Reload. Hidden fields and widths return.');
  await pause(page);
  await page.reload();
  await columns.waitFor();
  await page.waitForFunction(
    (width) =>
      document.querySelector('[aria-label="Resize Name column"]')?.getAttribute('aria-valuenow') ===
      width,
    width,
  );
  assert.equal(await table.getByRole('button', { name: 'Sort by Score' }).count(), 0);
  await recordingOverlay(page);
  await caption(page, '4 / 5 · Layout restored. Selection starts fresh on reload.');
  assert.equal(
    await page.getByLabel('Total selected').textContent(),
    '0 selected · 0 on this page',
  );
  await pause(page);
  await caption(page, '5 / 5 · Restore defaults: all fields, original widths.');
  await pointerClick(page, columns);
  await pointerClick(page, panel.getByRole('button', { name: 'Restore default layout' }));
  await table.getByRole('button', { name: 'Sort by Score' }).waitFor();
  assert.equal(await nameEdge.getAttribute('aria-valuenow'), before);
  await pause(page);
  await page.keyboard.press('Escape');
  await pause(page);
  await finish(context, page, 'paged-workspace');
}
async function captureExistingMedia() {
  const { context, page } = await open('file-table');
  await accessibility(page);
  await screenshot(page, 'table-light');
  await page.getByRole('row').filter({ hasText: 'Project brief.pdf' }).click();
  await page
    .getByRole('row')
    .filter({ hasText: 'Budget.xlsx' })
    .click({ modifiers: ['Control'] });
  await screenshot(page, 'table-selection');
  await page.getByRole('button', { name: 'Tags', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Assign tags' })
    .getByRole('option', { name: 'Review', exact: true })
    .click();
  await accessibility(page);
  await screenshot(page, 'tags');
  await page.keyboard.press('Escape');
  await page.getByLabel('Row density').selectOption('comfortable');
  await accessibility(page);
  await screenshot(page, 'table-comfortable');
  await page.getByLabel('Row density').selectOption('compact');
  await setStorybookTheme(page, 'dark');
  await accessibility(page);
  await screenshot(page, 'table-dark');
  await context.close();

  const columns = await open('column-workspace');
  await columns.page.getByRole('button', { name: 'Project brief.pdf', exact: true }).click();
  await accessibility(columns.page);
  await screenshot(columns.page, 'columns-preview');
  await columns.context.close();

  for (const [story, name] of [
    ['outline-workspace', 'finder-outline'],
    ['column-workspace', 'columns-dark'],
    ['icon-workspace', 'icons-light'],
    ['gallery-workspace', 'gallery-preview'],
    ['narrow-columns', 'columns-narrow'],
  ]) {
    const capture = await open(story);
    if (name === 'columns-dark') await setStorybookTheme(capture.page, 'dark');
    await accessibility(capture.page);
    await screenshot(capture.page, name);
    await capture.context.close();
  }

  const resize = await open('file-table', true);
  await caption(resize.page, '1 / 3 · Drag the Name divider. Rows stay aligned.');
  await pause(resize.page);
  const tableHandle = resize.page.getByRole('separator').first();
  const before = await tableHandle.getAttribute('aria-valuenow');
  await drag(resize.page, tableHandle, 100);
  assert.notEqual(await tableHandle.getAttribute('aria-valuenow'), before);
  await caption(resize.page, '2 / 3 · Double-click the divider to reset its width.');
  await tableHandle.dblclick();
  await pause(resize.page);
  await pointerClick(
    resize.page,
    resize.page.getByRole('button', { name: 'Columns', exact: true }),
  );
  await caption(resize.page, '3 / 3 · Switch to Columns. Resize a panel independently.');
  await drag(resize.page, resize.page.locator('.pt-panel-resizer').first(), 70);
  await finish(resize.context, resize.page, 'resizing');

  const menu = await open('file-table', true, true);
  await caption(menu.page, '1 / 3 · Right-click a file to open its commands.');
  await pause(menu.page);
  await pointerClick(menu.page, menu.page.getByText('Project brief.pdf', { exact: true }), {
    button: 'right',
  });
  await menu.page.getByRole('menu', { name: 'File actions' }).waitFor();
  await accessibility(menu.page);
  await pause(menu.page);
  await menu.page.locator('#capture-caption, #capture-cursor').evaluateAll((elements) => {
    for (const element of elements) element.style.visibility = 'hidden';
  });
  await screenshot(menu.page, 'context-menu');
  await menu.page.locator('#capture-caption, #capture-cursor').evaluateAll((elements) => {
    for (const element of elements) element.style.visibility = '';
  });
  await caption(menu.page, '2 / 3 · Choose Get Info to open the file inspector.');
  await pointerClick(menu.page, menu.page.getByRole('menuitem', { name: 'Get Info', exact: true }));
  await menu.page.getByRole('complementary', { name: 'File details' }).waitFor();
  await pause(menu.page);
  await pointerClick(menu.page, menu.page.getByRole('button', { name: 'Close details' }));
  await caption(menu.page, '3 / 3 · Press Shift+F10. Use arrows, then Escape.');
  await menu.page.getByRole('row').filter({ hasText: 'Research notes.txt' }).focus();
  await menu.page.keyboard.press('Shift+F10');
  await menu.page.getByRole('menu').waitFor();
  await pause(menu.page);
  await menu.page.keyboard.press('ArrowDown');
  await pause(menu.page);
  await menu.page.keyboard.press('Escape');
  await pause(menu.page);
  assert.equal(await menu.page.getByRole('menu').count(), 0);
  await finish(menu.context, menu.page, 'context-menu');

  const drop = await open('file-table', true);
  await caption(drop.page, '1 / 2 · Drag Project brief.pdf onto Archive.');
  await pause(drop.page);
  const source = drop.page.getByRole('row').filter({ hasText: 'Project brief.pdf' });
  const target = drop.page
    .getByRole('navigation', { name: 'Favorites' })
    .getByRole('button', { name: 'Archive', exact: true });
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  assert.ok(from && to);
  await drop.page.mouse.move(from.x + 110, from.y + from.height / 2);
  await pause(drop.page);
  await drop.page.mouse.down();
  for (let step = 1; step <= 30; step++) {
    await drop.page.mouse.move(
      from.x + 110 + ((to.x + to.width / 2 - from.x - 110) * step) / 30,
      from.y + from.height / 2 + ((to.y + to.height / 2 - from.y - from.height / 2) * step) / 30,
    );
    await drop.page.waitForTimeout(40);
  }
  await pause(drop.page);
  await drop.page.mouse.up();
  await drop.page
    .getByRole('status')
    .filter({ hasText: 'Moved Project brief.pdf to Archive' })
    .waitFor();
  assert.equal(await source.count(), 0);
  await caption(drop.page, '2 / 2 · Open Archive. The moved file is here.');
  await pointerClick(drop.page, target);
  await drop.page.getByText('Project brief.pdf', { exact: true }).waitFor();
  await pause(drop.page);
  await finish(drop.context, drop.page, 'drag-drop');

  const sidebar = await open('puppertino-sidebar--default');
  // The documentation capture should show the initial app section, not the play-test result.
  await sidebar.page.getByRole('button', { name: 'Projects 12', exact: true }).click();
  await accessibility(sidebar.page);
  await screenshot(sidebar.page, 'sidebar-light', 'main');
  await setStorybookTheme(sidebar.page, 'dark');
  await accessibility(sidebar.page);
  await screenshot(sidebar.page, 'sidebar-dark', 'main');
  await sidebar.context.close();
  const touch = await open('puppertino-sidebar--touch');
  await touch.page.locator('.p-sidebar-touch').waitFor();
  assert.equal(
    await touch.page
      .getByRole('button', { name: 'Archive', exact: true })
      .evaluate((element) => element.getBoundingClientRect().height),
    44,
  );
  await setStorybookTheme(touch.page, 'dark');
  await accessibility(touch.page);
  await screenshot(touch.page, 'sidebar-touch', 'main');
  await touch.context.close();

  const outline = await open('puppertino-outline-view--default');
  await pointerClick(outline.page, outline.page.getByRole('button', { name: 'Expand Projects' }));
  await outline.page.getByRole('button', { name: 'Expand Source' }).waitFor();
  await pointerClick(outline.page, outline.page.getByRole('button', { name: 'Expand Source' }));
  await outline.page.getByRole('checkbox', { name: 'Select index.ts' }).check();
  await outline.page.getByRole('heading', { name: 'index.ts', exact: true }).waitFor();
  await accessibility(outline.page);
  await screenshot(outline.page, 'outline-light', 'main');
  await setStorybookTheme(outline.page, 'dark');
  await accessibility(outline.page);
  await screenshot(outline.page, 'outline-dark', 'main');
  await outline.context.close();

  for (const [orientation, name] of [
    ['horizontal', 'split-view'],
    ['vertical', 'split-vertical'],
  ]) {
    const split = await open(
      `puppertino-split-view--${orientation === 'vertical' ? 'vertical' : 'default'}`,
    );
    if (orientation === 'vertical') await split.page.setViewportSize({ width: 1080, height: 740 });
    await split.page.locator(`.pt-split-view[data-orientation="${orientation}"]`).waitFor();
    await accessibility(split.page);
    await screenshot(split.page, name, 'main');
    await split.context.close();
  }

  const hierarchy = await open('puppertino-outline-view--default', true);
  await caption(hierarchy.page, '1 / 4 · Expand Projects. The app loads its children.');
  await pause(hierarchy.page);
  await pointerClick(
    hierarchy.page,
    hierarchy.page.getByRole('button', { name: 'Expand Projects' }),
  );
  await hierarchy.page.getByRole('button', { name: 'Expand Source' }).waitFor();
  await caption(hierarchy.page, '2 / 4 · Expand Source. Select index.ts to show its details.');
  await pointerClick(hierarchy.page, hierarchy.page.getByRole('button', { name: 'Expand Source' }));
  await pointerClick(
    hierarchy.page,
    hierarchy.page.getByRole('checkbox', { name: 'Select index.ts' }),
  );
  await hierarchy.page.getByRole('heading', { name: 'index.ts', exact: true }).waitFor();
  await caption(hierarchy.page, '3 / 4 · Archive returns an error. The branch offers Retry.');
  await pointerClick(
    hierarchy.page,
    hierarchy.page.getByRole('button', { name: 'Expand Archive' }),
  );
  await hierarchy.page.getByRole('button', { name: 'Retry Archive' }).waitFor();
  await pause(hierarchy.page);
  await caption(hierarchy.page, '4 / 4 · Retry loads the branch. Existing selection stays intact.');
  await pointerClick(hierarchy.page, hierarchy.page.getByRole('button', { name: 'Retry Archive' }));
  await hierarchy.page.getByRole('checkbox', { name: 'Select Meeting notes.txt' }).waitFor();
  assert.equal(
    await hierarchy.page.getByRole('checkbox', { name: 'Select index.ts' }).isChecked(),
    true,
  );
  await pause(hierarchy.page);
  await finish(hierarchy.context, hierarchy.page, 'outline-loading');

  const panes = await open('puppertino-split-view--default', true);
  await caption(panes.page, '1 / 3 · Resize the Sidebar pane. Only completed widths commit.');
  await pause(panes.page);
  const paneHandle = panes.page.getByRole('separator', { name: 'Resize Sidebar pane' });
  const paneBefore = await paneHandle.getAttribute('aria-valuenow');
  await drag(panes.page, paneHandle, 64);
  assert.notEqual(await paneHandle.getAttribute('aria-valuenow'), paneBefore);
  assert.ok(
    (await panes.page.getByLabel('Committed pane sizes').textContent()).includes('sidebar'),
  );
  await caption(panes.page, '2 / 3 · Hide Sidebar. Content and Detail keep their state.');
  await pointerClick(panes.page, panes.page.getByRole('button', { name: 'Hide sidebar' }));
  assert.equal(await panes.page.getByRole('region', { name: 'Sidebar', exact: true }).count(), 0);
  await pause(panes.page);
  await caption(panes.page, '3 / 3 · Restore Sidebar from the pane navigation.');
  await pointerClick(panes.page, panes.page.getByRole('button', { name: 'Sidebar', exact: true }));
  await panes.page.getByRole('region', { name: 'Sidebar', exact: true }).waitFor();
  await pause(panes.page);
  await finish(panes.context, panes.page, 'split-panes');
}
try {
  if (!process.argv.includes('--paged')) await captureExistingMedia();
  await capturePagedWorkspace();
  assert.deepEqual(errors, []);
  console.log(
    process.argv.includes('--paged')
      ? 'README media captured: asserted Team directory workflow; GIF, MP4 and WebM.'
      : 'README media captured: twenty screenshots and six asserted workflows; GIFs, MP4s and WebMs.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
