import assert from 'node:assert/strict';
import type { Browser } from 'playwright';

interface StoryResult {
  storyId: string;
  status: string;
  errors?: string[];
  reporters?: {
    type: string;
    status: string;
    result?: { violations?: { id: string; nodes: { target: string[] }[] }[] };
  }[];
}

/** Check every indexed story, including its play function and Storybook afterEach reporters. */
export async function checkStorybookInteractions(browser: Browser, base: string) {
  const response = await fetch(`${base}/index.json`);
  assert.ok(response.ok, 'Storybook index must load');
  const index = (await response.json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const stories = Object.values(index.entries).filter((entry) => entry.type === 'story');
  assert.ok(stories.length > 0, 'Storybook must expose testable stories');
  const page = await browser.newPage();
  await page.route(`${base}/__interaction-host`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>Story checks</title></head><body></body></html>',
    }),
  );
  const failures: { story: string; reports: unknown }[] = [];
  try {
    await page.goto(`${base}/__interaction-host`);
    // Routing disables Playwright's HTTP cache. Only the empty host needs a route;
    // allow shared Storybook assets to be cached across fresh story iframes.
    await page.unroute(`${base}/__interaction-host`);
    await page.evaluate(() => {
      window.addEventListener('message', (event) => {
        const frame = document.querySelector('iframe');
        if (!frame || event.source !== frame.contentWindow) return;
        const state = window as unknown as { storyResults: StoryResult[]; storyErrors: string[] };
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data?.event?.type === 'storyFinished')
            state.storyResults.push({ ...data.event.args[0], errors: [...state.storyErrors] });
          if (
            data?.event?.type === 'playFunctionThrewException' ||
            data?.event?.type === 'storyThrewException'
          )
            state.storyErrors.push(data.event.args[0]?.message ?? 'Unknown story error');
        } catch {
          /* Ignore messages that do not use the Storybook channel protocol. */
        }
      });
    });
    for (const story of stories) {
      await page.evaluate((url) => {
        Object.assign(window, { storyResults: [], storyErrors: [] });
        const frame = document.createElement('iframe');
        frame.src = url;
        frame.style.cssText = 'width:1280px;height:900px;border:0';
        document.body.replaceChildren(frame);
      }, `${base}/iframe.html?id=${story.id}&viewMode=story`);
      await page.waitForFunction(
        (id) =>
          (window as unknown as { storyResults: { storyId: string }[] }).storyResults.some(
            (result) => result.storyId === id,
          ),
        story.id,
      );
      const result = await page.evaluate(
        (id) =>
          (window as unknown as { storyResults: StoryResult[] }).storyResults.find(
            (result) => result.storyId === id,
          ),
        story.id,
      );
      const reports = result?.reporters
        ?.filter((report) => report.status === 'failed')
        .map((report) => ({
          type: report.type,
          violations: report.result?.violations?.map((violation) => ({
            id: violation.id,
            targets: violation.nodes.map((node) => node.target),
          })),
        }));
      const failed = result?.status !== 'success' || !!result.errors?.length || !!reports?.length;
      if (failed) failures.push({ story: story.id, reports: { reports, errors: result?.errors } });
      console.log(`Storybook interaction ${failed ? 'failed' : 'success'}: ${story.id}`);
    }
    assert.deepEqual(
      failures,
      [],
      'Every Storybook play function and accessibility reporter must pass',
    );
  } finally {
    await page.close();
  }
}
