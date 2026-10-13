// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import type { RowData } from '@tanstack/react-table';
import { DensityScope } from './density.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import type { PuppertinoTableProps } from './table-types.js';
import { usePuppertinoTable } from './use-puppertino-table.js';

export function PuppertinoTable<T extends RowData>(props: PuppertinoTableProps<T>) {
  const {
    atoms,
    getRowLabel,
    selectable = false,
    selectionCheckboxes = true,
    disabled = false,
    resizable = true,
    columnSizing,
    onColumnSizingChange,
    onColumnSizingCommit,
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
  } = props;
  const table = usePuppertinoTable(props);
  const showSelection = selectable && selectionCheckboxes;
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
            style={{ width: table.getTotalSize() + (showSelection ? 36 : 0) }}
          >
            {caption && <caption>{caption}</caption>}
            <colgroup>
              {showSelection && <col style={{ width: 36 }} />}
              {table.getAllLeafColumns().map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
            <TableHeader
              table={table}
              selectable={showSelection}
              disabled={disabled}
              resizable={resizable && (columnSizing === undefined || !!onColumnSizingChange)}
              resizeOptions={{
                storageKey:
                  columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
                storage,
                cancelMediaQuery,
                onCommit: onColumnSizingCommit,
              }}
            />
            <TableBody
              table={table}
              selectable={showSelection}
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
