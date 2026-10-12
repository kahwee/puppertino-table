import type { RowData } from '@tanstack/react-table';
import { type RefObject } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { type SelectionModifiers } from './selection-gestures.js';
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
export declare function useRowSelectionGestures<T extends RowData>(table: PuppertinoTableInstance<T>, { orderedIds, anchor: externalAnchor, disabled }?: RowSelectionGestureOptions): {
    select: (id: string, modifiers?: SelectionModifiers) => void;
    clearSelection: () => void;
    resetAnchor: () => void;
};
