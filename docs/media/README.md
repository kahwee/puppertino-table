# README media

Curated documentation assets recorded from the working Finder, Sidebar, Outline view and Split view Storybook playgrounds, using fictional files and in-memory state. These are public demo media, not uploaded documents or browser regression artifacts.

Run `pnpm capture:readme` from the repository root. It builds Storybook, captures eighteen PNG screenshots, and records five real interaction sequences as animated GIFs, MP4s and WebMs. Requirements: Chromium, Playwright's video helper (`pnpm exec playwright install ffmpeg`), and `ffmpeg` with libx264 and libvpx-vp9. `FFMPEG_EXECUTABLE` can select a locally installed encoder. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a system browser.

- **Resizing:** table divider drag, double-click reset, independent browser-panel drag.
- **Context menu:** right-click in a close-up, Get Info, Shift+F10, arrow-key navigation, Escape.
- **Outline:** load nested branches, select a document, handle an error and retry while preserving selection.
- **Split panes:** resize and verify completion, hide Sidebar and restore it through pane navigation.
- **Drag/drop:** move Project brief into Archive, verify it leaves Projects, then open Archive and verify arrival.

Assertions check the actual resulting UI, loaded children, preserved selection and completed pane widths; axe checks light/dark, comfortable, columns and the open menu. Standalone captures include light/dark Sidebar, the touch variant, expanded light/dark Outline, and horizontal/vertical Split views. Screenshots frame the Finder window or standalone app with a small margin and use a 2× device scale (the menu close-up uses 1.25×). Capture preserves intentional input/menu focus while clearing leftover focus rings from unrelated controls. Numbered captions, a moving pointer and click highlights explain the real gestures. Startup loading is trimmed from recordings. GIFs are 900px wide at 15fps with a 192-color palette; MP4s and WebMs use 1080×640 output. The menu close-up uses an 864×512 viewport enlarged during encoding, preserving menu coordinates. Original intermediate recordings stay under ignored `test-results/`.

The README uses absolute GitHub image URLs so images also resolve on npm. Storybook copies this directory to `/media` for Pages video links. Keep media out of the npm package.

Storybook offers WebM first and MP4 second so playback does not depend on a browser build shipping the H.264 decoder.

Finder references: [Apple’s Finder guide](https://support.apple.com/guide/mac-help/organize-your-files-in-the-finder-mchle9f0a1b2/mac), reviewed 2026-10-13. Sidebar/titlebar alignment, four-view toolbar, column ancestry and gallery filmstrip follow those references. Toolbar and file-type icons use Phosphor; Alpine preview artwork is original example content. Screenshots include list/selection/density/dark, light/dark/narrow columns, icons, gallery and the open menu. Standalone captures include light/dark Sidebar, the touch variant, expanded light/dark Outline, and horizontal/vertical Split views.
