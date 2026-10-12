import type { RowData } from '@tanstack/react-table';
import type { TableHeaderProps } from './table-types.js';
export type { TableHeaderProps } from './table-types.js';
export declare function TableHeader<T extends RowData>({ table, selectable, disabled, resizable, resizeOptions }: TableHeaderProps<T>): import("react").JSX.Element;
