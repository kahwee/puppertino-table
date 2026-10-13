'use client';
import { type RowData, Subscribe } from '@tanstack/react-table';
import { ColumnResizeHandle } from './resize-handle.js';
import { selectionAnchorFor } from './selection-anchor.js';
import { tableBehavior } from './table-behavior.js';
import type { TableHeaderProps } from './table-types.js';

export function TableHeader<T extends RowData>({
  table,
  selectable: selectionOverride,
  disabled: disabledOverride,
  resizable: resizeOverride,
  resizeOptions,
}: TableHeaderProps<T>) {
  const behavior = tableBehavior(table);
  const selectable = selectionOverride ?? (behavior.selectable && behavior.selectionCheckboxes);
  const disabled = behavior.disabled || !!disabledOverride;
  const resizable = behavior.resizable && resizeOverride !== false;
  const groups = table.getHeaderGroups();
  const options = {
    ...resizeOptions,
    enabled: resizable && !disabled && resizeOptions?.enabled !== false,
  };
  return (
    <thead>
      {groups.map((group, index) => (
        <tr key={group.id}>
          {selectable && index === 0 && (
            <th className="pt-selection" rowSpan={groups.length} scope="col">
              <Subscribe source={table.atoms.rowSelection}>
                {(selection) => {
                  const rows = table.getRowModel().rows.filter((row) => row.getCanSelect());
                  const selected = rows.filter((row) => selection[row.id]).length;
                  const checked = rows.length > 0 && selected === rows.length;
                  const mixed = selected > 0 && !checked;
                  return (
                    <label className="p-checkbox pt-selection-control">
                      <input
                        type="checkbox"
                        aria-label="Select all visible rows"
                        aria-checked={mixed ? 'mixed' : checked}
                        checked={checked}
                        disabled={disabled || rows.length === 0}
                        ref={(input) => {
                          if (input) input.indeterminate = mixed;
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          if (!disabled && rows.length > 0) {
                            selectionAnchorFor(table.atoms.rowSelection).current = null;
                            table.toggleAllPageRowsSelected(event.target.checked);
                          }
                        }}
                      />
                      <span aria-hidden="true" />
                    </label>
                  );
                }}
              </Subscribe>
            </th>
          )}
          {group.headers.map((header) => {
            if (header.isPlaceholder) return <td key={header.id} colSpan={header.colSpan} />;
            const column = header.column;
            const label =
              typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
            const sorted = column.getIsSorted();
            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                scope={column.columns.length === 0 ? 'col' : 'colgroup'}
                aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {column.getCanSort() ? (
                  <button
                    type="button"
                    className="pt-sort"
                    aria-label={`Sort by ${label}`}
                    disabled={disabled}
                    onClick={() => column.toggleSorting()}
                  >
                    <table.FlexRender header={header} />
                    <span
                      className="pt-sort-arrow"
                      aria-hidden="true"
                      data-direction={sorted || 'none'}
                    >
                      ⌄
                    </span>
                  </button>
                ) : (
                  <table.FlexRender header={header} />
                )}
                {options.enabled && (
                  <ColumnResizeHandle
                    table={table}
                    header={header}
                    label={label}
                    options={options}
                  />
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
