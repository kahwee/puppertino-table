'use client';
import type { RowData } from '@tanstack/react-table';
import { type RefObject, useCallback } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { selectionAnchorFor } from './selection-anchor.js';
import { applySelectionGesture, type SelectionModifiers } from './selection-gestures.js';

export interface RowSelectionGestureOptions {
  /** Visible item order, including caller-owned leading items. Defaults to rendered table rows. */
  orderedIds?: readonly string[];
  /** Share an anchor across layouts. Defaults to the table’s shared anchor. */
  anchor?: RefObject<string | null>;
  disabled?: boolean;
}

/** Anchored selection shared by row gestures and selection checkboxes.
 * The caller owns DOM semantics, focus, modifier adaptation and any open/navigation actions.
 */
export function useRowSelectionGestures<T extends RowData>(
  table: Pick<PuppertinoTableInstance<T>, 'getRowModel' | 'options' | 'setRowSelection' | 'atoms'>,
  { orderedIds, anchor: externalAnchor, disabled = false }: RowSelectionGestureOptions = {},
) {
  selectionAnchorFor(table.atoms.rowSelection, externalAnchor);
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
      const anchor = selectionAnchorFor(table.atoms.rowSelection);
      const previousAnchor = anchor.current;
      anchor.current = applySelectionGesture(ids, {}, previousAnchor, id, modifiers).anchor;
      table.setRowSelection(
        (previous) => applySelectionGesture(ids, previous, previousAnchor, id, modifiers).selection,
      );
    },
    [table, orderedIds, disabled],
  );
  const clearSelection = useCallback(() => {
    if (disabled || table.options.enableRowSelection === false) return;
    selectionAnchorFor(table.atoms.rowSelection).current = null;
    table.setRowSelection({});
  }, [table, disabled]);
  const resetAnchor = useCallback(() => {
    selectionAnchorFor(table.atoms.rowSelection).current = null;
  }, [table]);
  return { select, clearSelection, resetAnchor };
}
