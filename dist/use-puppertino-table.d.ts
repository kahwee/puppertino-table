import type { RowData, SortingState, RowSelectionState, OnChangeFn } from '@tanstack/react-table';
import { type PuppertinoColumnDef, type PuppertinoTableInstance } from './model.js';
export interface PuppertinoTableOptions<T extends RowData> {
    data: readonly T[];
    columns: readonly PuppertinoColumnDef<T>[];
    getRowId: (row: T, index: number) => string;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    /** Preserve host-owned order by default, including server-paginated data. */
    manualSorting?: boolean;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    selectable?: boolean;
    disabled?: boolean;
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
}
/** Shared state wiring for complete tables and custom semantic layouts. */
export declare function usePuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, manualSorting, rowSelection: controlledSelection, onRowSelectionChange, selectable, disabled, storageKey, storage }: PuppertinoTableOptions<T>): PuppertinoTableInstance<T>;
