# API and integration guide

[Install and visual overview](../README.md) · [Live examples](https://kahwee.github.io/puppertino-table/)

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

For simpler tables, omit `sorting` and `onSortingChange` to let the library own sort state and sort the supplied rows automatically. `initialSorting` and `initialRowSelection` seed uncontrolled state on mount. You can provide change callbacks as notifications while leaving state uncontrolled. If you provide controlled `sorting` or `rowSelection` without its matching callback, that state is read-only. Do not switch between controlled and uncontrolled ownership while a table is mounted.

The example uses local sorting and uncontrolled checkbox selection. Pass both `rowSelection` and `onRowSelectionChange` for controlled selection. Controlled selection without a change callback is read-only. Set `selectionCheckboxes={false}` to hide the selection column while retaining selection capability and caller-provided row gestures. By default, with `selectable`, the header checkbox selects or clears the current row model, preserving selected IDs from other server pages or filtered-out rows. It shows a mixed state for partial selection and is disabled when no rows can be selected. Space toggles it from the keyboard. Keep column definitions and data references stable when possible.

### Sorting and pagination

`manualSorting` defaults to `false`: TanStack sorts the supplied rows automatically. Set `manualSorting={true}` for server-paginated data or app-owned ordering; sort callbacks still fire, but the table renders the supplied page unchanged. Your caller can sort/filter/page locally or request data from any backend. The component makes no network calls, has no endpoint conventions, and does not treat a loaded page as the full dataset. Pagination controls belong to the caller. Controlled sorting state does not imply server sorting: choose `manualSorting` explicitly when the app or server owns order.

### Date columns

Keep `Date` objects in the accessor value and format only the cell. The registered TanStack datetime sorter compares timestamps, so month names, time-of-day strings and the user's locale cannot change the order. In TanStack v9 the column option is `sortFn`:

```tsx
const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles',
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
});
// Item.added is a Date; normalize ISO strings from an API when loading your data.
helper.accessor('added', {
  header: 'Date Added', size: 280, minSize: 240,
  sortFn: 'datetime', sortDescFirst: true,
  cell: cell => {
    const date = cell.getValue();
    return <time dateTime={date.toISOString()}>
      {dateFormat.format(date)} at {timeFormat.format(date)}
    </time>;
  },
});
```

This renders `Oct 10, 2026 at 4:40 PM` for the corresponding timestamp. Applications choose their locale/time zone; keep that choice consistent between server rendering and hydration. Validate missing or invalid timestamps in the app before creating `Date` values. Automatic sorting also detects valid Date values when `sortFn` is omitted. The table registers TanStack's standard text, natural-text, basic and datetime sorting functions; custom `sortFn` functions remain supported.

Missing timestamps can normalize to `null` in the app. API timestamps should include `Z` or an explicit UTC offset; reject timezone-less strings rather than silently interpreting them in the browser's local zone. An accessor returning `undefined` for those values, with `sortUndefined: 'last'`, keeps them last in both sort directions. Give accessor-function columns an explicit `id`. Render an em dash with accessible “No date added” text instead of calling `toISOString()` on an absent or invalid date. The Date Columns story includes invalid imports, timezone choices and the repeated daylight-saving hour; ISO timestamps in `<time dateTime>` preserve the actual instant.

### Loading and request errors

Pass `status="ready" | "loading" | "error"` to `PuppertinoTable` or `TableBody`. Ready is the default. `loadingContent` defaults to “Loading rows…” and `errorContent` to “Could not load rows.” `emptyContent` appears only after a ready request with no rows. Existing rows remain visible during refreshes and errors; the app decides when to replace or clear them.

```tsx
<PuppertinoTable {...tableProps} status={request.status}
  loadingContent="Loading files…"
  errorContent={<><span>Could not load files.</span><button onClick={retry}>Try again</button></>}
  emptyContent="No files match this view." />
```

The complete table exposes `aria-busy` during loading. Both complete and custom bodies render semantic status/error messages with the correct column span. Retry buttons, request state, network calls, cancellation and error details remain application-owned. The spinner respects reduced-motion preferences.

### Controlled column sizing

Pass `columnSizing` and `onColumnSizingChange` to either `PuppertinoTable` or `usePuppertinoTable`:

```tsx
const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({ name: 240 });
// Import ColumnSizingState from @tanstack/react-table.
<PuppertinoTable
  data={items} columns={columns} getRowId={(row) => row.id} ariaLabel="Items"
  columnSizing={columnSizing} onColumnSizingChange={setColumnSizing}
/>;
```

The callback receives a value or functional updater, like a React state setter. Supplying widths without a callback makes sizing read-only. Omit `columnSizing` for TanStack-owned sizing and its fine-grained geometry subscription; a standalone `onColumnSizingChange` observes changes, just like sorting and selection callbacks. Controlled widths ignore saved preferences: the app owns restoration and persistence, so omit `storageKey` from controlled resize handles. Uncontrolled sorting and selection also stay in TanStack’s internal atoms; callbacks can observe their changes without owning the state. React-controlled sizing rerenders its state owner; for high-frequency custom layouts, TanStack v9 also supports external atoms through `useTable`.

### Shared custom-layout behavior

Configure `selectable`, `selectionCheckboxes`, `disabled` and `resizable` once in `usePuppertinoTable`. `TableHeader`, `TableBody` and standalone resize handles inherit that policy. With `selectable: true`, omitted primitive selection props render the selection column; use `selectionCheckboxes: false` for a row-only layout. Read-only selection keeps its checkboxes visible but disabled. Read-only controlled widths omit resize handles, including in custom layouts.

Primitive `selectable` overrides remain available for specialized layouts; keep header/body visibility and your `colgroup` aligned. Primitive `disabled: true` and `resizable: false` can further restrict controls; they cannot enable resizing or bypass a disabled hook. The body resolves policy before its memoized cells, so disabled/visibility changes reach the body while column sizing remains separately subscribed.

### External atom ownership

For shared app-owned state with fine-grained subscriptions, pass `atoms` to the complete table or hook. Install `@tanstack/react-store@0.11.2` in the app to create and subscribe to the atoms:

```tsx
import { useCreateAtom, useSelector } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';

function ItemsTable() {
  const columnSizing = useCreateAtom<ColumnSizingState>({ name: 240 });
  const sorting = useCreateAtom<SortingState>([]);
  const rowSelection = useCreateAtom<RowSelectionState>({});
  return <PuppertinoTable data={items} columns={columns} getRowId={(row) => row.id}
    ariaLabel="Items" selectable atoms={{ columnSizing, sorting, rowSelection }} />;
}
```

`PuppertinoTableAtoms` is exported for typed custom integrations. A state slice has one owner: TypeScript rejects an atom together with that slice's value or callback, and JavaScript callers receive a clear runtime error. Different slices may use different ownership modes. Atom bindings must stay identical for the lifetime of the table, as required by the installed v9 adapter; changing bindings requires remounting with a new React `key`. You may recreate the map when it contains the same atom instances. Initial sorting/selection values apply only to internally owned slices; initialize app atoms yourself. Atom-owned sizing bypasses automatic preference restoration, and the complete component also disables automatic saving. In primitive layouts, omit `storageKey` from resize options when the app owns sizing restoration and saving. Read with `atom.get()` for a snapshot, or use `useSelector(atom)` in the smallest component that needs reactive state. No callback is needed for atom-owned slices. Width changes retain the existing geometry subscription rather than rerendering the table's row body.

### Shared density

Complete tables accept `density="native" | "compact" | "comfortable"`. Omitting density inherits the nearest CSS scope. Outside a preset scope, tables retain native Puppertino geometry and column browsers use compact fallbacks. Explicit `native` resets metrics and opts tables out of an outer preset. Compact uses 24px minimum rows, 3px block padding, 8px inline padding and 16px icons. Comfortable uses 36px rows, 8px block padding, 12px inline padding and 20px icons. Content can make a row taller; text and icons are never clipped to force a height.

Use `DensityScope` around layouts built with the table primitives, or pass `densityMetrics` to `PuppertinoTable` and `ColumnBrowser` for explicit overrides. Metrics are CSS pixels: `rowHeight`, `rowPaddingBlock`, `rowPaddingInline` and `iconSize`. `DensityScope` calls the same object `metrics`. Heights and icon sizes must be positive; padding may be zero. Styles stay scoped to each wrapper, so adjacent components can use different densities. Put caller-owned artwork in a `.pt-icon` span to share sizing; the library does not replace your icons.

```tsx
<PuppertinoTable {...tableProps} density="compact" densityMetrics={{ iconSize: 18 }} />
<DensityScope density="comfortable" metrics={{ rowPaddingInline: 16 }}>
  <MyCustomLayout />
</DensityScope>
```

The corresponding CSS properties are `--pt-row-height`, `--pt-row-padding-block`, `--pt-row-padding-inline` and `--pt-icon-size`. Explicit metrics are applied on the scope; ordinary host CSS can customize them. Native density leaves default table header/cell styling intact unless metrics are explicitly supplied. Density changes layout only, not sorting, selection or saved widths.

Density is a library term implemented with standard CSS custom properties, not a CSS `density` property or React provider/context. One parent scope applies to nested tables, browsers and transparent scopes:

```tsx
<DensityScope density="comfortable">
  <PuppertinoTable data={items} columns={columns} getRowId={item => item.id} ariaLabel="Items" />
  <ColumnBrowser panels={panels} ariaLabel="Projects" />
  <DensityScope metrics={{ iconSize: 22 }}><PuppertinoTable data={items} columns={columns} getRowId={item => item.id} ariaLabel="Larger icons" /></DensityScope>
  <PuppertinoTable density="native" data={items} columns={columns} getRowId={item => item.id} ariaLabel="Native override" />
</DensityScope>
```

Explicit presets start a new scope; partial metrics override only the specified variables. Scoped table rules use standard CSS `@scope` to stop at nested explicit presets, preserving native spacing. This requires browsers supporting `@scope` (Chrome/Edge 118+, Safari 17.4+, Firefox 146+). Browser/item metrics inherit normally through custom properties; the standalone table and browser defaults remain native and compact respectively.

### Column-browser component

`ColumnBrowser` renders caller-owned panels in order; the last is the current panel. Ancestors scroll vertically on their own. The surface scrolls horizontally and reveals the current panel beside whole ancestors after navigation, resizing or container changes. Each ancestor can be resized independently with a pointer or the keyboard, using the same cancel/reset lifecycle as table columns. The current panel fills spare room and fits containers narrower than its preferred minimum.

```tsx
import { ColumnBrowser, ColumnBrowserItem } from 'puppertino-table';

<ColumnBrowser ariaLabel="Projects" density="compact" panels={[
  { id: 'workspace', label: 'Workspace', content:
    <ColumnBrowserItem pathSelected onClick={showProjects}>Projects</ColumnBrowserItem> },
  { id: 'projects', label: 'Projects', width: 260, minWidth: 160, maxWidth: 600,
    content: projectButtons },
  { id: 'current', label: 'Selected project', content: resourceButtons },
]} />
```

Panels require unique stable `id`, an accessible `label` for their region, and caller-rendered `content`. Ancestors default to 224px, bounded to 120–640px. `minimumCurrentWidth` defaults to 288px. Give the component or its parent a bounded height; it fills that height. Standalone browser items use compact fallback metrics; omitted density inherits an enclosing scope. Optional `widths` and `onWidthsChange` provide controlled ancestor sizing. Widths without a callback are read-only and omit resize handles. `resizable={false}` or `resizeDisabled` cancels active gestures; `cancelMediaQuery` can cancel when a responsive layout removes the controls. Panel removal and changed bounds also cancel. Uncontrolled widths remain local unless you supply a `storageKey` for automatic persistence. Controlled widths keep restoration and saving app-owned. Change callbacks include previews and cancellations. The `onWidthsCommit` callback supplies a copied snapshot after completed pointer, keyboard and reset operations only; use it to save app-owned preferences. Custom table headers offer `resizeOptions.onCommit`, and individual handles offer `options.onCommit`. `PuppertinoTable` exposes `onColumnSizingCommit` with the same completion-only snapshot contract and saves internal widths through `storageKey`. Storage failure does not suppress either callback.

`ColumnBrowserItem` defaults to a native button with `icon`, `trailing`, `selected` and `pathSelected` slots/states. It shares density metrics, ellipsis, hover and keyboard-focus styling. Selection and path indication are separate. Standard button props provide actions, labels, disabled state and context-menu triggers. The browser does not fetch records, enter folders, select items or open documents. Compose your navigation, `useRowSelectionGestures`, and custom content around it. Its geometry is measured only after hydration; initial server markup uses deterministic panel widths.

### Browser width persistence

Uncontrolled `ColumnBrowser` accepts `storageKey` and an optional `storage` adapter with `getItem`/`setItem`. Restoration occurs after hydration; visible widths are clamped to each panel's bounds. Only completed pointer, keyboard and reset operations save. Escape, panel removal, changed bounds, storage-key/adapter changes and responsive cancellation discard previews. Storage failures preserve browsing and completion callbacks. Controlled `widths` ignore automatic restoration and saving: the caller remains the sole owner.

```tsx
<ColumnBrowser panels={panels} ariaLabel="Projects"
  storageKey="my-app.browser.widths.v1" />
```

The cache keeps up to 100 recently committed panel IDs, including temporarily hidden ancestors. IDs must be nonempty and at most 1024 characters; saved values must be positive finite numbers. Unknown cached IDs do not create panels. Changing the key selects a separate preference namespace; no preferences are written during restoration. To reset saved preferences, remove the key and remount the browser.

### Keyboard item navigation

`useItemNavigation` supplies a single Tab stop plus arrow/Home/End movement for native rows, buttons and links. Pass the visible item order and a function returning each item's DOM element. `orientation` is `vertical`, `horizontal` or `grid`; grid `columns` can be a number or a function measuring the responsive layout when a key is pressed. Arrow movement stops at edges, and `getItemLabel` enables filename-prefix matching. `isItemDisabled` excludes unavailable items. Focus stays independent of selection.

```tsx
const { select } = useRowSelectionGestures(table);
const navigation = useItemNavigation({
  orderedIds: items.map(item => item.id),
  getItemElement: id => elements.current.get(id),
  getItemLabel: id => items.find(item => item.id === id)?.name ?? '',
  onNavigate: select,
});
<button {...navigation.getItemProps(item.id)}
  ref={element => { if (element) elements.current.set(item.id, element); else elements.current.delete(item.id); }}
  onClick={event => select(item.id, { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey })}>
  {item.name}
</button>
```

`elements` is an app-owned `useRef(new Map<string, HTMLButtonElement>())`. Connect `onNavigate` to selection for Finder-style plain-arrow and Shift-arrow ranges; omit it for focus-only navigation. Typeahead, Shift modifiers and nested editable controls are handled separately from activation. The hook leaves Enter, Space and Command/Ctrl/Alt shortcuts to native controls or the app. When combining menu and navigation props, compose the key handlers and respect `event.defaultPrevented` rather than replacing one with the other. `nextItemId` is also exported for custom focus adapters.

### Right-click and keyboard context menus

`useContextMenu<T>()` supplies `state`, `open(context, event)`, `close()` and `getTriggerProps(context)`. The trigger props open on right-click, Shift+F10 or the Context Menu key and advertise a menu popup. They are opt-in: items without them keep the browser's native context menu. If you already handle key events, compose that handler with the returned `onKeyDown` instead of overwriting either one.

```tsx
const menu = useContextMenu<string>();
<ColumnBrowserItem {...menu.getTriggerProps(item.id)}>{item.name}</ColumnBrowserItem>
<ContextMenu ariaLabel="Item commands" position={menu.state?.position ?? null}
  returnFocus={menu.state?.returnFocus} onClose={menu.close}
  actions={menu.state ? commandsFor(menu.state.context) : []} />
```

For tables, spread trigger props in `getRowProps` and make the target keyboard-focusable, or attach them to a button inside a cell. `ContextMenu` accepts command actions with stable `id`, `label`, optional `disabled`, and `onSelect`. It fits the viewport, focuses the first enabled action, supports arrows/Home/End, skips disabled actions, closes on Escape/Tab/outside pointer/scroll/resize/blur, and restores the invoking target's focus. It uses a manual popover where supported so a table or panel's overflow does not clip it. Place it in the same themed DOM subtree as its trigger. Commands, right-click selection policy and authorization remain caller-owned; the component never invents file operations.

### Delegated context-menu triggers

One menu can serve a whole workspace, including dynamically rendered items:

```tsx
const menu = useContextMenu<string>();
<div {...menu.getDelegatedTriggerProps({
  resolveContext: (target, root) => {
    const item = target.closest<HTMLElement>('[data-item-id]');
    const id = item?.dataset.itemId;
    return item && root.contains(item) && items.some(item => item.id === id) ? id : undefined;
  },
})}>
  {items.map(item => <ColumnBrowserItem key={item.id} data-item-id={item.id}
    aria-haspopup="menu">{item.name}</ColumnBrowserItem>)}
</div>
```

`resolveContext(target, root)` owns matching and current-item validation. Return `null`/`undefined` for native-menu targets, editable fields or unknown items. Resolved false/zero/empty-string contexts are valid. The returned capture handlers open on right-click, Shift+F10 and the Context Menu key, respect already-prevented events, and preserve the nearest invoking control as the return-focus target. Keep per-item popup semantics (`aria-haspopup="menu"`) and keyboard focusability. Use the same `ContextMenu` rendering as individual triggers. Compose existing capture handlers instead of replacing either one; commands and selection policy remain caller-owned.

### Browser links and richer menus

```tsx
<ColumnBrowserItem href="/projects/alpine" pathSelected icon={<FolderIcon />}>
  Alpine
</ColumnBrowserItem>
```

Supplying `href` renders a native anchor: `target`, `rel`, `download`, modifier-click and browser link menus remain available. Omit `href` for a button. Button items use `aria-pressed`; links use `aria-current` for selected/path states. A disabled link omits `href`, exposes `aria-disabled`, and prevents activation. Link and button prop types are exported separately.

```tsx
<ContextMenu position={menu.state?.position ?? null} onClose={menu.close}
  returnFocus={menu.state?.returnFocus} ariaLabel="Resource commands" actions={[
    { id: 'info', label: 'Show details', icon: <InfoIcon />, shortcut: '⌘I', onSelect: showDetails },
    { id: 'group', type: 'separator' },
    { id: 'open', label: 'Open resource', href: resourceUrl, target: '_blank', rel: 'noopener noreferrer' },
  ]} />
```

`ContextMenuItem` is a union of `ContextMenuAction` commands, `ContextMenuLink` links and `ContextMenuSeparator` entries. Commands require `onSelect`; links require `href` and may also observe activation with `onSelect`. Separators accept only `id` and `type`. Link attributes such as `target` and `download` belong to links. `ContextMenuState<T>` describes the open context, position and return-focus target; `menu.state` is `null` when closed. Arrows/Home/End skip separators and disabled entries. Links activate with Enter or Space and retain native modifier-click/target/download behavior. Icons and shortcut hints are decorative; shortcut bindings stay caller-owned.

### Stable item styling hooks

Scope standard CSS custom properties on the browser or an enclosing density scope. No provider, global theme registration or custom CSS density property is needed.

| Property | Default / purpose |
| --- | --- |
| `--pt-item-gap` | `6px`, icon/label/trailing spacing |
| `--pt-item-radius` | `4px`, item corners |
| `--pt-item-line-height` | `18px`, text line height |
| `--pt-item-text` | Inherited text color |
| `--pt-item-hover-bg` | Puppertino hover token |
| `--pt-item-path-bg` | Puppertino hover token, inactive hierarchy path |
| `--pt-item-selection-bg`, `--pt-item-selection-text` | Puppertino selection tokens |
| `--pt-focus-color` | Puppertino control accent; selected items use selection text |
| `--pt-divider-color` | Puppertino table divider |
| `--pt-panel-padding` | `4px`, panel content inset |
| `--pt-icon-color` | Inherited artwork color; selected item icons inherit selection text |
| `--pt-secondary-text` | Puppertino secondary/dim text; selected items inherit selection text |

The public presentation classes are `.pt-browser-item`, `.pt-item-label`, `.pt-icon`, `.pt-item-trailing`, `.pt-item-secondary`, `.pt-path-selected` and `.p-selected`. Use `.pt-item-secondary` for caller-rendered metadata. Icon/trailing slots size nested SVG or image artwork as well as direct children. State classes describe presentation, not authorization or navigation. Keep document badges, thumbnails and domain-specific metadata in the app.

```css
.my-browser {
  --pt-divider-color: var(--app-separator);
  --pt-icon-color: var(--app-accent);
  --pt-secondary-text: var(--app-secondary);
  --pt-item-gap: 8px;
}
```

### Anchored item selection in custom layouts

`useRowSelectionGestures(table, options)` adds opt-in desktop item selection to a custom list, card grid or table. A normal click replaces the selection, Command/Ctrl-click toggles one item, and Shift-click extends or shrinks a range from its original anchor. Shift with a toggle modifier adds a range. Checkboxes share this range anchor and Shift policy; an unmodified checkbox click toggles its item instead of replacing the selection.

```tsx
import { useRef } from 'react';
import { usePuppertinoTable, useRowSelectionGestures } from 'puppertino-table';

function ItemList() {
  const table = usePuppertinoTable({ data: items, columns, getRowId: item => item.id, selectable: true });
  const anchor = useRef<string | null>(null);
  const { select, clearSelection } = useRowSelectionGestures(table, { anchor });
  return (
    <table.Subscribe source={table.atoms.rowSelection}>
      {selected => <>
        {table.getRowModel().rows.map(row => <button
          key={row.id} type="button" aria-pressed={!!selected[row.id]}
          disabled={!row.getCanSelect()}
          onClick={event => select(row.id, { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey })}
        >{row.original.name}</button>)}
        <button type="button" onClick={clearSelection}>Clear selection</button>
      </>}
    </table.Subscribe>
  );
}
```

The hook works with uncontrolled state, React-controlled state and external selection atoms. Disabled or read-only tables reject gestures without moving the anchor; `options.disabled` also disables just this hook. Nonselectable rows are excluded from ranges. `select` accepts an item ID and `{ shift?, toggle? }`, rather than a DOM event. Call it from native button activation or your own keyboard controller; the hook does not install keyboard listeners, move focus, open items or choose ARIA roles.

`options.orderedIds` supplies a caller-owned visible order, including leading items outside the table row model. The default is the current rendered row order. Extra IDs are supported with boolean row-selection eligibility; a table's row predicate cannot authorize an item outside its data model. The caller still owns rendering and selected-state announcements. Share `options.anchor` between layouts to retain the original range anchor. `clearSelection()` clears selection and anchor; `resetAnchor()` only clears the anchor, useful when replacing a collection or changing its order. Without an external ref, all hooks and checkboxes using the same selection atom share an anchor that survives React wrapper rerenders. Pass the same ref as `selectionAnchor` to `PuppertinoTable`/`usePuppertinoTable` and as `options.anchor` to gestures in other layouts. Reset it when replacing a collection.

`applySelectionGesture(orderedIds, selection, anchor, id, modifiers)` exports the same pure reducer without React. It returns `{ selection, anchor }`, never mutates caller inputs and ignores unknown target IDs. A stale anchor becomes the clicked item. Toggle gestures preserve selected IDs outside the supplied order; replacing gestures clear them. Only the caller-supplied IDs participate in a range; the package never assumes a loaded page is the entire dataset. Selection does not authorize application actions.

### Whole-column browser geometry

`fitColumnBrowser({ availableWidth, ancestorWidth, ancestorCount, minimumCurrentWidth })` is a pure helper for a caller-rendered hierarchical column browser. It returns `{ currentWidth, scrollLeft, visibleAncestors }`. Use the current width for the final panel and the scroll offset to reveal that panel beside whole ancestors, avoiding a cut-off filename at the left edge after resizing.

```ts
import { fitColumnBrowser } from 'puppertino-table';

const layout = fitColumnBrowser({
  availableWidth: 724,
  ancestorWidth: 224,
  ancestorCount: 3,
  minimumCurrentWidth: 288,
});
// { currentWidth: 500, scrollLeft: 448, visibleAncestors: 1 }
```

Widths are outer panel widths in CSS pixels; use border-box panels and measure the available scroll surface. The final panel takes spare room and fits surfaces narrower than its preferred minimum. A root with no ancestors takes the entire width. Dimensions must be finite and nonnegative, the ancestor width positive, and the count an integer; invalid inputs throw `RangeError`. The helper remains available for manual layouts. `ColumnBrowser` owns resize observation and scrolling for caller-rendered panels; hierarchy, loading and data access remain app-owned.

### Resizing

Drag a header's right edge. Double-click or Enter resets that column to its definition's initial size. Left/Right adjusts 16 pixels; Shift uses 40 pixels. Home/End reaches its limits, and Escape cancels an unfinished gesture. Pointer cancellation, losing window focus, unmounting, or disabling resizing also cancels.

`storageKey` enables persistence; without it no preferences are stored. Supply `storage` to use a compatible storage adapter. Malformed values, unknown column IDs and blocked browser storage fall back safely. Use stable column IDs or string accessor keys. Saved widths restore after mounting so the server and first browser render match. Changing `storageKey`, `storage` or the column schema reloads preferences without remounting; missing or invalid preferences reset to column defaults. Restoration does not write storage.

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
        <TableHeader table={table} resizeOptions={{ storageKey }} />
        <TableBody table={table} getRowLabel={item => item.name}
          leadingRows={(_table, context) => <tr><td colSpan={context.columnCount}>Folder</td></tr>} />
      </table>
    )}</table.Subscribe>
  </div>;
}
```

Pass matching `selectable` values to the hook, header and body; include a 36-pixel selection `<col>` when it is enabled. Pass `disabled` to all three to disable selection, sorting controls and resizing consistently. Keep the geometry subscription around the table; `TableBody` is already memoized separately. It supplies the empty-state row and accepts the same `getRowProps`, `getCellProps`, `leadingRows` and `getRowLabel` options as the complete component.

For a fully custom header or body, use `ColumnResizeHandle` and `RowSelectionCheckbox` individually. The checkbox handles Shift ranges, keyboard toggling and event isolation from row clicks. Give it `row`, an optional row-description `label`, and `disabled` when appropriate. Keep your `<thead>`/`<tbody>` and `<th>`/`<td>` markup semantic and supply accessible sort state.

### Defaults and ownership at a glance

| Option | Default or omitted behavior |
| --- | --- |
| `manualSorting` | Defaults to `false`: sort supplied rows automatically; `true` preserves server/app-owned order |
| `selectable` | `false`: no selection column or selection gestures |
| `disabled` | `false`; the complete table disables sorting, selection and resizing UI |
| `resizable` | `true`; controlled `columnSizing` without `onColumnSizingChange` is read-only. Atom-owned widths resize without a callback |
| `density` | Inherit the nearest scope; standalone tables use native spacing |
| `sorting` / `rowSelection` | Internal state; callbacks may observe changes |
| `columnSizing` | Internal widths; a sizing callback is used only with a controlled value |
| `atoms` | Optional app-owned state slices; cannot share a slice with its value/callback |
| `storageKey` | No persistence when omitted; automatic persistence applies to internal widths |

Keep each slice's owner stable while mounted. Initial sorting and selection seed internal state only; remount with a new React key to reinitialize. Table change callbacks accept values or functional updaters. Browser width callbacks receive snapshots, and completion callbacks exclude previews and cancellation.

### Public type contracts

Import public contracts from the package root with `import type`. Component implementation paths are internal and are not package exports:

```tsx
import type {
  PuppertinoTableOptions, PuppertinoTableProps,
  PuppertinoRow, PuppertinoCell, PuppertinoBodyContext,
  PuppertinoRowProps, PuppertinoCellProps,
  TableHeaderProps, TableBodyProps, RowSelectionCheckboxProps,
  ColumnResizeOptions, ColumnResizeHandleProps,
} from 'puppertino-table';
```

The controller's gesture engine, browser effects and persistence are internal modules. `useColumnResize` manages React lifecycle and adapts events; it returns `handle(columnId)` for wiring a custom resize target.

The hook initializes sizing but does not install resize listeners; `TableHeader` installs them through its shared resize handles. `ColumnResizeHandle` infers its accessible label from a string header or column ID; pass `label` for a custom or translated name. Its props type is exported as `ColumnResizeHandleProps`. `ColumnResizeHandle` and `useColumnResize` automatically share a controller keyed by the table's sizing store, with one pair of global keydown/blur listeners and one active gesture. The initiating handle's options govern that gesture; pass consistent storage and responsive settings to all handles. Removing the active handle, disabling it or changing its resize settings cancels its preview. Removing other handles leaves the gesture running. Cancellation restores only the dragged column, preserving concurrent changes to other widths. Separate tables remain independent. Pass `options={{ enabled: false }}` to hide a primitive handle when your layout is disabled; the hook's `disabled` controls selection, while primitive UI controls remain yours to disable.

The checkbox and resize primitives subscribe internally to their selection and sizing atoms, so they update even when wrapped in `React.memo` with stable row/header props. This follows the [v9 React Compiler guide](https://tanstack.com/table/latest/docs/framework/react/guide/react-compiler); the regression suite tests this with memoized primitives.

For more specialized state wiring, `puppertinoTableFeatures`, `PuppertinoTableInstance`, sizing helpers and TanStack `useTable` remain available. In custom layouts, use `TableBody` or memoize your custom row body separately from the `columnSizing` subscription to avoid rerendering cells during drags.

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

### Migrating to 0.8

- Atom-owned slices now reject simultaneous value/change-callback props at compile time as well as at runtime. Different slices can still use different owners. For dynamic ownership, construct one complete branch (`atoms` or value/callback), rather than spreading unrelated conditional objects. Keep atom bindings stable while mounted.
- Checkbox Shift ranges now extend and shrink from the same fixed anchor as row gestures. A plain checkbox click toggles; Shift replaces the range; Command/Ctrl+Shift adds a range. Header select-all remains scoped to visible rows and preserves other-page selection.
- A standalone `onColumnSizingChange` now observes internally owned width changes. Remove it if you previously supplied an unused callback. Table change callbacks accept values or functional updaters; browser width changes and all commit callbacks receive snapshots.
- Use `onColumnSizingCommit` on complete tables for persistence or analytics after a completed gesture. It works with internal, controlled and atom-owned widths. Previews, Escape, pointer cancellation and unmount never commit.

## Compose a Finder

Finder is a set of public components, not a file-management service. Import every
piece from `puppertino-table`; the complete Finder demo uses the same exports.
Your application owns files, navigation history, selection, permissions, tags,
previews, drag/drop and mutation callbacks.

Import Puppertino's stylesheet before the library stylesheet. For a smaller
stylesheet, use its individual colors, typography, buttons, forms, windows,
toolbars, sidebars, popovers, lists and dark-mode exports instead.

```tsx
import '@codedgar/puppertino';
import 'puppertino-table/style.css';
```

| Area | Public pieces | State and content |
| --- | --- | --- |
| Window | `FinderWindow`, `FinderBody`, `FinderContent` | Native attributes, children and refs. Body accepts the shared density props. |
| Toolbar | `FinderToolbar`, `FinderToolbarGroup`, `FinderToolbarButton`, `FinderTitle` | Compose children in your desired order. Title supports h1–h3. |
| Window controls | `FinderWindowControls` | Optional close/minimize/zoom callbacks; decorative without handlers. Pass custom controls through `FinderToolbar.windowControls`. |
| Navigation | `FinderHistory`, `FinderViewSwitcher`, `FinderSearch` | History callbacks are optional; missing ones disable their buttons. View and search use `value`/`onValueChange`. Supply icons as React nodes. `FinderSearch.icon` belongs to its collapsed button; the expanded field uses Puppertino’s search glyph, capsule and focus styling. |
| Commands | `FinderActions`, `ContextMenu` | Both accept the same typed `actions` entries. Your callbacks perform operations; the components handle menu interaction. |
| Sidebar | `FinderSidebar`, `FinderSidebarGroup`, `FinderSidebarItem` | Group labels, item icons, controlled `selected` and native button handlers. |
| Icons | `FinderIconGrid`, `FinderIconItem` | Supply artwork, label children, optional description and controlled `selected`. |
| Gallery | `FinderGallery`, `FinderFilmstrip`, `FinderGalleryItem` | Supply preview and thumbnail children; selection remains controlled. |
| Preview and inspector | `FinderPreview`, `FinderDetails`, `FinderEmptyState` | Preview artwork/heading/description slots and arbitrary metadata children; no required file schema. |
| Location and status | `FinderPathBar`, `FinderStatusBar` | Compose router links, separators, counts and live announcements as children. |
| Tags | `TagPicker` | Controlled tag IDs, mixed selections and application-owned creation. |
| List and columns | `PuppertinoTable`, `ColumnBrowser`, `ColumnBrowserItem` | Existing table/browser contracts; share your selection state between views. |

```tsx
import { useState } from 'react';
import { FileTextIcon, FolderIcon } from '@phosphor-icons/react'; // Optional; any React icon works.
import {
  FinderWindow, FinderToolbar, FinderTitle, FinderBody, FinderSidebar,
  FinderSidebarGroup, FinderSidebarItem, FinderContent, FinderIconGrid,
  FinderIconItem, FinderPathBar, FinderStatusBar,
} from 'puppertino-table';

