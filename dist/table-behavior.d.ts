import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance } from './model.js';
export declare const tableDefaults: {
    readonly manualSorting: false;
    readonly selectable: false;
    readonly selectionCheckboxes: true;
    readonly disabled: false;
    readonly resizable: true;
    readonly reorderable: false;
    readonly lockedColumns: readonly string[];
};
/** Shared UI policy; writable selection is resolved independently by TanStack. */
export interface TableBehavior {
    selectable: boolean;
    selectionCheckboxes: boolean;
    disabled: boolean;
    resizable: boolean;
    reorderable: boolean;
    lockedColumns: readonly string[];
}
export declare function tableBehavior<T extends RowData>(table: PuppertinoTableInstance<T>): TableBehavior;
