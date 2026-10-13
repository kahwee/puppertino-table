import type { RowData } from '@tanstack/react-table';
import { type ColumnDef, type ReactTable, type RowSelectionState, type SortingState } from '@tanstack/react-table';
import type { TableBehavior } from './table-behavior.js';
export declare const puppertinoTableFeatures: {
    rowSortingFeature: import("@tanstack/react-table").TableFeature;
    columnSizingFeature: import("@tanstack/react-table").TableFeature;
    rowSelectionFeature: import("@tanstack/react-table").TableFeature;
    sortedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
    sortFns: {
        alphanumeric: import("@tanstack/react-table").CreatedSortFn<any, any>;
        alphanumericCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
        basic: import("@tanstack/react-table").CreatedSortFn<any, any>;
        datetime: import("@tanstack/react-table").CreatedSortFn<any, any>;
        text: import("@tanstack/react-table").CreatedSortFn<any, any>;
        textCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
    };
    tableMeta: {
        puppertino: TableBehavior;
    };
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
    sortFns: {
        alphanumeric: import("@tanstack/react-table").CreatedSortFn<any, any>;
        alphanumericCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
        basic: import("@tanstack/react-table").CreatedSortFn<any, any>;
        datetime: import("@tanstack/react-table").CreatedSortFn<any, any>;
        text: import("@tanstack/react-table").CreatedSortFn<any, any>;
        textCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
    };
    tableMeta: {
        puppertino: TableBehavior;
    };
}, T>;
