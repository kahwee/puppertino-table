import type { RowData } from '@tanstack/react-table';
import { type ReactNode } from 'react';
import { type SortingState, type RowSelectionState, type OnChangeFn } from '@tanstack/react-table';
import { type PuppertinoColumnDef } from './model.js';
export interface PuppertinoTableProps<T extends RowData> {
    data: readonly T[];
    columns: readonly PuppertinoColumnDef<T>[];
    getRowId: (row: T, index: number) => string;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    /** True for server-owned order/pagination; false enables local TanStack sorting. */
    manualSorting?: boolean;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    getRowLabel?: (row: T) => string;
    selectable?: boolean;
    disabled?: boolean;
    resizable?: boolean;
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    cancelMediaQuery?: string;
    ariaLabel: string;
    caption?: ReactNode;
    emptyContent?: ReactNode;
    className?: string;
}
export declare function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, manualSorting, rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable, disabled, resizable, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent, className }: PuppertinoTableProps<T>): import("react").JSX.Element;
