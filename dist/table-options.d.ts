import type { RowData, SortingState, RowSelectionState, OnChangeFn } from '@tanstack/react-table';
import type { PuppertinoColumnDef } from './model.js';
/** Shared state contract for complete tables and custom layouts. */
export interface PuppertinoTableOptions<T extends RowData> {
    data: readonly T[];
    columns: readonly PuppertinoColumnDef<T>[];
    getRowId: (row: T, index: number) => string;
    /** Omit for local state. Controlled state without a callback is read-only. */
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    /** Initial values apply only on mount to uncontrolled state. */
    initialSorting?: SortingState;
    initialRowSelection?: RowSelectionState;
    /** Preserve host-owned order by default, including server-paginated data. */
    manualSorting?: boolean;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    selectable?: boolean;
    disabled?: boolean;
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
}
