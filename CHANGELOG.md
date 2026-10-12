# Changelog

## Unreleased

- Add typed row/cell DOM customization callbacks and a leading-rows slot to the complete table.
- Expose `usePuppertinoTable` for shared sorting, selection and persisted-sizing initialization in custom layouts.
- Share resize gesture state and global listeners per table, with safe active-handle removal and coordinated columns.
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
