import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableProps } from './table-types.js';
export type { PuppertinoTableProps, PuppertinoRow, PuppertinoCell, PuppertinoRowProps, PuppertinoCellProps, PuppertinoDataAttributes, PuppertinoBodyContext } from './table-types.js';
export declare function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting, rowSelection, onRowSelectionChange, getRowLabel, selectable, disabled, resizable, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent, className, getRowProps, getCellProps, leadingRows }: PuppertinoTableProps<T>): import("react").JSX.Element;
