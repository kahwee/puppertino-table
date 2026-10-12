# README media

Curated documentation assets recorded from the working **Examples / Finder** Storybook apps, using fictional files and in-memory state. These are public demo media, not uploaded documents or browser regression artifacts.

Run `pnpm capture:readme` from the repository root. It builds Storybook, captures six PNG screenshots, and records three real interaction sequences as animated GIFs, MP4s and WebMs. Requirements: Chromium, Playwright's video helper (`pnpm exec playwright install ffmpeg`), and system `ffmpeg` with libx264 and libvpx-vp9. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a system browser.

- **Resizing:** table divider drag, double-click reset, independent browser-panel drag.
- **Context menu:** right-click at 125% zoom, Get Info, Shift+F10, Escape.
- **Drag/drop:** move Project brief into Archive, verify it leaves Projects, then open Archive and verify arrival.

Assertions check the actual resulting UI; axe checks light/dark, comfortable, columns and the open menu. Pointer/caption overlays make interactions readable; app content and gestures are real. GIFs are 900px wide at 12fps; MP4s and WebMs retain the 1080×640 capture. Original intermediate recordings stay under ignored `test-results/`.

The README uses absolute GitHub image URLs so images also resolve on npm. Storybook copies this directory to `/media` for Pages video links. Keep media out of the npm package.

Storybook offers WebM first and MP4 second so playback does not depend on a browser build shipping the H.264 decoder.
