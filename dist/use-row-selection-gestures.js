'use client';
import { useCallback } from 'react';
import { selectionAnchorFor } from './selection-anchor.js';
import { applySelectionGesture } from './selection-gestures.js';
/** Anchored selection shared by row gestures and selection checkboxes.
 * The caller owns DOM semantics, focus, modifier adaptation and any open/navigation actions.
 */
export function useRowSelectionGestures(table, { orderedIds, anchor: externalAnchor, disabled = false } = {}) {
    selectionAnchorFor(table.atoms.rowSelection, externalAnchor);
    const select = useCallback((id, modifiers = {}) => {
        if (disabled || table.options.enableRowSelection === false)
            return;
        const { rows, flatRows } = table.getRowModel();
        let ids;
        if (orderedIds) {
            const byId = new Map(flatRows.map((row) => [row.id, row]));
            ids = orderedIds.filter((key) => {
                const row = byId.get(key);
                // A row predicate cannot decide eligibility for a caller-owned leading item.
                return row ? row.getCanSelect() : typeof table.options.enableRowSelection !== 'function';
            });
        }
        else {
            // Default row order already has the row objects; no lookup index is needed.
            ids = rows.filter((row) => row.getCanSelect()).map((row) => row.id);
        }
        if (!ids.includes(id))
            return;
        const anchor = selectionAnchorFor(table.atoms.rowSelection);
        const previousAnchor = anchor.current;
        // Update the anchor synchronously, but build the selection only in the updater.
        anchor.current =
            modifiers.shift && previousAnchor !== null && ids.includes(previousAnchor)
                ? previousAnchor
                : id;
        table.setRowSelection((previous) => applySelectionGesture(ids, previous, previousAnchor, id, modifiers).selection);
    }, [table, orderedIds, disabled]);
    const clearSelection = useCallback(() => {
        if (disabled || table.options.enableRowSelection === false)
            return;
        selectionAnchorFor(table.atoms.rowSelection).current = null;
        table.setRowSelection({});
    }, [table, disabled]);
    const resetAnchor = useCallback(() => {
        selectionAnchorFor(table.atoms.rowSelection).current = null;
    }, [table]);
    return { select, clearSelection, resetAnchor };
}
