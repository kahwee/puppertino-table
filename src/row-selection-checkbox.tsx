'use client';
import { type RowData, Subscribe } from '@tanstack/react-table';
import type { RowSelectionCheckboxProps } from './table-types.js';
import { useRowSelectionGestures } from './use-row-selection-gestures.js';

/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox<T extends RowData>({
  row,
  label,
  disabled = false,
  orderedIds,
}: RowSelectionCheckboxProps<T>) {
  const { select } = useRowSelectionGestures(row.table, { disabled, orderedIds });
  return (
    <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => !!selection[row.id]}>
      {(selected) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: The native input owns keyboard activation; this label only isolates bubbling.
        <label
          className="p-checkbox pt-selection-control"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            aria-label={`Select ${label ?? row.id}`}
            checked={selected}
            disabled={disabled || !row.getCanSelect()}
            onClick={(event) => {
              event.stopPropagation();
              select(row.id, {
                shift: event.shiftKey,
                toggle: !event.shiftKey || event.metaKey || event.ctrlKey,
              });
            }}
            onChange={() => {}}
          />
          <span aria-hidden="true" />
        </label>
      )}
    </Subscribe>
  );
}
