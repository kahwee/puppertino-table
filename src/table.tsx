// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import type { RowData } from '@tanstack/react-table';
import { DensityScope } from './density.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import type { PuppertinoTableProps } from './table-types.js';
import { usePuppertinoTable } from './use-puppertino-table.js';

export function PuppertinoTable<T extends RowData>({
  data,
  columns,
  atoms,
  getRowId,
  sorting,
  onSortingChange,
  initialSorting,
  initialRowSelection,
  manualSorting = true,
  rowSelection,
  onRowSelectionChange,
  getRowLabel,
  selectable = false,
  disabled = false,
  resizable = true,
  columnSizing,
  onColumnSizingChange,
  storageKey,
  storage,
  cancelMediaQuery,
  ariaLabel,
  caption,
  emptyContent = 'No rows',
  className = '',
  density,
  densityMetrics,
  getRowProps,
  getCellProps,
  leadingRows,
}: PuppertinoTableProps<T>) {
  const table = usePuppertinoTable({
    data,
    columns,
    atoms,
    getRowId,
    sorting,
    onSortingChange,
    initialSorting,
    initialRowSelection,
    manualSorting,
    rowSelection,
    onRowSelectionChange,
    selectable,
    disabled,
    columnSizing,
    onColumnSizingChange,
    storageKey,
    storage,
  });
  return (
    <DensityScope
      density={density}
      metrics={densityMetrics}
      className={`pt-scroll ${className}`}
      tabIndex={0}
      role="region"
      aria-label={`${ariaLabel} scroll area`}
    >
      <table.Subscribe source={table.atoms.columnSizing}>
        {() => (
          <table
            className="p-table pt-table"
            aria-label={ariaLabel}
            style={{ width: table.getTotalSize() + (selectable ? 36 : 0) }}
          >
            {caption && <caption>{caption}</caption>}
            <colgroup>
              {selectable && <col style={{ width: 36 }} />}
              {table.getAllLeafColumns().map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
            <TableHeader
              table={table}
              selectable={selectable}
              disabled={disabled}
              resizable={resizable && (columnSizing === undefined || !!onColumnSizingChange)}
              resizeOptions={{
                storageKey:
                  columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
                storage,
                cancelMediaQuery,
              }}
            />
            <TableBody
              table={table}
              selectable={selectable}
              disabled={disabled}
              getRowLabel={getRowLabel}
              emptyContent={emptyContent}
              getRowProps={getRowProps}
              getCellProps={getCellProps}
              leadingRows={leadingRows}
            />
          </table>
        )}
      </table.Subscribe>
    </DensityScope>
  );
}
