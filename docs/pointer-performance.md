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
