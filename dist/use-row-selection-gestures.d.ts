import type { RowData } from '@tanstack/react-table';
import { type RefObject } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { type SelectionModifiers } from './selection-gestures.js';
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
export declare function useRowSelectionGestures<T extends RowData>(table: Pick<PuppertinoTableInstance<T>, 'getRowModel' | 'options' | 'setRowSelection' | 'atoms'>, { orderedIds, anchor: externalAnchor, disabled }?: RowSelectionGestureOptions): {
    select: (id: string, modifiers?: SelectionModifiers) => void;
    clearSelection: () => void;
    resetAnchor: () => void;
};
