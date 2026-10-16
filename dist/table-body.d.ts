import type { RowData } from '@tanstack/react-table';
import { type Ref } from 'react';
import type { PuppertinoBodyContext, PuppertinoRow, PuppertinoRowProps, TableBodyProps } from './table-types.js';
/** Resolve shared policy outside the memoized cells so policy changes still reach them. */
export declare function TableBody<T extends RowData>(props: TableBodyProps<T>): import("react").JSX.Element;
/** Shared native row rendering for the ordinary and virtual bodies. */
export declare function TableDataRow<T extends RowData>({ row, context, getRowLabel, getRowProps, getCellProps, rowProps, rowRef, }: {
    row: PuppertinoRow<T>;
    context: PuppertinoBodyContext<T>;
    getRowLabel?: TableBodyProps<T>['getRowLabel'];
    getRowProps?: TableBodyProps<T>['getRowProps'];
    getCellProps?: TableBodyProps<T>['getCellProps'];
    rowProps?: PuppertinoRowProps;
    rowRef?: Ref<HTMLTableRowElement>;
}): import("react").JSX.Element;
