import type { RowData } from '@tanstack/react-table';
import type { TableBodyProps } from './table-types.js';
declare function RenderTableBody<T extends RowData>({ table, selectable, disabled, getRowLabel, emptyContent, getRowProps, getCellProps, leadingRows, }: TableBodyProps<T>): import("react").JSX.Element;
/** Geometry updates do not rerender cells; data and table state changes still do. */
export declare const TableBody: typeof RenderTableBody;
export {};
