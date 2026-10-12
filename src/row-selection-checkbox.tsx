"use client";
import type { RowData } from '@tanstack/react-table';
import type { RowSelectionCheckboxProps } from './table-types.js';
export type { RowSelectionCheckboxProps } from './table-types.js';
/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox<T extends RowData>({ row, label, disabled = false }: RowSelectionCheckboxProps<T>) {
  return <input type="checkbox" aria-label={`Select ${label ?? row.id}`} checked={row.getIsSelected()} disabled={disabled || !row.getCanSelect()}
    onClick={event => { event.stopPropagation(); row.getToggleSelectedHandler()(event); }} onChange={() => {}} />;
}
