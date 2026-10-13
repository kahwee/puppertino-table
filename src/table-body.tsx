'use client';
import type { RowData } from '@tanstack/react-table';
import { memo } from 'react';
import { RowSelectionCheckbox } from './row-selection-checkbox.js';
import { tableBehavior } from './table-behavior.js';
import type { PuppertinoBodyContext, TableBodyProps } from './table-types.js';

function RenderTableBody<T extends RowData>({
  table,
  selectable = false,
  disabled = false,
  getRowLabel,
  emptyContent = 'No rows',
  status = 'ready',
  loadingContent = 'Loading rows…',
  errorContent = 'Could not load rows.',
  getRowProps,
  getCellProps,
  leadingRows,
}: TableBodyProps<T>) {
  const rows = table.getRowModel().rows;
  const context: PuppertinoBodyContext<T> = {
    table,
    selectable,
    disabled,
    columnCount: table.getAllLeafColumns().length + (selectable ? 1 : 0),
  };
  return (
    <tbody aria-busy={status === 'loading' || undefined}>
      {status !== 'ready' && (
        <tr className="pt-state-row">
          <td colSpan={context.columnCount}>
            <div className="pt-state-message" role={status === 'error' ? 'alert' : 'status'}>
              {status === 'loading' && <span className="pt-loading-indicator" aria-hidden="true" />}
              {status === 'loading' ? loadingContent : errorContent}
            </div>
          </td>
        </tr>
      )}
      {typeof leadingRows === 'function' ? leadingRows(table, context) : leadingRows}
      {rows.length ? (
        rows.map((row) => {
          const props = getRowProps?.(row, context);
          const className =
            [row.getIsSelected() ? 'p-selected' : '', props?.className].filter(Boolean).join(' ') ||
            undefined;
          return (
            <tr {...props} key={row.id} className={className}>
              {selectable && (
                <td className="pt-selection">
                  <RowSelectionCheckbox
                    row={row}
                    label={getRowLabel?.(row.original)}
                    disabled={disabled}
                  />
                </td>
              )}
              {row.getAllCells().map((cell) => (
                <td {...getCellProps?.(cell, context)} key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          );
        })
      ) : status === 'ready' ? (
        <tr>
          <td colSpan={context.columnCount}>{emptyContent}</td>
        </tr>
      ) : null}
    </tbody>
  );
}
/** Geometry updates do not rerender cells; data and table state changes still do. */
const MemoTableBody = memo(RenderTableBody) as typeof RenderTableBody;

/** Resolve shared policy outside the memoized cells so policy changes still reach them. */
export function TableBody<T extends RowData>(props: TableBodyProps<T>) {
  const behavior = tableBehavior(props.table);
  return (
    <MemoTableBody
      {...props}
      selectable={props.selectable ?? (behavior.selectable && behavior.selectionCheckboxes)}
      disabled={behavior.disabled || !!props.disabled}
    />
  );
}
