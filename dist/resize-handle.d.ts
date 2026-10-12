import type { RowData } from '@tanstack/react-table';
import type { ColumnResizeHandleProps } from './resize-types.js';
export type { ColumnResizeHandleProps } from './resize-types.js';
export declare function ColumnResizeHandle<T extends RowData>({ table, header, label, options }: ColumnResizeHandleProps<T>): import("react").JSX.Element | null;
