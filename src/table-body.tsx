'use client';
import type { RowData } from '@tanstack/react-table';
import { memo, type Ref } from 'react';
import { RowSelectionCheckbox } from './row-selection-checkbox.js';
import { tableBehavior } from './table-behavior.js';
import type {
  PuppertinoBodyContext,
  PuppertinoRow,
  PuppertinoRowProps,
  TableBodyProps,
} from './table-types.js';

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
        rows.map((row) => (
          <TableDataRow<T>
            key={row.id}
            row={row}
            context={context}
            getRowLabel={getRowLabel}
            getRowProps={getRowProps}
            getCellProps={getCellProps}
          />
        ))
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

/** Shared native row rendering for the ordinary and virtual bodies. */
export function TableDataRow<T extends RowData>({
  row,
  context,
  getRowLabel,
  getRowProps,
  getCellProps,
  rowProps,
  rowRef,
}: {
  row: PuppertinoRow<T>;
  context: PuppertinoBodyContext<T>;
  getRowLabel?: TableBodyProps<T>['getRowLabel'];
  getRowProps?: TableBodyProps<T>['getRowProps'];
  getCellProps?: TableBodyProps<T>['getCellProps'];
  rowProps?: PuppertinoRowProps;
  rowRef?: Ref<HTMLTableRowElement>;
}) {
  const props = getRowProps?.(row, context);
  const className =
    [row.getIsSelected() ? 'p-selected' : '', props?.className, rowProps?.className]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <tr {...props} {...rowProps} ref={rowRef} className={className}>
      {context.selectable && (
        <td className="pt-selection">
          <RowSelectionCheckbox
            row={row}
            label={getRowLabel?.(row.original)}
            disabled={context.disabled}
          />
        </td>
      )}
      {row.getAllCells().map((cell) => (
        <td {...getCellProps?.(cell, context)} key={cell.id}>
          <context.table.FlexRender cell={cell} />
        </td>
      ))}
    </tr>
  );
}
