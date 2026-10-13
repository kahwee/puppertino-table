import type {
  ContextMenuAction,
  ContextMenuItem,
  ContextMenuState,
  FinderIconItemProps,
  FinderViewSwitcherProps,
  PuppertinoRowProps,
  TagOption,
  TagPickerProps,
} from '../src/index.js';

// Compile-time coverage: conflicting menu variants must fail at the public entry point.
const command = { id: 'open', label: 'Open', onSelect: () => {} } satisfies ContextMenuItem;
const link = {
  id: 'docs',
  label: 'Docs',
  href: '/docs',
  target: '_blank',
} satisfies ContextMenuItem;
const separator = { id: 'divider', type: 'separator' } satisfies ContextMenuItem;
// @ts-expect-error A separator cannot execute an action.
const actionableSeparator: ContextMenuItem = {
  id: 'divider',
  type: 'separator',
  onSelect: () => {},
};
// @ts-expect-error A separator cannot navigate.
const linkedSeparator: ContextMenuItem = { id: 'divider', type: 'separator', href: '/docs' };
const targetedCommand: ContextMenuAction = {
  id: 'open',
  label: 'Open',
  onSelect: () => {},
  // @ts-expect-error Link-only attributes are not valid for a command.
  target: '_blank',
};
// @ts-expect-error Menu entries need either a link destination or an action.
const inertItem: ContextMenuItem = { id: 'open', label: 'Open' };
const rowProps = { 'data-item-id': 'brief', tabIndex: 0 } satisfies PuppertinoRowProps;
// @ts-expect-error Row customization cannot replace library-rendered cells.
const rowChildren: PuppertinoRowProps = { children: 'replacement cells' };
const closedMenu: ContextMenuState<string> | null = null;
void [
  command,
  link,
  separator,
  actionableSeparator,
  linkedSeparator,
  targetedCommand,
  inertItem,
  rowProps,
  rowChildren,
  closedMenu,
];

// Existing consumers can exclude separators using property-presence narrowing.
export function menuLabel(item: ContextMenuItem): string {
  return 'label' in item ? item.label.toUpperCase() : '';
}
export function menuLabels(items: ContextMenuItem[]): string[] {
  return items.filter((item) => 'label' in item).map((item) => item.label.toUpperCase());
}
const labeledSeparator: ContextMenuItem = {
  id: 'divider',
  type: 'separator',
  // @ts-expect-error A separator literal cannot have a label.
  label: 'Divider',
};
void labeledSeparator;

// Each state slice can have exactly one owner; different slices can mix modes.
import { createAtom } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import type { PuppertinoTableOptions, PuppertinoTableProps } from '../src/index.js';

const sortingAtom = createAtom<SortingState>([]);
const selectionAtom = createAtom<RowSelectionState>({});
const sizingAtom = createAtom<ColumnSizingState>({});
const stateBase = { data: [{ id: 'a' }], columns: [], getRowId: (row: { id: string }) => row.id };
const mixedOwners: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { sorting: sortingAtom },
  rowSelection: {},
  onRowSelectionChange: () => {},
  onColumnSizingChange: () => {},
};
const allAtoms: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { sorting: sortingAtom, rowSelection: selectionAtom, columnSizing: sizingAtom },
};
// @ts-expect-error Sorting cannot be atom-owned and controlled.
const conflictingSort: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { sorting: sortingAtom },
  sorting: [],
};
// @ts-expect-error Atom owners subscribe to the atom instead of receiving a change callback.
const conflictingSortCallback: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { sorting: sortingAtom },
  onSortingChange: () => {},
};
// @ts-expect-error Selection cannot be atom-owned and controlled.
const conflictingSelection: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { rowSelection: selectionAtom },
  rowSelection: {},
};
// @ts-expect-error Selection callback conflicts with atom ownership.
const conflictingSelectionCallback: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { rowSelection: selectionAtom },
  onRowSelectionChange: () => {},
};
// @ts-expect-error Widths cannot be atom-owned and controlled.
const conflictingSizing: PuppertinoTableOptions<{ id: string }> = {
  ...stateBase,
  atoms: { columnSizing: sizingAtom },
  columnSizing: {},
};
// @ts-expect-error Sizing callback conflicts with atom ownership.
const conflictingSizingCallback: PuppertinoTableProps<{ id: string }> = {
  ...stateBase,
  ariaLabel: 'Items',
  atoms: { columnSizing: sizingAtom },
  onColumnSizingChange: () => {},
};
const committedAtoms: PuppertinoTableProps<{ id: string }> = {
  ...allAtoms,
  ariaLabel: 'Items',
  selectionAnchor: { current: null },
  selectionCheckboxes: false,
  onColumnSizingCommit: (widths) => {
    const width: number | undefined = widths.name;
    void width;
  },
};
void [
  mixedOwners,
  conflictingSort,
  conflictingSortCallback,
  conflictingSelection,
  conflictingSelectionCallback,
  conflictingSizing,
  conflictingSizingCallback,
  committedAtoms,
];

