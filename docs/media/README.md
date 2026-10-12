# README media

Curated documentation assets recorded from the working **Examples / Finder** Storybook apps, using fictional files and in-memory state. These are public demo media, not uploaded documents or browser regression artifacts.

Run `pnpm capture:readme` from the repository root. It builds Storybook, captures ten PNG screenshots, and records three real interaction sequences as animated GIFs, MP4s and WebMs. Requirements: Chromium, Playwright's video helper (`pnpm exec playwright install ffmpeg`), and system `ffmpeg` with libx264 and libvpx-vp9. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a system browser.

- **Resizing:** table divider drag, double-click reset, independent browser-panel drag.
- **Context menu:** right-click in a 125% capture close-up, Get Info, Shift+F10, Escape.
- **Drag/drop:** move Project brief into Archive, verify it leaves Projects, then open Archive and verify arrival.

Assertions check the actual resulting UI; axe checks light/dark, comfortable, columns and the open menu. Pointer/caption overlays make interactions readable; app content and gestures are real. GIFs are 900px wide at 12fps; MP4s and WebMs use 1080×640 output; the close-up uses an 864×512 viewport enlarged during encoding, preserving menu coordinates. Original intermediate recordings stay under ignored `test-results/`.

The README uses absolute GitHub image URLs so images also resolve on npm. Storybook copies this directory to `/media` for Pages video links. Keep media out of the npm package.

Storybook offers WebM first and MP4 second so playback does not depend on a browser build shipping the H.264 decoder.

Finder references: [Apple’s Finder guide](https://support.apple.com/guide/mac-help/organize-your-files-in-the-finder-mchle9f0a1b2/mac), reviewed 2026-10-12. Sidebar/titlebar alignment, four-view toolbar, column ancestry and gallery filmstrip follow those references. All file icons and Alpine preview artwork are original example content. Screenshots include list/selection/density/dark, light/dark/narrow columns, icons, gallery and the open menu.
