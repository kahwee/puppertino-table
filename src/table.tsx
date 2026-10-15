// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';

import type { RowData } from '@tanstack/react-table';
import { ColumnOrderProvider } from './column-order.js';
import { DensityScope } from './density.js';
import { tableBehavior } from './table-behavior.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import type { PuppertinoTableProps } from './table-types.js';
import { usePuppertinoTable } from './use-puppertino-table.js';

export function PuppertinoTable<T extends RowData>(props: PuppertinoTableProps<T>) {
  const {
    atoms,
    getRowLabel,
    columnSizing,
    onColumnSizingCommit,
    onColumnOrderCommit,
    storageKey,
    storage,
    cancelMediaQuery,
    ariaLabel,
    caption,
    emptyContent = 'No rows',
    status = 'ready',
    loadingContent,
    errorContent,
    className = '',
    density,
    densityMetrics,
    getRowProps,
    getCellProps,
    leadingRows,
    getHeaderMenu,
  } = props;
  const table = usePuppertinoTable(props);
  const behavior = tableBehavior(table);
  const showSelection = behavior.selectable && behavior.selectionCheckboxes;
  // Sizing subscribers update geometry; header controls keep their own narrow subscriptions.
  const header = (
    <TableHeader
      table={table}
      getHeaderMenu={getHeaderMenu}
      onColumnOrderCommit={onColumnOrderCommit}
      resizeOptions={{
        storageKey: columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
        storage,
        cancelMediaQuery,
        onCommit: onColumnSizingCommit,
      }}
    />
  );
  return (
    <DensityScope
      density={density}
      metrics={densityMetrics}
      className={`pt-scroll ${className}`}
      tabIndex={0}
      role="region"
      aria-label={`${ariaLabel} scroll area`}
    >
      <ColumnOrderProvider table={table} onCommit={onColumnOrderCommit}>
        <table.Subscribe source={table.options.atoms?.columnSizing ?? table.atoms.columnSizing}>
          {() => (
            <table
              className="p-table pt-table"
              aria-label={ariaLabel}
              aria-busy={status === 'loading' || undefined}
              style={{ width: table.getTotalSize() + (showSelection ? 36 : 0) }}
            >
              {caption && <caption>{caption}</caption>}
              <colgroup>
                {showSelection && <col style={{ width: 36 }} />}
                {table.getAllLeafColumns().map((column) => (
                  <col key={column.id} style={{ width: column.getSize() }} />
                ))}
              </colgroup>
              {header}
              <TableBody
                table={table}
                getRowLabel={getRowLabel}
                emptyContent={emptyContent}
                status={status}
                loadingContent={loadingContent}
                errorContent={errorContent}
                getRowProps={getRowProps}
                getCellProps={getCellProps}
                leadingRows={leadingRows}
              />
            </table>
          )}
        </table.Subscribe>
      </ColumnOrderProvider>
    </DensityScope>
  );
}
