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
async function open(story, recording = false, closeup = false) {
  const viewport = closeup ? { width: 864, height: 512 } : { width: 1080, height: 640 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: recording ? (closeup ? 1.25 : 1) : 2,
    ...(recording ? { recordVideo: { dir: 'test-results/readme-video', size: viewport } } : {}),
  });
  const createdAt = performance.now();
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/iframe.html?${storyQuery(`examples-finder--${story}`)}`);
  await page.getByRole('region', { name: 'Finder-style demo' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (recording)
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
  captureStarts.set(page, (performance.now() - createdAt) / 1000);
  return { context, page };
}
async function caption(page, text) {
  await page.locator('#capture-caption').evaluate((element, text) => {
    element.textContent = text;
  }, text);
}
async function screenshot(page, name) {
  await page.evaluate(() => {
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.closest('[role="dialog"], [role="menu"]')
    )
      document.activeElement.blur();
  });
  const box = await page.locator('.pt-finder-window').boundingBox();
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
    'ffmpeg',
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
    'ffmpeg',
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
    'ffmpeg',
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
try {
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
  assert.deepEqual(errors, []);
  console.log(
    'README media captured: eleven composed screenshots, three asserted interaction GIFs, MP4s and WebMs.',
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
