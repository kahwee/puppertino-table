'use client';
import { useCallback, useRef } from 'react';
import { applySelectionGesture } from './selection-gestures.js';
/** Opt-in item gestures; leaves the existing checkbox range policy untouched.
 * The caller owns DOM semantics, focus, modifier adaptation and any open/navigation actions.
 */
export function useRowSelectionGestures(table, { orderedIds, anchor: externalAnchor, disabled = false } = {}) {
    const localAnchor = useRef(null);
    const anchor = externalAnchor ?? localAnchor;
    const select = useCallback((id, modifiers = {}) => {
        if (disabled || table.options.enableRowSelection === false)
            return;
        const rows = table.getRowModel().rows;
        const byId = new Map(rows.map((row) => [row.id, row]));
        const ids = (orderedIds ?? rows.map((row) => row.id)).filter((key) => {
            const row = byId.get(key);
            // A row predicate cannot decide eligibility for a caller-owned leading item.
            return row ? row.getCanSelect() : typeof table.options.enableRowSelection !== 'function';
        });
        if (!ids.includes(id))
            return;
        const previousAnchor = anchor.current;
        anchor.current = applySelectionGesture(ids, {}, previousAnchor, id, modifiers).anchor;
        table.setRowSelection((previous) => applySelectionGesture(ids, previous, previousAnchor, id, modifiers).selection);
    }, [table, orderedIds, anchor, disabled]);
    const clearSelection = useCallback(() => {
        if (disabled || table.options.enableRowSelection === false)
            return;
        anchor.current = null;
        table.setRowSelection({});
    }, [table, anchor, disabled]);
    const resetAnchor = useCallback(() => {
        anchor.current = null;
    }, [anchor]);
    return { select, clearSelection, resetAnchor };
}
