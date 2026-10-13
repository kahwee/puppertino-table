import type { ColumnSizingState, ExternalAtoms, OnChangeFn, RowData, RowSelectionState, SortingState } from '@tanstack/react-table';
import type { PuppertinoColumnDef, puppertinoTableFeatures } from './model.js';
/** App-owned writable atoms for the registered table state slices. */
export type PuppertinoTableAtoms = ExternalAtoms<typeof puppertinoTableFeatures>;
/** Shared state contract for complete tables and custom layouts. */
export interface PuppertinoTableOptions<T extends RowData> {
    /** Supplied rows only; pagination and fetching remain app-owned. */
    data: readonly T[];
    /** Atom ownership replaces value/callback ownership for that slice. */
    atoms?: PuppertinoTableAtoms;
    /** Stable IDs or string accessor keys are required for sizing and persistence. */
    columns: readonly PuppertinoColumnDef<T>[];
    /** Stable unique ID, independent of current sorting or page position. */
    getRowId: (row: T, index: number) => string;
    /** Omit for local state. Controlled state without a callback is read-only. */
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    /** Initial values apply only on mount to uncontrolled state. */
    initialSorting?: SortingState;
    /** Mount-only seed for internally owned selection; ignored for controlled/atom state. */
    initialRowSelection?: RowSelectionState;
    /** Preserve host-owned order by default, including server-paginated data. */
    manualSorting?: boolean;
    /** Omit for local selection; a value without a callback is read-only. */
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    /** Enable row selection. Default: false. Selection never authorizes an action. */
    selectable?: boolean;
    /** Disable selection in the hook; the complete component also disables its UI. */
    disabled?: boolean;
    /** App-owned widths; saved preferences are ignored in controlled mode. */
    columnSizing?: ColumnSizingState;
    /** Receives a value or functional updater. Controlled widths without this are read-only. */
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
    /** Restore internal widths after hydration; complete-table resizing saves on completion. */
    storageKey?: string;
    /** Defaults to browser localStorage. Unavailable storage is handled safely. */
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
}
