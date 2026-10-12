import type { RowSelectionState } from '@tanstack/react-table';

/** Normal click replaces, toggle-click toggles, and Shift extends a fixed anchor. */
export interface SelectionModifiers {
  shift?: boolean;
  toggle?: boolean;
}

export interface SelectionGestureResult {
  selection: RowSelectionState;
  anchor: string | null;
}

/** Caller-owned order can include leading items and custom layouts, not only table rows.
 * Toggle gestures preserve selections outside that order; replacing gestures clear them.
 */
export function applySelectionGesture(
  orderedIds: readonly string[],
  selection: RowSelectionState,
  anchor: string | null,
  id: string,
  { shift = false, toggle = false }: SelectionModifiers = {},
): SelectionGestureResult {
  const ids = [...new Set(orderedIds)];
  const end = ids.indexOf(id);
  if (end === -1) return { selection, anchor };
  const start = anchor === null ? -1 : ids.indexOf(anchor);
  if (shift && start !== -1) {
    const range = Object.fromEntries(
      ids.slice(Math.min(start, end), Math.max(start, end) + 1).map((key) => [key, true as const]),
    );
    return { selection: toggle ? { ...selection, ...range } : range, anchor };
  }
  if (toggle) {
    const next = { ...selection, [id]: true as const };
    if (selection[id] === true) delete next[id];
    return { selection: next, anchor: id };
  }
  return { selection: { [id]: true }, anchor: id };
}
