"use client";
import type { RowData } from '@tanstack/react-table';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { useTable, type SortingState, type RowSelectionState, type OnChangeFn } from '@tanstack/react-table';
import { puppertinoTableFeatures, type PuppertinoTableInstance, type PuppertinoColumnDef } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';
import { useColumnResize } from './use-column-resize.js';

export interface PuppertinoTableProps<T extends RowData> {
  data: readonly T[];
  columns: readonly PuppertinoColumnDef<T>[];
  getRowId: (row: T, index: number) => string;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  /** True for server-owned order/pagination; false enables local TanStack sorting. */
  manualSorting?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowLabel?: (row: T) => string;
  selectable?: boolean;
  disabled?: boolean;
  resizable?: boolean;
  storageKey?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  cancelMediaQuery?: string;
  ariaLabel: string;
  caption?: ReactNode;
  emptyContent?: ReactNode;
  className?: string;
}

export function PuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting, onSortingChange, manualSorting = true,
  rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable = false, disabled = false,
  resizable = true, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '' }: PuppertinoTableProps<T>) {
  const [localSelection, setLocalSelection] = useState<RowSelectionState>({});
  const rowSelection = controlledSelection ?? localSelection;
  const canSelect = selectable && !disabled && (controlledSelection === undefined || !!onRowSelectionChange);
  const bounds = useMemo(() => columnSizeBounds(columns), [columns]);
  const sizedColumns = useMemo(() => {
    const byId = new Map(bounds.map(bound => [bound.id, bound]));
    const decorate = (defs: readonly PuppertinoColumnDef<T>[]): PuppertinoColumnDef<T>[] => defs.map(def => {
      if ('columns' in def && def.columns) return { ...def, columns: decorate(def.columns) };
      const id = def.id ?? ('accessorKey' in def ? String(def.accessorKey).replaceAll('.', '_') : '');
      return { ...def, ...byId.get(id) };
    });
    return decorate(columns);
  }, [columns, bounds]);
  const [initialWidths] = useState(() => {
    try { return readColumnSizing(bounds, storageKey, storage || localStorage); } catch { return readColumnSizing(bounds); }
  });
  const table = useTable({ features: puppertinoTableFeatures, columns: sizedColumns, data, getRowId,
    manualSorting, enableMultiSort: false, enableSortingRemoval: false, enableRowSelection: canSelect,
    enableSubRowSelection: false, initialState: { columnSizing: initialWidths },
    state: { sorting, rowSelection }, onSortingChange, onRowSelectionChange: onRowSelectionChange ?? setLocalSelection,
  }, state => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
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
      <MemoTableBody table={table} selectable={selectable} getRowLabel={getRowLabel} emptyContent={emptyContent} />
    </table>}</table.Subscribe>
  </div>;
}

/** Geometry updates do not rerender cells. State and data changes still do. */
function TableBody<T extends RowData>({ table, selectable, getRowLabel, emptyContent }: {
  table: PuppertinoTableInstance<T>; selectable: boolean; getRowLabel?: (row: T) => string; emptyContent: ReactNode;
}) {
  const rows = table.getRowModel().rows;
  return <tbody>{rows.length ? rows.map(row => <tr key={row.id} className={row.getIsSelected() ? 'p-selected' : undefined}>
    {selectable && <td className="pt-selection"><input type="checkbox" aria-label={`Select ${getRowLabel?.(row.original) ?? row.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()}
      onClick={event => { event.stopPropagation(); row.getToggleSelectedHandler()(event); }} onChange={() => {}} /></td>}
    {row.getAllCells().map(cell => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}
  </tr>) : <tr><td colSpan={table.getAllLeafColumns().length + (selectable ? 1 : 0)}>{emptyContent}</td></tr>}</tbody>;
}
const MemoTableBody = memo(TableBody) as typeof TableBody;
