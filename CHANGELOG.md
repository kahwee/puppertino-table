# Changelog

## Unreleased

- Polish the Finder Storybook workspace: continuous sidebar material, content-aligned path/status bars, quieter toolbar spacing, pill-shaped search, larger icon previews and consistent sidebar icon colors in both themes. Improve tag-suggestion hover contrast, consolidate duplicate chrome styles and remove obsolete selectors. Refresh the demo screenshots and screencasts.

## 0.8.0 — 2026-10-13

### API changes

- Share one selection anchor across table checkboxes and `useRowSelectionGestures`; add `selectionAnchor` to complete-table/hook options for cross-view selection. Checkbox Shift ranges now extend and shrink from the fixed anchor; plain clicks toggle, and Command/Ctrl+Shift adds a range. Header select-all resets the anchor and preserves other-page selections.
- Reject atom/value/change-callback ownership conflicts in the public TypeScript contracts for sorting, selection and sizing, while retaining runtime validation for JavaScript callers. Different slices may still have different owners.
- Notify standalone `onColumnSizingChange` observers for internally owned widths, matching sorting/selection observers. Change callbacks retain TanStack value-or-updater semantics.
- Add `PuppertinoTable.onColumnSizingCommit` for completed pointer, keyboard and reset snapshots in internal, controlled and atom-owned modes. Previews and cancelled gestures do not commit; browser `onWidthsCommit` and primitive `onCommit` remain supported.
- Export `ContextMenuState` and reject invalid separator/command/link prop combinations. Preserve property-presence narrowing for menu labels. Remove redundant internal type re-exports; package-root imports remain supported.

### Components and examples

- Add a visible-row select-all checkbox with mixed state, keyboard support and disabled empty/read-only behavior; preserve selection on other pages when selecting or clearing the current page.
- Add shared Finder selection across four views, bulk move/delete, Trash restore and undo, selected-group dragging and menu-only move/delete commands. Replace the bulk action bar with a bottom selection status; use Puppertino window, toolbar, sidebar and popover styles with consistent Phosphor icons. Keep all file operations in memory.
- Add Finder tag assignment/removal, gray input tokens, new-tag creation, sidebar filters and bulk tagging. Preserve tags through move/delete/restore; reset clears them. Keep toolbar and tag components in separate demo modules.
- Add `selectionCheckboxes` (default `true`) to hide the complete table’s selection column independently of selection capability. Finder examples default to row selection; a separate checkbox story retains the optional controls.
- Register resize members and committed options before paint so first keyboard/pointer interactions work immediately; preserve cancellation on disable, unmount and responsive transitions.
- Render grouped-header placeholders as non-header cells, and apply shared table contrast styles to the standalone checkbox example.

### Storybook, documentation and verification

- Improve Storybook 10 args/argTypes, setup versus live controls, defaults and component recipes; consolidate browser/menu documentation and add a 0.8 migration guide.
- Add an interactive resize-events story and commit outputs for controlled/atom examples. Extract stateful sizing examples into a dedicated demo module and remove the duplicate atom-selection workaround story.
- Run every indexed story and require successful play-function and accessibility reports; fix the External Atoms numeric-sort expectation.
- Refresh eleven documentation screenshots and three interaction screencasts for the current Finder workspace.
- Add mixed checkbox/row/cross-view range regressions, internal callback tests, complete-table commit/cancellation checks and installed-package ownership type contracts.

## 0.7.1 — 2026-10-12

- Rebuild the Finder Storybook workspace with an aligned sidebar/titlebar, compact icon toolbar, search, folder history, path/status bars and original file artwork.
- Add app-owned Icon and Gallery views, dark columns and a constrained narrow workspace alongside the shared table/column browser examples.
- Refresh all ten documentation screenshots and three interaction screencasts; capture context-menu close-ups without scaling the menu coordinate system.
- Expand browser coverage for four-view navigation, search, history, empty previews, keyboard menus, reset, narrow overflow and accessibility. Public runtime APIs remain unchanged.

## 0.7.0 — 2026-10-12

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
