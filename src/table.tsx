"use client";
import type { RowData, Row, Cell } from '@tanstack/react-table';
import { memo, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { puppertinoTableFeatures, type PuppertinoTableInstance } from './model.js';
import { usePuppertinoTable, type PuppertinoTableOptions } from './use-puppertino-table.js';
import { useColumnResize } from './use-column-resize.js';

export type PuppertinoRow<T extends RowData> = Row<typeof puppertinoTableFeatures, T>;
export type PuppertinoCell<T extends RowData> = Cell<typeof puppertinoTableFeatures, T>;
export type PuppertinoDataAttributes = { [key: `data-${string}`]: string | number | boolean | null | undefined };
export interface PuppertinoBodyContext<T extends RowData> {
  table: PuppertinoTableInstance<T>;
  /** Leaf columns plus the optional selection column. */
  columnCount: number;
  selectable: boolean;
  disabled: boolean;
}
export type PuppertinoRowProps = PuppertinoDataAttributes & Omit<ComponentPropsWithoutRef<'tr'>, 'children' | 'dangerouslySetInnerHTML'>;
export type PuppertinoCellProps = PuppertinoDataAttributes & Omit<ComponentPropsWithoutRef<'td'>, 'children' | 'dangerouslySetInnerHTML'>;

export interface PuppertinoTableProps<T extends RowData> extends PuppertinoTableOptions<T> {
  getRowLabel?: (row: T) => string;
  resizable?: boolean;
  cancelMediaQuery?: string;
  ariaLabel: string;
  caption?: ReactNode;
  emptyContent?: ReactNode;
  className?: string;
  getRowProps?: (row: PuppertinoRow<T>, context: PuppertinoBodyContext<T>) => PuppertinoRowProps | undefined;
  getCellProps?: (cell: PuppertinoCell<T>, context: PuppertinoBodyContext<T>) => PuppertinoCellProps | undefined;
  /** Render semantic <tr> elements before data rows, including when data is empty. */
  leadingRows?: ReactNode | ((table: PuppertinoTableInstance<T>, context: PuppertinoBodyContext<T>) => ReactNode);
}

export function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting = true,
  rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable = false, disabled = false,
  resizable = true, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '', getRowProps, getCellProps, leadingRows }: PuppertinoTableProps<T>) {
  const table = usePuppertinoTable({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting,
    rowSelection: controlledSelection, onRowSelectionChange, selectable, disabled, storageKey, storage });
  const options = { enabled: resizable && !disabled, storageKey, storage, cancelMediaQuery };
  const { handle } = useColumnResize(table, options);
  const groups = table.getHeaderGroups();
  return <div className={`pt-scroll ${className}`} tabIndex={0} role="region" aria-label={`${ariaLabel} scroll area`}>
    <table.Subscribe source={table.atoms.columnSizing}>{() => <table className="p-table pt-table" aria-label={ariaLabel} style={{ width: table.getTotalSize() + (selectable ? 36 : 0) }}>
      {caption && <caption>{caption}</caption>}
      <colgroup>{selectable && <col style={{ width: 36 }} />}{table.getAllLeafColumns().map(column => <col key={column.id} style={{ width: column.getSize() }} />)}</colgroup>
      <thead>{groups.map((group, index) => <tr key={group.id}>
        {selectable && index === 0 && <th className="pt-selection" rowSpan={groups.length} scope="col"><span className="pt-sr-only">Select rows</span></th>}
        {group.headers.map(header => {
          const column = header.column;
          const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
          const sorted = column.getIsSorted();
          const leaf = column.columns.length === 0;
          return <th key={header.id} colSpan={header.colSpan} scope={leaf ? 'col' : 'colgroup'} aria-sort={sorted ? sorted === 'asc' ? 'ascending' : 'descending' : undefined}>
            {!header.isPlaceholder && (column.getCanSort() ? <button type="button" className="pt-sort" aria-label={`Sort by ${label}`} disabled={disabled} onClick={() => column.toggleSorting()}>
              <table.FlexRender header={header} /><span className="pt-sort-arrow" aria-hidden="true" data-direction={sorted || 'none'}>⌄</span>
            </button> : <table.FlexRender header={header} />)}
            {leaf && !header.isPlaceholder && resizable && !disabled && <span className="pt-resizer" role="separator" tabIndex={0} aria-orientation="vertical" aria-label={`Resize ${label} column`}
              aria-valuemin={column.columnDef.minSize} aria-valuemax={column.columnDef.maxSize} aria-valuenow={header.getSize()} aria-valuetext={`${header.getSize()} pixels`}
              title="Drag to resize. Double-click or Enter to reset. Arrows adjust width; Escape cancels a drag." {...handle(column.id)} />}
          </th>;
        })}
      </tr>)}</thead>
      <MemoTableBody table={table} selectable={selectable} disabled={disabled} getRowLabel={getRowLabel} emptyContent={emptyContent} getRowProps={getRowProps} getCellProps={getCellProps} leadingRows={leadingRows} />
    </table>}</table.Subscribe>
  </div>;
}

/** Geometry updates do not rerender cells. State and data changes still do. */
function TableBody<T extends RowData>({ table, selectable, disabled, getRowLabel, emptyContent, getRowProps, getCellProps, leadingRows }: {
  table: PuppertinoTableInstance<T>; selectable: boolean; disabled: boolean; getRowLabel?: (row: T) => string; emptyContent: ReactNode;
  getRowProps?: PuppertinoTableProps<T>['getRowProps']; getCellProps?: PuppertinoTableProps<T>['getCellProps'];
  leadingRows?: PuppertinoTableProps<T>['leadingRows'];
}) {
  const rows = table.getRowModel().rows;
  const context = { table, selectable, disabled, columnCount: table.getAllLeafColumns().length + (selectable ? 1 : 0) };
  return <tbody>{typeof leadingRows === 'function' ? leadingRows(table, context) : leadingRows}
    {rows.length ? rows.map(row => {
      const props = getRowProps?.(row, context);
      const className = [row.getIsSelected() ? 'p-selected' : '', props?.className].filter(Boolean).join(' ') || undefined;
      return <tr {...props} key={row.id} className={className}>
        {selectable && <td className="pt-selection"><input type="checkbox" aria-label={`Select ${getRowLabel?.(row.original) ?? row.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()}
          onClick={event => { event.stopPropagation(); row.getToggleSelectedHandler()(event); }} onChange={() => {}} /></td>}
        {row.getAllCells().map(cell => <td {...getCellProps?.(cell, context)} key={cell.id}><table.FlexRender cell={cell} /></td>)}
      </tr>;
    }) : <tr><td colSpan={context.columnCount}>{emptyContent}</td></tr>}
  </tbody>;
}
const MemoTableBody = memo(TableBody) as typeof TableBody;
