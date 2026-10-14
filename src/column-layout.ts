import type { ColumnSizingState } from '@tanstack/react-table';
import type { ContextMenuItem } from './context-menu.js';
import { type ColumnSizeBounds, clampSize, columnSizeBounds } from './sizing.js';

export interface ColumnLayoutColumn extends ColumnSizeBounds {
  label: string;
  required?: boolean;
  /** Pinned columns stay first, in schema order, and cannot be hidden. */
  pinned?: boolean;
  defaultHidden?: boolean;
}
export interface ColumnLayout {
  version: 1;
  order: string[];
  hidden: string[];
  widths: ColumnSizingState;
}

/** Normalize saved data against the current schema, retaining hidden-column widths. */
export function normalizeColumnLayout(
  columns: readonly ColumnLayoutColumn[],
  value?: unknown,
): ColumnLayout {
  const bounds = columnSizeBounds(columns);
  const ids = columns.map((column) => column.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id))
    throw new Error('Column layout IDs must be unique and nonempty.');
  const saved =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const valid = saved.version === 1;
  const order = valid && Array.isArray(saved.order) ? saved.order : [];
  const hidden =
    valid && Array.isArray(saved.hidden)
      ? saved.hidden
      : columns.filter((column) => column.defaultHidden).map((column) => column.id);
  const widths =
    valid && saved.widths && typeof saved.widths === 'object' && !Array.isArray(saved.widths)
      ? (saved.widths as Record<string, unknown>)
      : {};
  const pinned = columns.filter((column) => column.pinned).map((column) => column.id);
  return {
    version: 1,
    order: [
      ...new Set([
        ...pinned,
        ...order.filter((id): id is string => typeof id === 'string' && ids.includes(id)),
        ...ids,
      ]),
    ],
    hidden: columns
      .filter((column) => !column.required && !column.pinned && hidden.includes(column.id))
      .map((column) => column.id),
    widths: Object.fromEntries(
      bounds.map((column) => [column.id, clampSize(widths[column.id], column)]),
    ),
  };
}

export function readColumnLayout(
  columns: readonly ColumnLayoutColumn[],
  text: string | null,
): ColumnLayout {
  try {
    return normalizeColumnLayout(columns, JSON.parse(text ?? 'null'));
  } catch {
    return normalizeColumnLayout(columns);
  }
}

export function moveLayoutColumn(
  columns: readonly ColumnLayoutColumn[],
  layout: ColumnLayout,
  id: string,
  direction: -1 | 1,
  eligibleIds?: readonly string[],
): ColumnLayout {
  const order = [...layout.order];
  const eligible = order.filter(
    (key) =>
      !layout.hidden.includes(key) &&
      columns.some((column) => column.id === key) &&
      (!eligibleIds || eligibleIds.includes(key)),
  );
  const position = eligible.indexOf(id),
    target = eligible[position + direction];
  const pinned = (key: string) => columns.find((column) => column.id === key)?.pinned;
  if (position < 0 || !target || pinned(id) || pinned(target)) return layout;
  const index = order.indexOf(id),
    next = order.indexOf(target);
  [order[index], order[next]] = [order[next], order[index]];
  return normalizeColumnLayout(columns, { ...layout, order });
}

export interface ColumnLayoutCommands {
  columns: readonly ColumnLayoutColumn[];
  layout: ColumnLayout;
  setVisible(id: string, visible: boolean): void;
  move(id: string, direction: -1 | 1, eligibleIds?: readonly string[]): void;
  reset(): void;
}
/** Compose these with app-owned sorting actions in getHeaderMenu. */
export function columnLayoutMenu(
  commands: ColumnLayoutCommands,
  columnId?: string,
): ContextMenuItem[] {
  const { columns, layout } = commands;
  const current = columns.find((column) => column.id === columnId);
  const actions: ContextMenuItem[] = current
    ? ([-1, 1] as const).map((direction) => ({
        id: `layout-move-${direction}`,
        label: `Move ${current.label}${direction === -1 ? ' earlier' : ' later'}`,
        disabled:
          moveLayoutColumn(
            columns,
            layout,
            current.id,
            direction,
            columns.map((column) => column.id),
          ) === layout,
        onSelect: () =>
          commands.move(
            current.id,
            direction,
            columns.map((column) => column.id),
          ),
      }))
    : [];
  if (current) actions.push({ id: 'layout-separator', type: 'separator' });
  actions.push(
    ...layout.order.flatMap((id) => {
      const column = columns.find((column) => column.id === id);
      return column
        ? [
            {
              id: `layout-visible-${id}`,
              label: column.label,
              checked: !layout.hidden.includes(id),
              disabled: column.required || column.pinned,
              onSelect: () => commands.setVisible(id, layout.hidden.includes(id)),
            },
          ]
        : [];
    }),
    { id: 'layout-reset-separator', type: 'separator' },
    { id: 'layout-reset', label: 'Restore default layout', onSelect: commands.reset },
  );
  return actions;
}
