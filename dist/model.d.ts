import type { RowData } from '@tanstack/react-table';
import { type ReactTable, type SortingState, type RowSelectionState, type ColumnDef } from '@tanstack/react-table';
export declare const puppertinoTableFeatures: {
    rowSortingFeature: import("@tanstack/react-table").TableFeature;
    columnSizingFeature: import("@tanstack/react-table").TableFeature;
    rowSelectionFeature: import("@tanstack/react-table").TableFeature;
    sortedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
};
export type PuppertinoTableInstance<T extends RowData> = ReactTable<typeof puppertinoTableFeatures, T, {
    sorting: SortingState;
    rowSelection: RowSelectionState;
}>;
export type PuppertinoColumnDef<T extends RowData> = ColumnDef<typeof puppertinoTableFeatures, T>;
export declare function createPuppertinoColumnHelper<T extends RowData>(): import("@tanstack/react-table").ColumnHelper<{
    rowSortingFeature: import("@tanstack/react-table").TableFeature;
    columnSizingFeature: import("@tanstack/react-table").TableFeature;
    rowSelectionFeature: import("@tanstack/react-table").TableFeature;
    sortedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
}, T>;