// Tag values use stable IDs independently of application records.
const tagOptions = [{ id: 'review', label: 'Review' }] as const satisfies readonly TagOption[];
const tagPicker = {
  options: tagOptions,
  value: ['review'],
  onValueChange: (_value: string[]) => {},
} satisfies TagPickerProps;
// @ts-expect-error Controlled values require an update callback.
const missingTagCallback: TagPickerProps = { options: tagOptions, value: [] };
void [tagPicker, missingTagCallback];

const viewIcons = { icons: null, list: null, columns: null, gallery: null };
const finderSwitcher = {
  value: 'list',
  onValueChange: (_view: 'icons' | 'list' | 'columns' | 'gallery') => {},
  icons: viewIcons,
} satisfies FinderViewSwitcherProps;
// @ts-expect-error Controlled view switching requires its callback.
const missingViewCallback: FinderViewSwitcherProps = { value: 'list', icons: viewIcons };
// @ts-expect-error Selection has one owner; use selected rather than overriding aria-pressed.
const conflictingIconSelection: FinderIconItemProps = { selected: true, 'aria-pressed': false };
void [finderSwitcher, missingViewCallback, conflictingIconSelection];

import type { OutlineViewProps, SplitViewProps } from '../src/index.js';

type OutlineItem = { id: string; name: string; children?: OutlineItem[] };
const outlineProps = {
  data: [{ id: 'root', name: 'Root' }],
  columns: [],
  getRowId: (item) => item.id,
  getRowLabel: (item) => item.name,
  getChildren: (item) => item.children,
  hasChildren: (item) => item.name === 'Root',
  ariaLabel: 'Outline',
  loadChildren: async (_item, { signal }) => {
    const abort: AbortSignal = signal;
    void abort;
    return [{ id: 'child', name: 'Child' }];
  },
} satisfies OutlineViewProps<OutlineItem>;
const badOutlineLoader: OutlineViewProps<OutlineItem> = {
  ...outlineProps,
  // @ts-expect-error Children must use the same typed row model.
  loadChildren: async () => [{ id: 'child' }],
};
const splitProps = {
  ariaLabel: 'Split',
  orientation: 'vertical',
  panes: [{ id: 'sidebar', label: 'Sidebar', content: null }],
} satisfies SplitViewProps;
// @ts-expect-error Apple split views support horizontal or vertical arrangements.
const invalidSplit: SplitViewProps = { ...splitProps, orientation: 'diagonal' };
void [outlineProps, badOutlineLoader, splitProps, invalidSplit];

import type { ColumnViewProps } from '../src/index.js';

const columnView = {
  ariaLabel: 'Columns',
  columns: [{ id: 'root', label: 'Root', content: null }],
} satisfies ColumnViewProps;
// @ts-expect-error ColumnView uses columns; panels is the legacy ColumnBrowser vocabulary.
const invalidColumnView: ColumnViewProps = { ariaLabel: 'Columns', panels: [] };
void [columnView, invalidColumnView];
