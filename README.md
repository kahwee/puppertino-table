# Puppertino Table

Finder-style React tables and column browsers, built on [Puppertino](https://puppertino.com/) and [TanStack Table](https://tanstack.com/table). Bring your own data, icons and app actions.

[Storybook guide](https://kahwee.github.io/puppertino-table/?path=/docs/start-here-overview--docs) · [API guide](https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md) · [npm](https://www.npmjs.com/package/puppertino-table)

![Compact file table with sortable headers and bounded resize handles](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/table-light.png)

- Semantic tables, typed columns, local or server-owned sorting, and range selection.
- Pointer and keyboard resizing, width limits, reset, cancellation, completed-gesture callbacks, and optional browser width persistence.
- Independently resizable column-browser panels with native links and caller-rendered previews.
- Shared CSS density, documented styling hooks and dark themes, without a React provider.
- Right-click and keyboard menus with delegated workspace triggers, commands, links and disabled items.
- Fine-grained sizing subscriptions keep the memoized row body out of resize renders.

## Install and use

```sh
pnpm add puppertino-table@0.7.0 @tanstack/react-table@9.2.8 @codedgar/puppertino@2 react@19.3.0 react-dom@19.3.0
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

### Resize table columns and browser panels

![Screencast of pointer resizing, double-click reset and independent browser panel resizing](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/resizing.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/resizing.mp4). Keyboard separators support arrows, Shift-arrows, Home/End and Enter to reset; Escape cancels an unfinished drag.

### Right-click, close up

![Right-click menu at 125 percent zoom](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/context-menu.png)

![Screencast of right-click Get Info and a keyboard-opened context menu](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/context-menu.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/context-menu.mp4). Right-click or Shift+F10 opens the menu. Arrows navigate enabled items; Escape closes it and restores focus. Get Info is an example app command.

### Drag and drop in a small app

![Screencast of moving a fictional file into Archive and opening the destination](https://raw.githubusercontent.com/kahwee/puppertino-table/main/docs/media/drag-drop.gif)

[Watch MP4](https://kahwee.github.io/puppertino-table/media/drag-drop.mp4). This demo composes native HTML drag/drop with the table and browser items. Moves are in-memory and app-owned; the package does not implement file operations or a drag/drop engine. The Move menu command provides a keyboard alternative.

[Watch and try each feature in Storybook](https://kahwee.github.io/puppertino-table/?path=/docs/examples-finder--docs). All media records the working apps with fictional data in Chromium. The pointer and captions are recording overlays. [Demo source](https://github.com/kahwee/puppertino-table/blob/main/src/finder.stories.tsx).

## Develop

```sh
pnpm install
pnpm storybook       # interactive examples
pnpm check           # lint, types, unit/browser/hydration and packed-consumer checks
pnpm capture:readme  # regenerate curated screenshots and screencasts; needs Chromium + ffmpeg
```

GitHub Pages publishes Storybook after main passes verification. See [releasing](https://github.com/kahwee/puppertino-table/blob/main/RELEASING.md) for npm releases and [pointer profiling](https://github.com/kahwee/puppertino-table/blob/main/docs/pointer-performance.md) for measured resizing behavior. Media stays in the repository/Pages; it is not bundled into npm.

MIT. React, TanStack Table and Puppertino retain their respective licenses.
