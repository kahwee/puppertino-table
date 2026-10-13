'use client';
import type { RowData } from '@tanstack/react-table';
import { ColumnResizeHandle } from './resize-handle.js';
import type { TableHeaderProps } from './table-types.js';

export function TableHeader<T extends RowData>({
  table,
  selectable = false,
  disabled = false,
  resizable = true,
  resizeOptions,
}: TableHeaderProps<T>) {
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
              <span className="pt-sr-only">Select rows</span>
            </th>
          )}
          {group.headers.map((header) => {
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
                {!header.isPlaceholder &&
                  (column.getCanSort() ? (
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
                  ))}
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
