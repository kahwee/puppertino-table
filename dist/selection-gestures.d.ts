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
export declare function applySelectionGesture(orderedIds: readonly string[], selection: RowSelectionState, anchor: string | null, id: string, { shift, toggle }?: SelectionModifiers): SelectionGestureResult;
