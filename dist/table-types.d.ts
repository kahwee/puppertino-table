import type { RowData, Row, Cell } from '@tanstack/react-table';
import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import type { puppertinoTableFeatures, PuppertinoTableInstance } from './model.js';
import type { PuppertinoTableOptions } from './table-options.js';
import type { ColumnResizeOptions } from './resize-types.js';
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
export interface PuppertinoBodyOptions<T extends RowData> {
    selectable?: boolean;
    disabled?: boolean;
    getRowLabel?: (row: T) => string;
    emptyContent?: ReactNode;
    getRowProps?: (row: PuppertinoRow<T>, context: PuppertinoBodyContext<T>) => PuppertinoRowProps | undefined;
    getCellProps?: (cell: PuppertinoCell<T>, context: PuppertinoBodyContext<T>) => PuppertinoCellProps | undefined;
    /** Semantic <tr> elements before data rows, including when data is empty. */
    leadingRows?: ReactNode | ((table: PuppertinoTableInstance<T>, context: PuppertinoBodyContext<T>) => ReactNode);
}
export interface PuppertinoTableProps<T extends RowData> extends PuppertinoTableOptions<T>, PuppertinoBodyOptions<T> {
    resizable?: boolean;
    cancelMediaQuery?: string;
    ariaLabel: string;
    caption?: ReactNode;
    className?: string;
}
export interface TableHeaderProps<T extends RowData> {
    table: PuppertinoTableInstance<T>;
    selectable?: boolean;
    disabled?: boolean;
    resizable?: boolean;
    resizeOptions?: ColumnResizeOptions;
}
export interface TableBodyProps<T extends RowData> extends PuppertinoBodyOptions<T> {
    table: PuppertinoTableInstance<T>;
}
export interface RowSelectionCheckboxProps<T extends RowData> {
    row: PuppertinoRow<T>;
    /** Row description without the "Select" prefix. Defaults to the stable ID. */
    label?: string;
    disabled?: boolean;
}
