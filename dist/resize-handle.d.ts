import type { RowData } from '@tanstack/react-table';
import type { ColumnResizeOptions } from './use-column-resize.js';
import type { PuppertinoTableInstance } from './model.js';
import type { Header } from '@tanstack/react-table';
import { puppertinoTableFeatures } from './model.js';
export interface ColumnResizeHandleProps<T extends RowData> {
    table: PuppertinoTableInstance<T>;
    header: Header<typeof puppertinoTableFeatures, T>;
    /** Defaults to a string header or the stable column ID. */
    label?: string;
    options?: ColumnResizeOptions;
}
export declare function ColumnResizeHandle<T extends RowData>({ table, header, label, options }: ColumnResizeHandleProps<T>): import("react").JSX.Element | null;
