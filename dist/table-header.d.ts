import { type RowData } from '@tanstack/react-table';
import type { TableHeaderProps } from './table-types.js';
export declare function TableHeader<T extends RowData>({ table, selectable: selectionOverride, disabled: disabledOverride, resizable: resizeOverride, resizeOptions, selectionRows, getHeaderMenu, }: TableHeaderProps<T>): import("react").JSX.Element;
