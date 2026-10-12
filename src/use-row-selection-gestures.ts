'use client';
import type { RowData } from '@tanstack/react-table';
import { type RefObject, useCallback, useRef } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { applySelectionGesture, type SelectionModifiers } from './selection-gestures.js';

export interface RowSelectionGestureOptions {
  /** Visible item order, including caller-owned leading items. Defaults to rendered table rows. */
  orderedIds?: readonly string[];
  /** Share an anchor across layouts. Without this, the anchor belongs to this mounted hook. */
  anchor?: RefObject<string | null>;
  disabled?: boolean;
}

/** Opt-in item gestures; leaves the existing checkbox range policy untouched.
 * The caller owns DOM semantics, focus, modifier adaptation and any open/navigation actions.
 */
export function useRowSelectionGestures<T extends RowData>(
  table: PuppertinoTableInstance<T>,
  { orderedIds, anchor: externalAnchor, disabled = false }: RowSelectionGestureOptions = {},
) {
  const localAnchor = useRef<string | null>(null);
  const anchor = externalAnchor ?? localAnchor;
  const select = useCallback(
    (id: string, modifiers: SelectionModifiers = {}) => {
      if (disabled || table.options.enableRowSelection === false) return;
      const rows = table.getRowModel().rows;
      const byId = new Map(rows.map((row) => [row.id, row]));
      const ids = (orderedIds ?? rows.map((row) => row.id)).filter((key) => {
        const row = byId.get(key);
        // A row predicate cannot decide eligibility for a caller-owned leading item.
        return row ? row.getCanSelect() : typeof table.options.enableRowSelection !== 'function';
      });
      if (!ids.includes(id)) return;
      const previousAnchor = anchor.current;
      anchor.current = applySelectionGesture(ids, {}, previousAnchor, id, modifiers).anchor;
      table.setRowSelection(
        (previous) => applySelectionGesture(ids, previous, previousAnchor, id, modifiers).selection,
      );
    },
    [table, orderedIds, anchor, disabled],
  );
  const clearSelection = useCallback(() => {
    if (disabled || table.options.enableRowSelection === false) return;
    anchor.current = null;
    table.setRowSelection({});
  }, [table, anchor, disabled]);
  const resetAnchor = useCallback(() => {
    anchor.current = null;
  }, [anchor]);
  return { select, clearSelection, resetAnchor };
}
