'use client';
import { type RowData, Subscribe } from '@tanstack/react-table';
import type { RowSelectionCheckboxProps } from './table-types.js';

/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox<T extends RowData>({
  row,
  label,
  disabled = false,
}: RowSelectionCheckboxProps<T>) {
  return (
    <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => !!selection[row.id]}>
      {(selected) => (
        <input
          type="checkbox"
          aria-label={`Select ${label ?? row.id}`}
          checked={selected}
          disabled={disabled || !row.getCanSelect()}
          onClick={(event) => {
            event.stopPropagation();
            row.getToggleSelectedHandler()(event);
          }}
          onChange={() => {}}
        />
      )}
    </Subscribe>
  );
}
