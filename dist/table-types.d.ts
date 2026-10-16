import type { Cell, ColumnOrderState, Row, RowData } from '@tanstack/react-table';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { ContextMenuItem } from './context-menu.js';
import type { DensityMetrics, TableDensity } from './density.js';
import type { PuppertinoTableInstance, puppertinoTableFeatures } from './model.js';
import type { ColumnResizeOptions } from './resize-types.js';
import type { PuppertinoTableOptions } from './table-options.js';
export type PuppertinoHeaderMenu<T extends RowData> = (column: ReturnType<PuppertinoTableInstance<T>['getAllLeafColumns']>[number]) => readonly ContextMenuItem[];
export type PuppertinoRow<T extends RowData> = Row<typeof puppertinoTableFeatures, T>;
export type PuppertinoCell<T extends RowData> = Cell<typeof puppertinoTableFeatures, T>;
export type PuppertinoDataAttributes = {
    [key: `data-${string}`]: string | number | boolean | null | undefined;
};
export interface PuppertinoBodyContext<T extends RowData> {
    table: PuppertinoTableInstance<T>;
    /** Leaf columns plus the optional selection column. */
    columnCount: number;
    selectable: boolean;
    disabled: boolean;
}
export type PuppertinoRowProps = PuppertinoDataAttributes & Omit<ComponentPropsWithoutRef<'tr'>, 'children' | 'dangerouslySetInnerHTML'>;
export type PuppertinoCellProps = PuppertinoDataAttributes & Omit<ComponentPropsWithoutRef<'td'>, 'children' | 'dangerouslySetInnerHTML'>;
export type TableStatus = 'ready' | 'loading' | 'error';
export interface PuppertinoBodyOptions<T extends RowData> {
    /** Request state is app-owned. Existing rows remain visible during refresh/errors. */
    status?: TableStatus;
    loadingContent?: ReactNode;
    /** May include the app's retry button; defaults to a readable error message. */
    errorContent?: ReactNode;
    /** Omit to inherit selection-column visibility from the hook. */
    selectable?: boolean;
    /** Omit to inherit the hook policy; true additionally disables body controls. */
    disabled?: boolean;
    getRowLabel?: (row: T) => string;
    emptyContent?: ReactNode;
    getRowProps?: (row: PuppertinoRow<T>, context: PuppertinoBodyContext<T>) => PuppertinoRowProps | undefined;
    getCellProps?: (cell: PuppertinoCell<T>, context: PuppertinoBodyContext<T>) => PuppertinoCellProps | undefined;
    /** Semantic <tr> elements before data rows, including when data is empty. */
    leadingRows?: ReactNode | ((table: PuppertinoTableInstance<T>, context: PuppertinoBodyContext<T>) => ReactNode);
}
export interface TableVirtualizationOptions {
    /** Bounded vertical scroll viewport in pixels. */
    height: number;
    /** Initial estimate; actual row heights are measured, including density changes. Default 32. */
    estimateRowHeight?: number;
    /** Extra rows above/below the viewport. Default 5. */
    overscan?: number;
}
export type PuppertinoTableProps<T extends RowData> = PuppertinoTableOptions<T> & PuppertinoBodyOptions<T> & {
    /** Opt-in row virtualization. Supplied data remains app-owned; leadingRows is unsupported. */
    virtualization?: TableVirtualizationOptions;
    /** Completed header drop; cancelled drags never commit. */
    onColumnOrderCommit?: (order: ColumnOrderState) => void;
    /** Completed resize/reset snapshot; previews and cancelled gestures never commit. */
    onColumnSizingCommit?: ColumnResizeOptions['onCommit'];
    /** Cancel an unfinished drag when this media query matches. */
    cancelMediaQuery?: string;
    /** Accessible name for the table and its horizontal scroll region. */
    ariaLabel: string;
    caption?: ReactNode;
    className?: string;
    /** Optional header commands; the app owns column visibility and sorting policy. */
    getHeaderMenu?: PuppertinoHeaderMenu<T>;
    /** Inherits the enclosing DensityScope when omitted. */
    density?: TableDensity;
    densityMetrics?: DensityMetrics;
};
export interface TableHeaderProps<T extends RowData> {
    table: PuppertinoTableInstance<T>;
    selectable?: boolean;
    disabled?: boolean;
    resizable?: boolean;
    resizeOptions?: ColumnResizeOptions;
    /** Override bulk-selection scope with the visible outline rows. */
    selectionRows?: readonly PuppertinoRow<T>[];
    onColumnOrderCommit?: (order: ColumnOrderState) => void;
    getHeaderMenu?: PuppertinoHeaderMenu<T>;
}
export interface TableBodyProps<T extends RowData> extends PuppertinoBodyOptions<T> {
    table: PuppertinoTableInstance<T>;
}
export interface RowSelectionCheckboxProps<T extends RowData> {
    row: PuppertinoRow<T>;
    /** Row description without the "Select" prefix. Defaults to the stable ID. */
    label?: string;
    /** Visible outline order for Shift ranges. */
    orderedIds?: readonly string[];
    disabled?: boolean;
}
