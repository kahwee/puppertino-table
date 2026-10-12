# Puppertino Table

A generic React table styled with [Puppertino](https://puppertino.com/) and powered by [TanStack Table](https://tanstack.com/table). Bring your own data, columns and cell renderers.

- Complete component customization and a reusable state hook for custom layouts.
- One shared resize controller per table, including standalone handles.
- Typed column definitions for arbitrary row shapes, including grouped headers.
- Host-controlled sorting by default, with optional local sorting.
- Checkbox selection with Shift-click ranges and keyboard toggling.
- Precise, bounded column resizing with optional browser-local persistence.
- Sizing subscriptions isolated from the memoized row body.
- Semantic tables, accessible resize separators and horizontal scrolling in narrow containers.
- Storybook **10.6.1** with interactive examples and accessibility checks.

## Install

The package includes built ESM and TypeScript declarations. Install it from npm:

```sh
pnpm add puppertino-table@0.3.0 @tanstack/react-table@9.2.8 @codedgar/puppertino@2 react@19.3.0 react-dom@19.3.0
```

React 19.3.0 or a compatible newer React 19 release is required (`^19.3.0`). React 18 and React 20 are outside the supported range. React, TanStack Table and Puppertino are peer dependencies; the library does not bundle another copy of them. For Git-based installation, use `github:kahwee/puppertino-table` and pin a commit or tag for reproducibility.

## Use

```tsx
'use client';
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { PuppertinoTable, createPuppertinoColumnHelper } from 'puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import 'puppertino-table/style.css';

type Item = { id: string; name: string; score: number };
const helper = createPuppertinoColumnHelper<Item>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 240, minSize: 140, maxSize: 600 }),
  helper.accessor('score', { header: 'Score', size: 100, cell: cell => cell.getValue() }),
]);
const items: Item[] = [{ id: 'a', name: 'Example', score: 82 }];

export function Example() {
  const [sorting, setSorting] = useState<SortingState>([]);
  return (
    <PuppertinoTable
      data={items}
      columns={columns}
      getRowId={item => item.id}
      getRowLabel={item => item.name}
      ariaLabel="Items"
      sorting={sorting}
      onSortingChange={setSorting}
      manualSorting={false}
      selectable
      storageKey="my-app.items.columns.v1"
    />
  );
}
```

For simpler tables, omit `sorting` and `onSortingChange` to let the library own sort state; set `manualSorting={false}` for local ordering. `initialSorting` and `initialRowSelection` seed uncontrolled state on mount. You can provide change callbacks as notifications while leaving state uncontrolled. If you provide controlled `sorting` or `rowSelection` without its matching callback, that state is read-only. Do not switch between controlled and uncontrolled ownership while a table is mounted.

The example uses local sorting and uncontrolled checkbox selection. Pass both `rowSelection` and `onRowSelectionChange` for controlled selection. Controlled selection without a change callback is read-only. Keep column definitions and data references stable when possible.

### Sorting and pagination

`manualSorting` defaults to `true`: the table reports sort changes and renders rows in the order provided. Your caller can sort/filter/page locally or request data from any backend. The component makes no network calls, has no endpoint conventions, and does not treat a loaded page as the full dataset. Pagination controls belong to the caller. Use `manualSorting={false}` to let TanStack sort all supplied rows locally.

### Resizing

Drag a header's right edge. Double-click or Enter resets that column to its definition's initial size. Left/Right adjusts 16 pixels; Shift uses 40 pixels. Home/End reaches its limits, and Escape cancels an unfinished gesture. Pointer cancellation, losing window focus, unmounting, or disabling resizing also cancels.

`storageKey` enables persistence; without it no preferences are stored. Supply `storage` to use a compatible storage adapter. Malformed values, unknown column IDs and blocked browser storage fall back safely. Use stable column IDs or string accessor keys. Change the component's React `key` when switching schemas or persistence keys so initialization reads the new configuration.

`cancelMediaQuery` is optional: set it when your layout removes the table at a responsive breakpoint. A narrow table that remains visible can simply scroll horizontally.

### Choose an integration path

Use **`PuppertinoTable`** for the complete semantic table: headers, sort buttons, optional selection, bounded resize handles, scrolling and memoized data rows. Customize it with `getRowProps(row)`, `getCellProps(cell)` and `leadingRows` before building a separate layout.

```tsx
<PuppertinoTable
  data={items} columns={columns} getRowId={item => item.id}
  sorting={sorting} onSortingChange={setSorting} ariaLabel="Items" selectable
  getRowProps={row => ({
    className: row.id === activeId ? 'active-row' : undefined,
    'aria-current': row.id === activeId ? 'true' : undefined,
    onClick: () => setActiveId(row.id),
    onContextMenu: event => { event.preventDefault(); openMenu(row.original, event.clientX, event.clientY); },
  })}
  getCellProps={cell => ({ title: String(cell.getValue() ?? '') })}
  leadingRows={(_table, context) => (
    <tr><td colSpan={context.columnCount}>
      <button type="button" onClick={openFolder}>Open folder</button>
    </td></tr>
  )}
/>
```

Callbacks receive typed TanStack row/cell objects, including `original`, IDs and state methods. Their second argument is `PuppertinoBodyContext`: `{ table, columnCount, selectable, disabled }`. Typed `data-*` attributes are supported on row and cell props; return `undefined` to leave a row or cell unchanged. Row props are applied to data `<tr>` elements and cell props to data `<td>` elements. The selection cell stays library-owned. Custom row classes are combined with `p-selected`; selection checkbox clicks do not bubble to the row. The library retains row/cell children and React keys. Keep callbacks stable when possible so sizing updates can reuse the memoized body. Callbacks can attach events, styles and DOM attributes; the app owns context-menu rendering and keyboard access to its actions.

`leadingRows` accepts React content or a function receiving the table. Its second argument is the same body context, with `columnCount` including the selection column. Return semantic `<tr>` elements with `<th>`/`<td>` children. It renders inside `<tbody>` before data rows, including when there are no data rows; the empty-state row still renders. Use `context.columnCount` for full-width row `colSpan`. Leading rows are app-owned: they do not enter the data row model, sorting, selection ranges or the row/cell callbacks.

Use **`usePuppertinoTable` and the primitives** when you own the table wrapper, selection controls or header layout. `TableHeader` and memoized `TableBody` are the same components used by `PuppertinoTable`. They preserve grouped-header semantics, sort accessibility, resize controls, row customization and selection. The hook returns a `PuppertinoTableInstance` and shares the complete component's column bounds, persisted initial sizing, sorting ownership and controlled/uncontrolled selection rules. It accepts the state/data options from `PuppertinoTable`, without rendering options such as `ariaLabel` or `leadingRows`.

```tsx
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { usePuppertinoTable, TableHeader, TableBody } from 'puppertino-table';

function CustomItems() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const storageKey = 'my-app.custom-items.columns.v1';
  const table = usePuppertinoTable({
    data: items, columns, getRowId: item => item.id,
    sorting, onSortingChange: setSorting, manualSorting: false, selectable: true, storageKey,
  });
  return <div className="pt-scroll" tabIndex={0} role="region" aria-label="Items scroll area">
    <table.Subscribe source={table.atoms.columnSizing}>{() => (
      <table className="p-table pt-table" aria-label="Items" style={{ width: table.getTotalSize() + 36 }}>
        <colgroup><col style={{ width: 36 }} />{table.getAllLeafColumns().map(column => <col key={column.id} style={{ width: column.getSize() }} />)}</colgroup>
        <TableHeader table={table} selectable resizeOptions={{ storageKey }} />
        <TableBody table={table} selectable getRowLabel={item => item.name}
          leadingRows={(_table, context) => <tr><td colSpan={context.columnCount}>Folder</td></tr>} />
      </table>
    )}</table.Subscribe>
  </div>;
}
```

Pass matching `selectable` values to the hook, header and body; include a 36-pixel selection `<col>` when it is enabled. Pass `disabled` to all three to disable selection, sorting controls and resizing consistently. Keep the geometry subscription around the table; `TableBody` is already memoized separately. It supplies the empty-state row and accepts the same `getRowProps`, `getCellProps`, `leadingRows` and `getRowLabel` options as the complete component.

For a fully custom header or body, use `ColumnResizeHandle` and `RowSelectionCheckbox` individually. The checkbox handles Shift ranges, keyboard toggling and event isolation from row clicks. Give it `row`, an optional row-description `label`, and `disabled` when appropriate. Keep your `<thead>`/`<tbody>` and `<th>`/`<td>` markup semantic and supply accessible sort state.

### Public type contracts

All existing root imports remain supported. Rendering modules consume dedicated type contracts: table state options, body/customization types and resize options are defined separately from component implementations. Import these contracts with `import type`:

```tsx
import type {
  PuppertinoTableOptions, PuppertinoTableProps,
  PuppertinoRow, PuppertinoCell, PuppertinoBodyContext,
  PuppertinoRowProps, PuppertinoCellProps,
  TableHeaderProps, TableBodyProps, RowSelectionCheckboxProps,
  ColumnResizeOptions, ColumnResizeHandleProps,
} from 'puppertino-table';
```

The controller's gesture engine, browser effects and persistence are internal modules. `useColumnResize` manages React lifecycle and adapts events; it continues to provide the existing `handle(columnId)` API.

The hook initializes sizing but does not install resize listeners; `TableHeader` installs them through its shared resize handles. `ColumnResizeHandle` infers its accessible label from a string header or column ID; pass `label` for a custom or translated name. Its props type is exported as `ColumnResizeHandleProps`. `ColumnResizeHandle` and `useColumnResize` automatically share a controller keyed by the table's sizing store, with one pair of global keydown/blur listeners and one active gesture. The initiating handle's options govern that gesture; pass consistent storage and responsive settings to all handles. Removing the active handle, disabling it or changing its resize settings cancels its preview. Removing other handles leaves the gesture running. Separate tables remain independent. Pass `options={{ enabled: false }}` to hide a primitive handle when your layout is disabled; the hook's `disabled` controls selection, while primitive UI controls remain yours to disable.

For more specialized state wiring, the existing `puppertinoTableFeatures`, `PuppertinoTableInstance`, sizing helpers and TanStack `useTable` remain available. In custom layouts, use `TableBody` or memoize your custom row body separately from the `columnSizing` subscription to avoid rerendering cells during drags.

### Server-paginated complete table

The server owns pagination and order. This example receives one page and its total from the host's loader; it makes no assumption about an API URL. `loadPage` must honor its abort signal. Updating the sort resets the page; stale requests cannot replace newer results. Use stable IDs across pages and keep selection state in the host if selections must survive page changes.

```tsx
import { useEffect, useState } from 'react';
import type { SortingState, RowSelectionState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';

type PageLoader = (query: { page: number; pageSize: number; sorting: SortingState; signal: AbortSignal }) => Promise<{ rows: Item[]; total: number }>;

function ServerItems({ loadPage }: { loadPage: PageLoader }) {
  const [query, setQuery] = useState({ page: 0, sorting: [] as SortingState });
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [result, setResult] = useState<{ rows: Item[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 25;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    loadPage({ ...query, pageSize, signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(() => { if (!controller.signal.aborted) setError('Could not load items.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadPage, query]);
  return <>
    {error && <p role="alert">{error}</p>}
    <PuppertinoTable data={result.rows} columns={columns} getRowId={item => item.id} ariaLabel="Items"
      manualSorting sorting={query.sorting}
      onSortingChange={update => setQuery(previous => ({ page: 0, sorting: typeof update === 'function' ? update(previous.sorting) : update }))}
      selectable rowSelection={selection} onRowSelectionChange={setSelection} disabled={loading}
      emptyContent={loading ? 'Loading items…' : 'No items'} />
    <p role="status">{loading ? 'Loading items…' : `${result.total} items`}</p>
    <button type="button" disabled={loading || query.page === 0} onClick={() => setQuery(previous => ({ ...previous, page: previous.page - 1 }))}>Previous page</button>
    <button type="button" disabled={loading || (query.page + 1) * pageSize >= result.total} onClick={() => setQuery(previous => ({ ...previous, page: previous.page + 1 }))}>Next page</button>
  </>;
}
```

Keep `loadPage` stable (for example, a module-level function or `useCallback`). Selection IDs may include unloaded pages, so counts and bulk actions should use the host's selection state, not just the current row model. Use the same data, query and selection options with `usePuppertinoTable` for a server-paginated custom layout. Leave `manualSorting` enabled in both paths so a loaded page never gets re-sorted as if it were the complete dataset.

The package adds scoped `.pt-*` enhancements to Puppertino's `p-table` styles. Import Puppertino's CSS in your application, then the package stylesheet. Theme tokens remain owned by Puppertino and your application. Include Puppertino's dark-mode stylesheet when using its dark theme.

Puppertino owns separated borders, rounded row stripes, numeric alignment and active-header weight. The package adds scroll/sticky geometry, sort-button and resize-target behavior, plus contrast-safe text. Override `--pt-table-secondary` for secondary/header text and `--pt-table-text` for data-cell text using your application's Puppertino theme tokens. Selection reads `--p-list-selection` and `--p-list-selection-text` in every hover state.

## Storybook and demo

GitHub Pages is configured to publish [Storybook 10](https://kahwee.github.io/puppertino-table/) from `storybook-static/` after the checks on main pass. The Pages artifact contains only Storybook and its examples. Pull requests run verification without deploying. For repository setup, select **Settings → Pages → Source → GitHub Actions**; the workflow also attempts to enable Pages automatically.

Use Node 20.19+ or 22.12+ and pnpm 11.25.0.

```sh
pnpm install
pnpm storybook       # http://localhost:6006
pnpm dev             # standalone 267-row fictional-data demo
pnpm build:storybook # static Storybook in storybook-static/
```

Stories cover local sorting, host-owned order, range selection, keyboard resizing, dark mode, narrow layouts, empty/disabled/read-only states, grouped headers, a different row schema with currency cells, customized/leading rows, a shared-primitive hook layout, and standalone checkbox selection. Story controls expose selection, resizing, disabled state and sorting ownership.

## Code quality

[Biome](https://biomejs.dev/) is pinned as a development dependency. It checks formatting, import organization and recommended lint rules for library code, examples, tests and configuration. Generated `dist` and build/test artifacts are excluded; the compiler owns their formatting.

```sh
pnpm lint   # read-only CI checks; warnings fail the command
pnpm format # apply formatting, import organization and safe lint fixes
```

`pnpm check` starts with `pnpm lint`, so the existing verification and release workflows enforce the same rules. Keep suppressions local and explain the behavior they protect. The keyboard scroll region, interactive resize separator, drag CSS overrides and gesture-cancellation effect have documented exceptions. Only the browser regression harness permits `any` and non-null assertions for injected browser globals and asserted DOM fixtures; library code retains those checks.

## Verification

```sh
pnpm check
```

Checks include TypeScript, independent controller ownership/cancellation/persistence tests, preference/schema unit tests, library/demo/Storybook builds, and Chromium regression tests. The browser suite exercises 512 repeated pointer drags, width limits, reset/cancellation/persistence, selection, unmount/disabled recovery, standalone-control removal and grouped-header resizing, all 267 demo rows across six pages, six light/dark accessibility layouts, all eighteen Storybook stories, and tarball installation with typed imports, server rendering and CSS exports in fresh React 19.3.0 consumers. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a system Chromium path, or install a browser with `pnpm exec playwright install chromium`.

GitHub Actions runs the same checks and uploads Storybook plus browser evidence as an artifact. Browser tests use fictional data and do not claim Safari, physical-device or latency coverage.

Dependabot opens weekly npm and GitHub Actions update PRs. Compatible npm minor/patch updates are grouped; major updates remain separate for review. The existing library, package-consumer and Storybook checks verify these PRs. No automated merge or npm publication is triggered by dependency updates.

## npm releases

The unscoped **`puppertino-table`** package is public on npm. Stable releases use the guarded GitHub Release workflow described in [RELEASING.md](https://github.com/kahwee/puppertino-table/blob/main/RELEASING.md), including verified package preparation and clean registry consumers.

```sh
pnpm check
npm publish test-results/package/puppertino-table-0.3.0.tgz --dry-run --ignore-scripts --access public
```

`pnpm check` builds and packs the library, checks the tarball file list, and installs it in isolated React 19.3.0 consumers. `prepack` rebuilds JavaScript and declarations so a locally packed release cannot silently use stale output. Only the compiled library, CSS, package metadata, README, changelog and MIT license ship; Storybook, the demo and tests stay out of the npm package.

The manually dispatched **Prepare npm package** GitHub Actions workflow performs these checks and uploads `npm-release-candidate`, containing the verified tarball and `pack.json`. It never publishes to npm. See [RELEASING.md](https://github.com/kahwee/puppertino-table/blob/main/RELEASING.md) for the final publishing steps.

## License

MIT. Puppertino, React and TanStack Table remain independently maintained projects under their own licenses.

## Dependency maintenance

Dependabot checks npm dependencies and GitHub Actions every Monday at 08:00 America/Los_Angeles. It groups compatible npm patch/minor updates and proposes major changes separately. React and React DOM, including their type packages, stay on the supported React 19 line; versions 20 and later are excluded.

Dependency updates must pass verification on the current PR head before merging. Review major migrations separately. Releases remain explicitly authorized actions; dependency maintenance does not publish npm versions or alter trusted-publisher settings.
