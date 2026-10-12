# Puppertino Table

A generic React table styled with [Puppertino](https://puppertino.com/) and powered by [TanStack Table](https://tanstack.com/table). Bring your own data, columns and cell renderers.

- Typed column definitions for arbitrary row shapes, including grouped headers.
- Host-controlled sorting by default, with optional local sorting.
- Checkbox selection with Shift-click ranges and keyboard toggling.
- Precise, bounded column resizing with optional browser-local persistence.
- Sizing subscriptions isolated from the memoized row body.
- Semantic tables, accessible resize separators and horizontal scrolling in narrow containers.
- Storybook **10.6.1** with interactive examples and accessibility checks.

## Install

The package includes built ESM and TypeScript declarations. The first npm release is pending; once published, install it with:

```sh
pnpm add @kahwee/puppertino-table@0.1.0 @tanstack/react-table@9.2.8 @codedgar/puppertino@2 react react-dom
```

React, TanStack Table and Puppertino are peer dependencies; the library does not bundle another copy of them. For Git-based installation, use `github:kahwee/puppertino-table` and pin a commit or tag for reproducibility.

## Use

```tsx
'use client';
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { PuppertinoTable, createPuppertinoColumnHelper } from '@kahwee/puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import '@kahwee/puppertino-table/style.css';

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

The example uses local sorting and uncontrolled checkbox selection. Pass both `rowSelection` and `onRowSelectionChange` for controlled selection. Controlled selection without a change callback is read-only. Keep column definitions and data references stable when possible.

### Sorting and pagination

`manualSorting` defaults to `true`: the table reports sort changes and renders rows in the order provided. Your caller can sort/filter/page locally or request data from any backend. The component makes no network calls, has no endpoint conventions, and does not treat a loaded page as the full dataset. Pagination controls belong to the caller. Use `manualSorting={false}` to let TanStack sort all supplied rows locally.

### Resizing

Drag a header's right edge. Double-click or Enter resets that column to its definition's initial size. Left/Right adjusts 16 pixels; Shift uses 40 pixels. Home/End reaches its limits, and Escape cancels an unfinished gesture. Pointer cancellation, losing window focus, unmounting, or disabling resizing also cancels.

`storageKey` enables persistence; without it no preferences are stored. Supply `storage` to use a compatible storage adapter. Malformed values, unknown column IDs and blocked browser storage fall back safely. Use stable column IDs or string accessor keys. Change the component's React `key` when switching schemas or persistence keys so initialization reads the new configuration.

`cancelMediaQuery` is optional: set it when your layout removes the table at a responsive breakpoint. A narrow table that remains visible can simply scroll horizontally.

### Custom layouts

Use `puppertinoTableFeatures`, `PuppertinoTableInstance`, `useColumnResize`, `ColumnResizeHandle`, and the sizing helpers with your own `useTable` instance. The features enable sorting, sizing and row selection. Subscribe to `table.atoms.columnSizing` around table geometry and keep the row body memoized. Optional hook settings let you choose persistence, a cancellation media query and a drag CSS class.

The package adds scoped `.pt-*` enhancements to Puppertino's `p-table` styles. Import Puppertino's CSS in your application, then the package stylesheet. Theme tokens remain owned by Puppertino and your application. Include Puppertino's dark-mode stylesheet when using its dark theme.

## Storybook and demo

GitHub Pages is configured to publish [Storybook 10](https://kahwee.github.io/puppertino-table/) from `storybook-static/` after the checks on main pass. The Pages artifact contains only Storybook and its examples. Pull requests run verification without deploying. For repository setup, select **Settings → Pages → Source → GitHub Actions**; the workflow also attempts to enable Pages automatically.

Use Node 20.19+ or 22.12+ and pnpm 11.25.0.

```sh
pnpm install
pnpm storybook       # http://localhost:6006
pnpm dev             # standalone 267-row fictional-data demo
pnpm build:storybook # static Storybook in storybook-static/
```

Stories cover local sorting, host-owned order, range selection, keyboard resizing, dark mode, narrow layouts, empty/disabled/read-only states, grouped headers, and a different row schema with currency cells. Story controls expose selection, resizing, disabled state and sorting ownership.

## Verification

```sh
pnpm check
```

Checks include TypeScript, preference/schema unit tests, library/demo/Storybook builds, and Chromium regression tests. The browser suite exercises 512 repeated pointer drags, width limits, reset/cancellation/persistence, selection, unmount/disabled recovery, all 267 demo rows across six pages, six light/dark accessibility layouts, and all eleven Storybook stories. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a system Chromium path, or install a browser with `pnpm exec playwright install chromium`.

GitHub Actions runs the same checks and uploads Storybook plus browser evidence as an artifact. Browser tests use fictional data and do not claim Safari, physical-device or latency coverage.

## License

MIT. Puppertino, React and TanStack Table remain independently maintained projects under their own licenses.
