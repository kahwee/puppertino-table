import type {
  ContextMenuAction,
  ContextMenuItem,
  ContextMenuState,
  PuppertinoRowProps,
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
