# Pointer resize profile

Measured on 2026-10-12 with Chrome 154.0.8037.98 on the development Mac. Run `pnpm profile:pointer` to reproduce; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when using an existing browser. The production fixture renders 100 rows, varies the column count and uses 4× CDP CPU throttling. Each size has one warmup followed by three measured drags of 120 sequential CDP pointer moves.

| Columns | Median dispatch time | Dispatch p95 | Median browser task time per event | Cell rerenders during resizing |
| --- | --- | --- | --- | --- |
| 10 | 0.2 ms | 1.0 ms | 6.1 ms | 0 |
| 40 | 0.5 ms | 1.9 ms | 19.9 ms | 0 |
| 100 | 0.7 ms | 3.2 ms | 38.8 ms | 0 |

Each timing above is the median of the three measured samples. Dispatch measures document capture to bubbling completion, not end-to-end display latency. Browser task time uses Chromium Performance metrics and includes rendering work across the drag, divided by the event count. These synthetic results include throttling and are not real-device latency guarantees.

The memoized body remains isolated from sizing updates. Browser work increases substantially with very wide tables, while dispatch work is much smaller. This original run used immediate previews. Sequential CDP moves alone do not establish whether frame batching helps high-frequency bursts; the burst comparison below measures that separately. Consider virtualization for large custom layouts rather than interpreting this profile as a reason to weaken gesture correctness.

Raw samples and the production fixture are written to `test-results/pointer-profile/results.json` and are excluded from publication. The benchmark asserts zero cell rerenders and can be rerun after a candidate optimization.

## Header dragging and layout controls

Measured on 2026-10-14 with Chromium 154.0.8037.57 in the Linux development environment. Run `pnpm profile:columns` (or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`) to reproduce. This production fixture uses 100 rows, 4× CPU throttling, one warmup and three measured runs at each column count. Each run moves a header 60 times within the same drop target, then makes 30 resize preview moves and cancels both gestures.

| Work during previews | Before | After |
| --- | --- | --- |
| Header renders, 10 columns / 60 drag moves | 600 | 60 |
| Header renders, 40 columns / 60 drag moves | 2,400 | 60 |
| Header renders, 100 columns / 60 drag moves | 6,000 | 60 |
| Header renders, 30 resize moves | 30 × column count | 0 |
| Layout-picker renders, 30 resize moves | 30 | 0 |
| Row-cell renders during either preview | 0 | 0 |

All three measured runs agreed on these render counts. Headers use DnD Kit's draggable/droppable primitives without subscribing stationary headers to sortable transforms or public motion context. The moving ghost and active header still update; target changes, start and completion may update other headers. Table and Outline header controls sit outside the geometry subscription, while resize separators keep their own column-width subscriptions. The preset picker selects the committed preset ID and caches snapshot matching; temporary width previews neither rerender it nor repeat preset serialization.

The command asserts these render limits and zero ordering commits during motion. Its render counters are injected only into the profiling build. Raw samples, browser task time per move and the production fixture live in ignored `test-results/column-profile/`. Render-count reductions do not imply the same reduction in display latency: browser layout and paint still grow with table size. This synthetic profile does not measure real-device frame rate or end-to-end latency; the interaction suites separately check completed drops, cancellation, keyboard/touch input, persistence and selection.


## Pointer bursts and completion

Run `pnpm profile:resize-bursts` to compare immediate and frame-batched previews in the same production fixture. The immediate switch exists only in the profiling fixture. Each column count has one warmup and three measured runs, with 100 rows and 4× CPU throttling. A real mouse press starts pointer capture, followed by 30 animation frames containing eight synthetic pointer moves each, then a real release. This is a synthetic burst workload, not a hardware input-rate or end-to-end latency measurement.

The benchmark asserts the final width, one completion commit, zero row-cell rerenders and at most 30 preview updates for 240 input events in the batched mode. It writes all raw samples and browser metadata to `test-results/pointer-bursts/results.json`. Pending previews are flushed on release and discarded on Escape, pointer cancellation, lost capture, unmount, disable and responsive cancellation; deterministic controller tests cover frames that have not yet run, stale callbacks and normalized coupled-pane commits. Coupled-pane previews remain immediate because normalization depends on the other panes’ previous sizes; this batching change applies to independent column widths.

Measured October 15, 2026 (Pacific), Chromium 154.0.8037.57 on the Linux development environment:

| Columns | Preview applications, immediate → frame | Median browser task ms/input event, immediate → frame |
| --- | --- | --- |
| 10 | 240 → 30 | 8.95 → 7.68 |
| 40 | 240 → 30 | 28.14 → 27.10 |
| 100 | 240 → 30 | 54.13 → 54.02 |

All measured samples committed once and rendered zero row cells. Batching removes seven out of eight preview updates in this workload. The wide-table browser-task difference is negligible: batching does not eliminate layout/paint costs or establish improved frame rate. These task metrics include browser work beyond event dispatch and should not be presented as end-to-end input latency.

## Opt-in row virtualization

The Large inventory Storybook example compares identical loaded data with ordinary and virtual rendering. `pnpm test:browser` includes desktop/phone light/dark checks at 10,000 rows × 100 columns, plus keyboard/IME handling, logical row indices, focus retention, last-row geometry and axe. A separate SSR/hydration fixture checks the first mount. Raw DOM-count comparisons are written to `test-results/browser/virtual-table-results.json`.

In the focused Chromium check on October 16, 2026 (UTC), the wide 10,000-row case mounted 26 rows and 2,626 cells (including selection cells). At the same 100-row × 100-column dataset, ordinary rendering created about 10,100 body cells including selection and the request row; virtualization mounted 2,020 data cells. These are DOM counts, not frame-rate or end-to-end latency measurements. All columns remain rendered per mounted row; data/model memory is not virtualized. The existing pointer profiles above still describe ordinary rendering.
