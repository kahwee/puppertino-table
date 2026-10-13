# Puppertino Table

Build Finder-style React workspaces, accessible tables and resizable column browsers with [Puppertino](https://puppertino.com/) and [TanStack Table](https://tanstack.com/table). Compose the window, toolbar, sidebar, previews and menus around your own data and actions.

[Live Storybook](https://kahwee.github.io/puppertino-table/) · [Finder walkthrough](https://kahwee.github.io/puppertino-table/?path=/docs/examples-finder--docs) · [API guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) · [npm](https://www.npmjs.com/package/puppertino-table)

![Finder-style file table with Phosphor icons, a sidebar, view controls and a location bar](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-light.png)

## Choose your starting point

| Build | Use | Explore |
| --- | --- | --- |
| A complete table | `TableView` and typed column helpers | [Table stories](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-table--docs) |
| A hierarchy with lazy children | `OutlineView` with app-owned `loadChildren` | [Outline stories](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-outline-view--docs) |
| Resizable sidebar/content/detail panes | `SplitView` | [Split stories](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-split-view--docs) |
| A standalone navigation sidebar | `Sidebar`, `SidebarGroup`, `SidebarItem` | [Sidebar playground](https://kahwee.github.io/puppertino-table/?path=/story/puppertino-sidebar--default) |
| A Finder workspace | Window, toolbar, sidebar, views, preview and status primitives | [Composition recipes](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-finder-composition--docs) |
| A column browser | `ColumnView` with caller-rendered columns and items | [Browser stories](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-column-view--docs) |

Tables support local or server-owned sorting, shared range selection and bounded pointer/keyboard resizing. Browser panels resize independently. Density, dark themes, menus and optional width persistence work across the shared primitives. Fine-grained sizing subscriptions keep the memoized row body out of resize renders.

## Sidebar

Use the sidebar on its own or inside your own split view. Your app supplies selection and navigation.

![Standalone sidebar with grouped navigation, a selected section and trailing counts](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/sidebar-light.png)

```tsx
import { Sidebar, SidebarGroup, SidebarItem } from 'puppertino-table';

<Sidebar aria-label="Sections">
  <SidebarGroup label="Favorites">
    <SidebarItem selected={section === 'projects'} onClick={() => setSection('projects')}>
      Projects
    </SidebarItem>
    <SidebarItem href="/archive" detail={12}>Archive</SidebarItem>
  </SidebarGroup>
</Sidebar>
```

Import Puppertino's sidebar CSS and `puppertino-table/style.css`. Use `size="small"`, `"medium"`, `"large"` (default), or `"touch"`; icons, details, native props and refs are supported. Touch pointers receive larger row targets. `FinderSidebar` uses the same primitives within the Finder layout.

## Install

```sh
pnpm add puppertino-table@0.11.0 @tanstack/react-table@9.2.8 @codedgar/puppertino@2 react@19.3.0 react-dom@19.3.0
```

React 19 (`^19.3.0`), TanStack Table and Puppertino are peer dependencies. Import the Puppertino styles used by your components, followed by the library stylesheet:

```tsx
import { TableView, createPuppertinoColumnHelper } from 'puppertino-table';
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
  return (
    <TableView
      data={items}
      columns={columns}
      getRowId={item => item.id}
      getRowLabel={item => item.name}
      ariaLabel="Files"
      density="compact"
      selectable
    />
  );
}
```

Sorting automatically orders the supplied rows by default. Set `manualSorting` for server-paginated data or other app-owned ordering. The [API guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) covers controlled state, server pagination, persistence, styling and primitive composition.

## Four views, one workspace

The Finder example shares selection between List, Icons, Columns and Gallery. Search, folder history, tags, previews and in-memory file operations belong to the example app. The public components provide layout, table/browser geometry, gestures and menus.

![Column browser with a selected document and app-owned preview](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/columns-preview.png)

| Icons | Gallery |
| --- | --- |
| ![Icon view with document thumbnails](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/icons-light.png) | ![Gallery view with a document preview and filmstrip](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/gallery-preview.png) |

[Try the Finder](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--file-table) · [Build it from public components](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md#compose-a-finder)

### Selection, spacing and themes

Command/Ctrl-click toggles an item; Shift-click extends a range from a fixed anchor. Change density or theme while keeping your workspace state.

| Compact selection | Dark theme |
| --- | --- |
| ![Compact table with two selected files](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-selection.png) | ![Dark table with readable selected-file icons](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-dark.png) |

[Compare comfortable spacing](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--file-table&args=initialDensity:comfortable) · [Dark columns](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--file-table&args=initialView:columns&globals=theme:dark) · [Narrow columns](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--narrow-columns)

## Hierarchy and split views

`OutlineView` keeps disclosure in the first column, sorts siblings together, and supports keyboard navigation and visible-row bulk selection. Supply `loadChildren(item, { signal })` to fetch a branch on expansion. Loading, retry, cancellation and caching stay scoped to that branch.

![Expanded outline with nested Source files and selected index.ts details](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/outline-light.png)

`SplitView` arranges sidebar, content and detail panes with bounded resizing. Hide and restore panes without losing app state; compact layouts show the active pane. Use horizontal or vertical orientation and completion callbacks to persist finished sizes.

![Three-pane split view with independent sidebar, content and detail regions](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/split-view.png)

[Outline playground](https://kahwee.github.io/puppertino-table/?path=/story/puppertino-outline-view--default) · [Split playground](https://kahwee.github.io/puppertino-table/?path=/story/puppertino-split-view--default) · [Touch sidebar](https://kahwee.github.io/puppertino-table/?path=/story/puppertino-sidebar--default&args=size:touch) · [Dark outline](https://kahwee.github.io/puppertino-table/?path=/story/puppertino-outline-view--default&globals=theme:dark)

## Watch the interactions

Each recording shows the working Storybook app with fictional files. Numbered captions and a pointer overlay explain the real interactions. Full-size videos are available as WebM and MP4.

### Resize and reset

![Drag a table divider, reset its width and resize a column-browser panel](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/resizing.gif)

[WebM](https://kahwee.github.io/puppertino-table/media/resizing.webm) · [MP4](https://kahwee.github.io/puppertino-table/media/resizing.mp4) · [Try resizing](https://kahwee.github.io/puppertino-table/?path=/story/examples-finder--file-table)

Drag a divider or use arrow keys. Shift-arrows take larger steps, Home/End reach the limits, and Enter or double-click resets the width. Escape cancels an unfinished drag. Completion callbacks report committed widths; preview callbacks can report each change.

### File commands, with a keyboard alternative

![Right-click a file, open its inspector and navigate a keyboard-opened context menu](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/context-menu.gif)

[WebM](https://kahwee.github.io/puppertino-table/media/context-menu.webm) · [MP4](https://kahwee.github.io/puppertino-table/media/context-menu.mp4) · [Menu recipe](https://kahwee.github.io/puppertino-table/?path=/docs/examples-finder--docs#right-click-and-keyboard-menus)

Right-click or press Shift+F10 on a focused item. Arrow keys navigate enabled commands; Escape closes the menu and restores focus. Your app supplies commands such as Get Info, Move to Archive and Move to Trash.

### Move a file and verify its destination

![Drag Project brief into Archive, then open Archive to see the moved file](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/drag-drop.gif)

[WebM](https://kahwee.github.io/puppertino-table/media/drag-drop.webm) · [MP4](https://kahwee.github.io/puppertino-table/media/drag-drop.mp4) · [Demo source](https://github.com/kahwee/puppertino-table/blob/main/src/finder.stories.tsx)

The example composes native HTML drag/drop with shared rows and items. Moves update in-memory state; **Move to Archive** provides a keyboard alternative. The package does not supply filesystem operations or a drag/drop engine.

### Load and retry a hierarchy

![Expand Projects and Source, select index.ts, then retry the Archive branch without losing selection](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/outline-loading.gif)

[WebM](https://kahwee.github.io/puppertino-table/media/outline-loading.webm) · [MP4](https://kahwee.github.io/puppertino-table/media/outline-loading.mp4) · [Lazy-loading recipe](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-outline-view--docs)

### Resize, hide and restore split panes

![Resize the Sidebar pane, hide it, then restore it from pane navigation](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/split-panes.gif)

[WebM](https://kahwee.github.io/puppertino-table/media/split-panes.webm) · [MP4](https://kahwee.github.io/puppertino-table/media/split-panes.mp4) · [Split-view recipe](https://kahwee.github.io/puppertino-table/?path=/docs/puppertino-split-view--docs)

## Tags

![Assign tags to selected files in an anchored popover](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/tags.png)

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

Arrow keys navigate suggestions; Enter assigns or creates. Backspace in an empty
field focuses the last token before a second Backspace removes it. Escape closes
and returns focus. Disabled options cannot be assigned or removed. The native
Popover API keeps the panel above clipping containers; current browsers supporting
that API are required. Puppertino supplies its material, arrow, shadow and theme.

## Icons

Use `trigger` for your own icon and `triggerClassName` for a Puppertino toolbar
button. The library has no icon dependency. The Finder examples use
[Phosphor Icons](https://phosphoricons.com/) through `@phosphor-icons/react`,
following [Puppertino’s icon guidance](https://puppertino.com/docs/icons/):
20px regular toolbar icons, filled selected views, and duotone file-type icons.

To use the same icons in your application:

```sh
pnpm add @phosphor-icons/react
```

```tsx
import { FolderIcon } from '@phosphor-icons/react';
import { FinderSidebarItem } from 'puppertino-table';

<FinderSidebarItem selected icon={<FolderIcon weight="fill" aria-hidden="true" />}>
  Documents
</FinderSidebarItem>
```

Icon slots accept any React node. Label the enclosing control; decorative icons use `aria-hidden="true"`.

## State and resize contracts

Checkboxes and row gestures share a fixed range anchor. Pass `selectionAnchor` to share selection across layouts. Each state slice has one owner: internal state, a controlled value/callback, or an external atom. Standalone change callbacks observe internal state; atom owners subscribe to their atom.

`PuppertinoTable.onColumnSizingCommit` and `ColumnBrowser.onWidthsCommit` receive completed resize snapshots. Cancelled gestures do not persist widths. [State and persistence guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) · [Migrating to 0.8](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md#migrating-to-08)

## Storybook playgrounds

Each component opens with a typed Playground. Use Controls for prop variants, the shared Theme toolbar for appearance, and Show code for public integration recipes. Regression-only canvases are excluded from navigation and Autodocs. Column view combines table/column layouts, internal/controlled/read-only/persistent widths, density and menu triggers. Tag picker offers option datasets, mixed values, disabled tags and optional creation. Finder views and checkbox settings use args; the Theme toolbar applies across stories. Distinct API recipes and interaction workflows keep their own examples.

## Develop

```sh
pnpm install --frozen-lockfile
pnpm storybook       # interactive examples
pnpm check           # lint, types, unit/browser/hydration and packed-consumer checks
pnpm capture:readme  # regenerate screenshots and screencasts; Chromium + ffmpeg
```

GitHub Actions uses native [`parallel` step groups](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsparallel) to run the same gates as `pnpm check` with separate step logs: lint/types/unit tests, library/demo/Storybook builds, then browser and packed-consumer checks. Within browser verification, the demo gesture/accessibility suite and Storybook interaction/docs suite run concurrently in separate browser contexts; both must finish successfully before Chromium closes. Chromium is cached by OS, architecture and lockfile, while system dependencies are installed each run. These checks share one runner and retain every failure gate across CI and npm preparation/release verification. GitHub Pages publishes Storybook after main passes verification. Media is kept in the repository and Pages, outside the npm package. See [media capture](https://github.com/kahwee/puppertino-table/blob/main/docs/media/README.md), [releasing](https://github.com/kahwee/puppertino-table/blob/main/RELEASING.md) and [pointer profiling](https://github.com/kahwee/puppertino-table/blob/main/docs/pointer-performance.md).

MIT. React, TanStack Table, Puppertino and Phosphor retain their respective licenses.
