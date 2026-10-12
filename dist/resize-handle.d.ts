import type { RowData } from '@tanstack/react-table';
import type { ColumnResizeOptions } from './use-column-resize.js';
import type { PuppertinoTableInstance } from './model.js';
import type { Header } from '@tanstack/react-table';
import { puppertinoTableFeatures } from './model.js';
export declare function ColumnResizeHandle<T extends RowData>({ table, header, label, options }: {
    table: PuppertinoTableInstance<T>;
    header: Header<typeof puppertinoTableFeatures, T>;
    label: string;
    options?: ColumnResizeOptions;
}): import("react").JSX.Element | null;
