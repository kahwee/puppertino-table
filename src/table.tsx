// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';

import type { RowData } from '@tanstack/react-table';
import { useState } from 'react';
import { ColumnOrderProvider } from './column-order.js';
import { DensityScope } from './density.js';
import { tableBehavior } from './table-behavior.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import type { PuppertinoTableProps } from './table-types.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
import { VirtualTableBody } from './virtual-table-body.js';

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
    virtualization,
  } = props;
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  if (virtualization && leadingRows !== undefined)
    throw new Error(
      'Virtual tables do not support leadingRows. Use the ordinary TableBody for custom leading rows.',
    );
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
      ref={virtualization ? setScrollElement : undefined}
      style={virtualization ? { height: virtualization.height } : undefined}
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
              className={`p-table pt-table${virtualization ? ' pt-virtual-table' : ''}`}
              aria-label={ariaLabel}
              aria-rowcount={
                virtualization && table.getRowModel().rows.length > 0
                  ? table.getRowModel().rows.length +
                    table.getHeaderGroups().length +
                    (status !== 'ready' ? 1 : 0)
                  : undefined
              }
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
              {virtualization ? (
                <VirtualTableBody<T>
                  table={table}
                  scrollElement={scrollElement}
                  options={virtualization}
                  getRowLabel={getRowLabel}
                  getRowProps={getRowProps}
                  getCellProps={getCellProps}
                  status={status}
                  emptyContent={emptyContent}
                  loadingContent={loadingContent}
                  errorContent={errorContent}
                />
              ) : (
                <TableBody<T>
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
              )}
            </table>
          )}
        </table.Subscribe>
      </ColumnOrderProvider>
    </DensityScope>
  );
}
