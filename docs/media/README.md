# README media

Curated assets recorded from the Team directory, Finder, Sidebar, Outline and Split Storybook playgrounds with fictional data. These are public demo media.

Run `pnpm capture:readme` from the repository root. It builds Storybook, captures twenty PNG screenshots, and records six interaction sequences as GIFs, MP4s and WebMs. To refresh only the latest Team directory workflow, run `pnpm build:storybook && node scripts/capture-readme.mjs --paged`. Requirements: Chromium, Playwright's video helper (`pnpm exec playwright install ffmpeg`), and `ffmpeg` with libx264 and libvpx-vp9. `FFMPEG_EXECUTABLE` can select an encoder; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a browser.

- **Team directory:** select across pages, hide Score, resize Name, reload the saved layout, restore defaults. Layout persists; selection starts fresh on reload.
- **Resizing:** table divider drag, double-click reset, independent browser-panel drag.
- **Context menu:** right-click in a close-up, Get Info, Shift+F10, arrow-key navigation, Escape.
- **Outline:** load nested branches, select a document, handle an error and retry while preserving selection.
- **Split panes:** resize and verify completion, hide Sidebar and restore it through pane navigation.
- **Drag/drop:** move Project brief into Archive, verify it leaves Projects, then open Archive and verify arrival.

Assertions check the actual resulting UI, loaded children, preserved selection and completed pane widths; axe checks light/dark, comfortable, columns and the open menu. Standalone captures include light/dark Sidebar, the touch variant, expanded light/dark Outline, and horizontal/vertical Split views. Screenshots frame the Finder window or standalone app with a small margin and use a 2× device scale (the menu close-up uses 1.25×). Capture preserves intentional input/menu focus while clearing leftover focus rings from unrelated controls. Numbered captions, a moving pointer and click highlights explain the real gestures. Startup loading is trimmed from recordings. GIFs are 900px wide at 15fps with a 192-color palette; MP4s and WebMs use 1080×640 output. The menu close-up uses an 864×512 viewport enlarged during encoding, preserving menu coordinates. Original intermediate recordings stay under ignored `test-results/`.

The README uses absolute GitHub image URLs so images also resolve on npm. Storybook copies this directory to `/media` for Pages video links. Keep media out of the npm package.

Storybook offers WebM first and MP4 second so playback does not depend on a browser build shipping the H.264 decoder.

Finder references: [Apple’s Finder guide](https://support.apple.com/guide/mac-help/organize-your-files-in-the-finder-mchle9f0a1b2/mac), reviewed 2026-10-13. Sidebar/titlebar alignment, Finder view toolbar, column ancestry and gallery filmstrip follow those references. Toolbar and file-type icons use Phosphor; Alpine preview artwork is original example content. Screenshots include list/selection/density/dark, light/dark/narrow columns, icons, gallery, the Finder hierarchy and the open menu. Standalone captures include light/dark Sidebar, the touch variant, expanded light/dark Outline, and horizontal/vertical Split views.
