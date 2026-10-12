import type { RowData } from '@tanstack/react-table';
import type { RowSelectionCheckboxProps } from './table-types.js';
export type { RowSelectionCheckboxProps } from './table-types.js';
/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export declare function RowSelectionCheckbox<T extends RowData>({ row, label, disabled }: RowSelectionCheckboxProps<T>): import("react").JSX.Element;
