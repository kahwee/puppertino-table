import type { RowData } from '@tanstack/react-table';
import type { PuppertinoRow, PuppertinoTableProps } from './table-types.js';
import { type OutlineOptions } from './use-outline.js';
type OutlineTableProps<P> = P extends unknown ? Omit<P, 'virtualization' | 'getSubRows' | 'leadingRows' | 'status' | 'loadingContent' | 'errorContent'> : never;
export type OutlineViewProps<T extends RowData> = OutlineTableProps<PuppertinoTableProps<T>> & Omit<OutlineOptions<T>, 'getItemId'> & {
    /** IDs must be globally unique across every hierarchy level. */
    getRowId(item: T): string;
    getRowLabel(item: T): string;
};
export interface OutlineRow<T extends RowData> {
    row: PuppertinoRow<T>;
    position: number;
    siblingCount: number;
    parentId?: string;
}
export declare function visibleOutlineRows<T extends RowData>(rows: readonly PuppertinoRow<T>[], expanded: Readonly<Record<string, boolean>>): OutlineRow<T>[];
/** A resizable treegrid. Only the first data column exposes hierarchy; sorting stays within siblings. */
export declare function OutlineView<T extends RowData>(props: OutlineViewProps<T>): import("react").JSX.Element;
export {};
