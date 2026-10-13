# Puppertino Table

Composable Finder windows, toolbars, sidebars, previews, tags, tables and column browsers, built on [Puppertino](https://puppertino.com/) and [TanStack Table](https://tanstack.com/table). Bring your own data, icons and app actions.

[Storybook guide](https://kahwee.github.io/puppertino-table/?path=/docs/start-here-overview--docs) · [API guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) · [npm](https://www.npmjs.com/package/puppertino-table)

![Compact file table with sortable headers and bounded resize handles](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-light.png)

- Public Finder primitives with icon/content slots and controlled view, search and selection. [Compose a Finder](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md#compose-a-finder).
- Semantic tables, typed columns, local or server-owned sorting, and range selection.
- Pointer and keyboard resizing, width limits, reset, cancellation, completed-gesture callbacks, and optional browser width persistence.
- Independently resizable column-browser panels with native links and caller-rendered previews.
- Shared CSS density, documented styling hooks and dark themes, without a React provider.
- Right-click and keyboard menus with delegated workspace triggers, commands, links and disabled items.
- Fine-grained sizing subscriptions keep the memoized row body out of resize renders.

## Install and use

```sh
pnpm add puppertino-table@0.9.0 @tanstack/react-table@9.2.8 @codedgar/puppertino@2 react@19.3.0 react-dom@19.3.0
```

```tsx
import { PuppertinoTable, createPuppertinoColumnHelper } from 'puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import 'puppertino-table/style.css';

const helper = createPuppertinoColumnHelper<{ id: string; name: string }>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 280, minSize: 160 }),
]);
const items = [{ id: 'brief', name: 'Project brief.pdf' }];

export function Files() {
  return <PuppertinoTable data={items} columns={columns}
    getRowId={item => item.id} getRowLabel={item => item.name}
    ariaLabel="Files" density="compact" selectable manualSorting={false} />;
}
```

React 19 (`^19.3.0`), TanStack Table and Puppertino are peer dependencies. Sorting defaults to caller-owned order; `manualSorting={false}` sorts the supplied data locally. See the [API guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) for controlled state, persistence, primitives, density, menus and server pagination.

## See the features

### Selection, density and dark mode

![File table with selected rows](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-selection.png)

![Comfortable density with more row spacing](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-comfortable.png)

![Dark file table](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-dark.png)

### Finder-style columns and previews

![Column browser with folders, files and an app-owned document preview](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/columns-preview.png)

[Try the column app](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--column-workspace). The library owns panel geometry and resize gestures; the app supplies navigation, selection and preview content.

![Dark column browser with selected file and preview](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/columns-dark.png)

### All four Finder views

![Icon view with file artwork](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/icons-light.png)

![Gallery view with a large preview and filmstrip](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/gallery-preview.png)

![Narrow column workspace with wrapping toolbar](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/columns-narrow.png)

[Explore the Finder walkthrough](https://kahwee.github.io/puppertino-table/?path=/docs/examples-finder--docs). Search, folder history, icon/gallery layouts and previews are app-owned; all four demos compose the shared components.

### Resize table columns and browser panels

![Screencast of pointer resizing, double-click reset and independent browser panel resizing](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/resizing.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/resizing.mp4). Keyboard separators support arrows, Shift-arrows, Home/End and Enter to reset; Escape cancels an unfinished drag.

### Right-click, close up

![Right-click menu in a 125 percent capture close-up](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/context-menu.png)

![Screencast of right-click Get Info and a keyboard-opened context menu](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/context-menu.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/context-menu.mp4). Right-click or Shift+F10 opens the menu. Arrows navigate enabled items; Escape closes it and restores focus. Get Info is an example app command.

### Drag and drop in a small app

![Screencast of moving a fictional file into Archive and opening the destination](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/drag-drop.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/drag-drop.mp4). This demo composes native HTML drag/drop with the table and browser items. Moves are in-memory and app-owned; the package does not implement file operations or a drag/drop engine. The Move menu command provides a keyboard alternative.

[Watch and try each feature in Storybook](https://kahwee.github.io/puppertino-table/?path=/docs/examples-finder--docs). All media records the working apps with fictional data in Chromium. The pointer and captions are recording overlays. [Demo source](https://github.com/kahwee/puppertino-table/blob/main/src/finder.stories.tsx).

## 0.8 API consistency

Checkboxes and row gestures share a fixed range anchor. Supply `selectionAnchor` when sharing selection across layouts. Each state slice has one typed owner: internal state, controlled value/callback, or an external atom. Standalone change callbacks observe internal state; atom owners subscribe to their atom. `PuppertinoTable.onColumnSizingCommit` and `ColumnBrowser.onWidthsCommit` receive completed resize snapshots only. See the [migration notes](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md#migrating-to-08).

## Develop

```sh
pnpm install
pnpm storybook       # interactive examples
pnpm check           # lint, types, unit/browser/hydration and packed-consumer checks
pnpm capture:readme  # regenerate curated screenshots and screencasts; needs Chromium + ffmpeg
```

GitHub Pages publishes Storybook after main passes verification. See [releasing](https://github.com/kahwee/puppertino-table/blob/main/RELEASING.md) for npm releases and [pointer profiling](https://github.com/kahwee/puppertino-table/blob/main/docs/pointer-performance.md) for measured resizing behavior. Media stays in the repository/Pages; it is not bundled into npm.

MIT. React, TanStack Table and Puppertino retain their respective licenses.

### Shared tag picker

`TagPicker` is independent of Finder and tables. It takes stable tag IDs and
controlled values; your application owns creation, persistence and bulk updates.

```tsx
import { useState } from 'react';
import { TagPicker, type TagOption } from 'puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/buttons';
import '@codedgar/puppertino/popovers';
import 'puppertino-table/style.css';

const options: TagOption[] = [
  { id: 'review', label: 'Review' },
  { id: 'work', label: 'Work' },
];

function DocumentTags() {
  const [value, setValue] = useState<string[]>(['review']);
  return <TagPicker options={options} value={value} onValueChange={setValue} />;
}
```

Pass `mixedValue` for tags present on only some selected records. Choosing one
adds it to `value`; apply that addition to every selected record. Optional
`onCreate(label)` receives a trimmed name: add its option and assigned ID in your
application. Existing labels match without case sensitivity, preventing duplicate
creation suggestions. IDs must be unique; unknown assigned IDs remain visible.

Use `trigger` for your own icon and `triggerClassName` for a Puppertino toolbar
button. The library has no icon dependency. Finder uses Lucide at 20px with a
1.5-unit stroke; these are web approximations of macOS symbols.

Arrow keys navigate suggestions; Enter assigns or creates. Backspace in an empty
field focuses the last token before a second Backspace removes it. Escape closes
and returns focus. Disabled options cannot be assigned or removed. The native
Popover API keeps the panel above clipping containers; current browsers supporting
that API are required. Puppertino supplies its material, arrow, shadow and theme.
