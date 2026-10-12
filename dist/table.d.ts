import type { RowData, Row, Cell } from '@tanstack/react-table';
import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { puppertinoTableFeatures, type PuppertinoTableInstance } from './model.js';
import { type PuppertinoTableOptions } from './use-puppertino-table.js';
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
export interface PuppertinoTableProps<T extends RowData> extends PuppertinoTableOptions<T> {
    getRowLabel?: (row: T) => string;
    resizable?: boolean;
    cancelMediaQuery?: string;
    ariaLabel: string;
    caption?: ReactNode;
    emptyContent?: ReactNode;
    className?: string;
    getRowProps?: (row: PuppertinoRow<T>, context: PuppertinoBodyContext<T>) => PuppertinoRowProps | undefined;
    getCellProps?: (cell: PuppertinoCell<T>, context: PuppertinoBodyContext<T>) => PuppertinoCellProps | undefined;
    /** Render semantic <tr> elements before data rows, including when data is empty. */
    leadingRows?: ReactNode | ((table: PuppertinoTableInstance<T>, context: PuppertinoBodyContext<T>) => ReactNode);
}
export declare function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting, rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable, disabled, resizable, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent, className, getRowProps, getCellProps, leadingRows }: PuppertinoTableProps<T>): import("react").JSX.Element;
