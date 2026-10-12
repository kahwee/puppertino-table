import type { ColumnSizingState } from '@tanstack/react-table';
export interface ColumnSizeBounds {
    id: string;
    size: number;
    minSize: number;
    maxSize: number;
}
export declare function clampSize(value: unknown, bounds: ColumnSizeBounds): number;
/** Unknown/stale column IDs and nonnumeric preferences never enter table state. */
export declare function readColumnSizing(bounds: readonly ColumnSizeBounds[], key?: string, storage?: Pick<Storage, 'getItem'>): ColumnSizingState;
/** Stable IDs keep stored widths independent of translated header labels. */
interface SizingDefinition {
    id?: string;
    accessorKey?: unknown;
    size?: number;
    minSize?: number;
    maxSize?: number;
    columns?: readonly SizingDefinition[];
}
export declare function columnSizeBounds(columns: readonly SizingDefinition[]): ColumnSizeBounds[];
export {};
