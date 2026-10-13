import type { RowData } from '@tanstack/react-table';
import type { TableBodyProps } from './table-types.js';
/** Resolve shared policy outside the memoized cells so policy changes still reach them. */
export declare function TableBody<T extends RowData>(props: TableBodyProps<T>): import("react").JSX.Element;