export function Documents() {
  const [selected, setSelected] = useState(false);
  return (
    <FinderWindow aria-label="Documents">
      <FinderToolbar><FinderTitle>Documents</FinderTitle></FinderToolbar>
      <FinderBody density="comfortable" style={{ height: 420 }}>
        <FinderSidebar aria-label="Locations">
          <FinderSidebarGroup label="Favorites">
            <FinderSidebarItem selected icon={<FolderIcon weight="fill" aria-hidden="true" />}>
              Documents
            </FinderSidebarItem>
          </FinderSidebarGroup>
        </FinderSidebar>
        <FinderContent>
          <FinderIconGrid aria-label="Files">
            <FinderIconItem
              selected={selected}
              onClick={() => setSelected(!selected)}
              artwork={<FileTextIcon weight="duotone" aria-hidden="true" />}
              description="PDF document"
            >
              Brief.pdf
            </FinderIconItem>
          </FinderIconGrid>
        </FinderContent>
      </FinderBody>
      <FinderPathBar><span>Documents</span></FinderPathBar>
      <FinderStatusBar>{selected ? '1 of 1 selected' : '1 item'}</FinderStatusBar>
    </FinderWindow>
  );
}
```

The layout primitives forward native HTML attributes and React refs. Selection
components reserve their ARIA selection attribute and derive it from `selected`,
so there is one source of truth. Use `applySelectionGesture` and
`useRowSelectionGestures` when composing range selection across views. Keep the
same IDs and selection anchor when switching views.

Toolbar groups keep their full button hit areas and wrap when space is tight,
including when search expands. Icons are supplied by your application; the
examples use [Phosphor](https://phosphoricons.com/) in the weights recommended
by [Puppertino](https://puppertino.com/docs/icons/).

Constrain the window's width with its parent or native `style` prop; it creates
its own size-query container. Add `p-dark-mode` to the window or an ancestor for
dark mode. Customize `--finder-sidebar-width`, `--finder-radius`,
`--finder-sidebar`, `--finder-toolbar` and `--finder-line` through CSS; the
window, sidebar and bottom bars share those metrics. No private demo stylesheet,
icon package, fictional artwork or file reducer is required.

See [the live composition example](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-finder-composition--docs)
for controlled view/search args and all four views.
