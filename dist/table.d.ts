import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableProps } from './table-types.js';
export type { PuppertinoBodyContext, PuppertinoCell, PuppertinoCellProps, PuppertinoDataAttributes, PuppertinoRow, PuppertinoRowProps, PuppertinoTableProps, } from './table-types.js';
export declare function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting, rowSelection, onRowSelectionChange, getRowLabel, selectable, disabled, resizable, columnSizing, onColumnSizingChange, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent, className, getRowProps, getCellProps, leadingRows, }: PuppertinoTableProps<T>): import("react").JSX.Element;
