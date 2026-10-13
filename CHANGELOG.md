# Changelog

## Unreleased

- Lead Code panels with shorter typed integrations and expandable supporting files; compile both parts against the installed package.
- Add empty, long-name, large and read-only data presets to existing Table and document-workspace playgrounds. Improve workspace selection counts, empty-state recovery, action feedback and command focus recovery.

## 0.12.1 — 2026-10-13

- Consolidate Storybook variants into typed playgrounds and shareable scenarios. Group Table controls and compare React/atom ownership in one example.
- Make Code follow live args for Table, Tag picker, Outline and Split view, with complete typed callbacks and state wiring.
- Strengthen the composed document workspace with resizable panes, Archive navigation, shared selection, previews, tags and Trash/undo. Reset example restores args and local state.
- Simplify integration guidance with component choices, ownership cards and concise scenario cards. Link named workflows to Interactions and verify 42 public recipes against the installed package.

## 0.12.0 — 2026-10-13

- Add Outline to both Finder examples and shared view metadata, preserving the established four-view API for existing icon maps. Share file IDs, selection, sorting and column sizing across List/Outline; retain search, tags, history, rename, Quick Look and file commands.
- Add `isRowSelectable` and composable Outline row/cell hooks. Filter nested row gestures correctly, preserve treegrid semantics, and exclude non-file groups and collapsed selections from Finder bulk actions.
- Replace custom menu navigation/positioning with Base UI 1.9.0 context-menu primitives while preserving public action/link/separator and trigger APIs, Puppertino styling, portal theme, focus restoration and app-owned commands. Disabled entries remain keyboard discoverable without activation. Add React DOM as a peer and commit the runtime dependency lockfile.


- Refresh the README media with the refined Finder sidebar, standalone Sidebar, nested Outline and Split views. Record real lazy-load/retry and pane resize/hide/restore workflows alongside Finder gestures; add public screenshot and video links.

## 0.11.0 — 2026-10-13

- Tighten Storybook around typed Playgrounds, grouped/conditional args controls, synchronized app state, and focused docs. Keep regression canvases indexed and tested while excluding them from navigation and Autodocs. Document the Storybook 10 TypeScript/args conventions, add public sidebar recipes and verify the real Controls panel for Sidebar, Outline and Split views.


- Export reusable `Sidebar`, `SidebarGroup`, and native button/link `SidebarItem` components with typed sizes and trailing details. Compose Finder sidebars from these primitives and refine them with Puppertino’s attached material, standard desktop rows and headings, hover feedback, scrollable groups, truncated labels, and larger touch targets.

## 0.10.0 — 2026-10-12

- Add Apple-named `OutlineView`, `SplitView`, `TableView` and `ColumnView` APIs. Outline rows support sibling sorting, disclosure, visible-only bulk selection, keyboard navigation and cancellable lazy `loadChildren` with caching/retry. Split panes support both axes, compact navigation, hidden panes and completion-only size persistence. Rename the resource-browser Storybook group to Column view.

- Consolidate Storybook variants into args-driven playgrounds while retaining the focused Table sidebar. Replace flag-only Resource browser variants with one playground and keep separate styling and density-inheritance recipes.
- Synchronize playground args with in-app view, density, narrow-layout and resize controls. Preserve Finder file operations, selection and inspector state while changing views or spacing; offer mutually exclusive width ownership and menu-trigger modes.
- Combine item-selection ownership and tag option datasets into controls. Keep distinct API recipes, responsive examples and keyboard/creation workflows, update documentation and capture presets, and verify real manager Controls with browser regressions.

- Make the main Table stories bind the public generic component directly and typecheck their real props. Remove the redundant Typed table section and point the TypeScript guide at the Table playground.

- Remove dedicated dark-mode stories and use the existing Storybook Theme toolbar for every example; retain dark-theme browser and modal coverage through shared globals.

- Focus the Table Storybook sidebar on nine primary examples; keep specialized stories available to browser checks by direct URL. Open the playground without an automatic sort, and verify sorting in browser checks instead.
- Add a direct generic typed table Storybook example and TypeScript integration guide, checked numeric/Date cells and props, compile-time story contracts, and packed-consumer coverage for the new recipe.

