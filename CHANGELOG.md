# Changelog

## Unreleased

- Add hydration-safe, completion-only column-browser width persistence with bounded hidden-panel preferences and controlled-state ownership.
- Add delegated context-menu capture handlers with caller-owned context resolution and native-menu fallthrough.
- Document scoped item, divider, focus, icon and secondary-text styling hooks; support nested artwork in shared slots.
- Preserve sibling widths when a schema change cancels a drag; expand persistence, hydration and delegated-menu regression coverage and Storybook recipes.

## 0.6.0 — 2026-10-12

- Inherit density through CSS custom properties and scoped table rules when no preset is supplied; preserve standalone defaults, explicit native/compact/comfortable overrides and partial metrics without React context.

- Add completion-only browser `onWidthsCommit` and table resize `onCommit` callbacks; preserve preview updates and report intended controlled widths without waiting for React to rerender.
- Add native anchor browser items through `href`, with link-specific types, modifier-click/target/download support and accessible disabled behavior.
- Add context-menu links, separators, icons and shortcut hints; navigate enabled links/buttons together and preserve native link activation.
- Extend resource-browser Storybook workflows and packed-consumer/browser checks for these APIs.

## 0.5.0 — 2026-10-12

- Add scoped native/compact/comfortable density and explicit row/padding/icon metrics across tables and custom layouts; preserve native defaults.
- Add a caller-rendered, independently resizable column browser with whole-panel fitting, selected/path states and controlled/read-only widths.
- Share resize lifecycle/event adaptation between table columns and browser panels instead of duplicating gesture handling.
- Add right-click and keyboard context-menu primitives with viewport fitting, disabled-item navigation, dismissal and focus restoration, plus realistic light/dark resource-browser Storybook workflows.

- Add opt-in anchored row-selection gestures for custom layouts, with mixed leading/data items, Command/Ctrl toggles, shrinking Shift ranges and controlled/atom/disabled ownership guards.
- Export a React-independent selection reducer and whole-column browser geometry helper, with unit, Storybook, browser and packed-consumer checks. Existing checkbox selection remains unchanged.

- Extract hydration-safe preference restoration into a dedicated persistence lifecycle hook.
- Add typed external atom ownership for sorting, selection and sizing; reject conflicting owners and changed bindings without a remount.
- Add external-atom integration docs, Storybook coverage and production pointer profiling with cell-render regression checks.

## 0.4.0 — 2026-10-12

- Keep uncontrolled sorting and selection in TanStack atoms while preserving observer callbacks and the public selected-state contract.
- Subscribe inside checkbox and resize primitives to prevent stale selection and sizing with stable memoized props.
- Cancel only the dragged column and avoid repeating the completed resize preview update.

- Restore saved widths after hydration and reload preferences when the storage key, adapter or column schema changes.
- Add app-owned `columnSizing` and `onColumnSizingChange`, including read-only sizing and controlled/uncontrolled transition coverage.

- Add pinned Biome formatting, import organization and recommended lint checks to local and CI verification.
- Format maintained code, resolve lint findings and document narrow accessibility/gesture exceptions.

## 0.3.0 — 2026-10-12

- Require the latest stable React 19 at release time (19.3.0, peer range `^19.3.0`); remove React 18 compatibility coverage.

- Extract a React-independent resize gesture controller, browser-effects adapter and persistence module; keep the hook focused on lifecycle and event adaptation.
- Compose the complete table from exported `TableHeader`, memoized `TableBody`, `RowSelectionCheckbox` and `ColumnResizeHandle` primitives.
- Separate public state, row/cell customization, body context and resize type contracts from rendering modules; preserve existing root exports.
- Replace duplicated custom-layout examples with shared primitives, document the contracts, and add controller unit tests plus checkbox Storybook coverage.
- Preserve Puppertino's separated borders, rounded stripes, native header emphasis and numeric alignment.
- Derive secondary text, focus rings and resize dividers from Puppertino theme tokens; keep selected-row colors through hover.
- Match the compact desktop header band and group the selection cell with its first data column.

## 0.2.0 — 2026-10-12

- Add typed row/cell DOM customization callbacks and a leading-rows slot to the complete table.
- Expose `usePuppertinoTable` for shared sorting, selection and persisted-sizing initialization in custom layouts.
- Share resize gesture state and global listeners per table, with safe active-handle removal and coordinated columns.
- Support uncontrolled sorting/selection with initial values and change notifications; controlled state without callbacks is read-only.
- Supply typed body context and data attributes to customization callbacks; infer primitive resize labels from headers.
- Document complete-component and primitive integrations, including server-owned pagination.

## 0.1.1 — 2026-10-12

- Correct npm installation and publication-status documentation.
- Add a guarded GitHub Release publishing workflow with exact tag, commit, version and tarball validation.
- Run adversarial release-guard tests in CI and verify registry consumers after publishing.

## 0.1.0 — 2026-10-12

- Publish the requested unscoped `puppertino-table` package.
- Restore pre-gesture widths when standalone resize controls unmount or their cancellation settings change.
- Show standalone resize controls only on actual leaf headers, including grouped-header layouts.

- Generic React table and typed column helpers powered by TanStack Table.
- Controlled sorting and selection, optional local sorting, and Shift-click selection ranges.
- Pointer and keyboard column resizing with bounds, cancellation and optional persistence.
- Unbundled ESM, TypeScript declarations and a scoped Puppertino stylesheet.
- Storybook 10 examples for grouped headers, alternate schemas, dark mode and table states.
