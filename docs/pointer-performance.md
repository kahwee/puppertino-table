# Pointer resize profile

Measured on 2026-10-12 with Chrome 154.0.8037.98 on the development Mac. Run `pnpm profile:pointer` to reproduce; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when using an existing browser. The production fixture renders 100 rows, varies the column count and uses 4× CDP CPU throttling. Each size has one warmup followed by three measured drags of 120 sequential CDP pointer moves.

| Columns | Median dispatch time | Dispatch p95 | Median browser task time per event | Cell rerenders during resizing |
| --- | --- | --- | --- | --- |
| 10 | 0.2 ms | 1.0 ms | 6.1 ms | 0 |
| 40 | 0.5 ms | 1.9 ms | 19.9 ms | 0 |
| 100 | 0.7 ms | 3.2 ms | 38.8 ms | 0 |

Each timing above is the median of the three measured samples. Dispatch measures document capture to bubbling completion, not end-to-end display latency. Browser task time uses Chromium Performance metrics and includes rendering work across the drag, divided by the event count. These synthetic results include throttling and are not real-device latency guarantees.

The memoized body remains isolated from sizing updates. Browser work increases substantially with very wide tables, while dispatch work is much smaller. Immediate updates remain in place. Sequential CDP moves do not establish whether requestAnimationFrame batching would reduce work under real high-frequency event bursts, so batching should be compared on that workload before changing completion, cancellation or persistence semantics. Consider virtualization for large custom layouts rather than interpreting this profile as a reason to weaken gesture correctness.

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