- Center the shared table selection column, use Puppertino's checkbox appearance in headers and rows, preserve a direct input hit area, and tighten the checkbox composition story.
- Add app-owned ready/loading/error table states, accessible busy/status/error semantics, retry content and refreshes that preserve existing rows.
- Export reusable roving item focus with list/grid/panel navigation, Shift selection integration, Home/End and filename typeahead. Keep activation and application commands caller-owned.
- Add Finder keyboard view/history shortcuts, Quick Look with native modal focus, double-click previews, Return rename with validation, column-pane navigation and persistent list sorting/selection across view changes. All file operations remain in memory.
- Simplify local/controlled/atom gesture recipes and extend packed-consumer checks to request and keyboard examples. Demonstrate missing/invalid dates, stable last-position sorting, timezone display and daylight-saving transitions.

- **Behavior change:** automatic local sorting is now the default (`manualSorting=false`). Consumers with server pages or app-owned order must set `manualSorting` explicitly; controlled sorting state alone does not select manual mode.
- Let table headers, bodies and standalone resize handles inherit selection-column visibility, disabled state and resize policy from `usePuppertinoTable`. Keep sizing separate from memoized row cells and suppress primitive handles for read-only widths.
- Register TanStack's standard sorting functions, demonstrate real Date accessors with datetime sorting and semantic formatted cells, and replace Finder's display-string timestamps with Date values.
- Show actual library defaults in Storybook Controls, make the simple table the primary example, provide complete public recipes for state ownership, custom rows, pagination and gestures, and typecheck every recipe against the installed packed package during `pnpm check`.

## 0.9.1 — 2026-10-12

- Align the Finder and resource-browser examples with Puppertino’s Phosphor Icons guidance. Use regular toolbar icons, filled selected views and duotone file-type icons; preserve readable icon colors on selected rows.
- Replace the Lucide development dependency with `@phosphor-icons/react` and update documentation recipes. Public APIs and runtime dependencies remain unchanged.
- Recompose eleven screenshots with tighter framing and higher resolution. Improve three interaction screencasts with numbered captions, pointer highlights, trimmed loading frames and higher-quality GIF, MP4 and WebM encoding.
- Reorganize the README around installation, composition, views, gestures and tags; align the walkthrough and media guide with the Phosphor examples.
- Use Puppertino’s native expanded search-field styling. Keep toolbar controls from shrinking into overlapping hit targets when search expands; allow complete control groups to wrap.
- Stabilize narrow-table context-menu verification by right-clicking the visible filename after scrolling, avoiding a clipped-row click that immediately dismisses the menu.

## 0.9.0 — 2026-10-13

- Export composable Finder window/body/content, toolbar groups/buttons/title, window controls, history, view switcher, search, actions, sidebar groups/items, icon grid/items, gallery/filmstrip/items, preview, details, empty-state and path/status-bar primitives. Refactor the complete Finder demo to use these public components.
- Keep controlled view/search/tag values, selected item state, native props/refs and icon/content slots consistent. Reuse the existing typed context-menu actions; keep file data, artwork and mutations application-owned. Include the shared Finder styling in the existing CSS export and add a public-API-only composition example, guide and packed-consumer type/rendering checks.
- Avoid stealing search focus when a deferred post-delete or restore focus update runs after the user has moved to another control.
- Export controlled `TagPicker`, `TagOption` and `TagPickerProps` independently of Finder file data. Support mixed bulk selections, optional application-owned creation and disabled tags.
- Add keyboard suggestion navigation, deliberate two-step Backspace removal and case-insensitive duplicate prevention. Anchor the native top-layer popover to its trigger, clamp it to the viewport and reposition on scroll/resize.
- Reuse Puppertino popover material, arrow and theme; refine token spacing and hollow tag indicators. Replace demo Phosphor icons with thin Lucide outlines, including the Finder-oriented tag icon.
- Add standalone Storybook tag controls and assigned, mixed, disabled, long-label, disabled-tag and clipped-container examples.
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
