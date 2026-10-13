/** Change the preview through Storybook's globals channel, as the Themes toolbar does. */
export async function setStorybookTheme(page, theme) {
  await page.evaluate((theme) => {
    window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { theme } });
  }, theme);
  await page.waitForFunction(
    (theme) => document.documentElement.classList.contains('p-dark-mode') === (theme === 'dark'),
    theme,
  );
}
