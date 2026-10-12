"use client";
import type { RowData, SortingState, RowSelectionState, OnChangeFn } from '@tanstack/react-table';
import { useTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { puppertinoTableFeatures, type PuppertinoColumnDef, type PuppertinoTableInstance } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';

export interface PuppertinoTableOptions<T extends RowData> {
  data: readonly T[];
  columns: readonly PuppertinoColumnDef<T>[];
  getRowId: (row: T, index: number) => string;
  /** Omit for local state. Supply a callback alongside controlled sorting to allow edits. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  initialSorting?: SortingState;
  initialRowSelection?: RowSelectionState;
  /** Preserve host-owned order by default, including server-paginated data. */
  manualSorting?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  selectable?: boolean;
  disabled?: boolean;
  storageKey?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** Shared state wiring for complete tables and custom semantic layouts. */
export function usePuppertinoTable<T extends RowData>({ data, columns, getRowId, sorting: controlledSorting, onSortingChange, initialSorting = [], initialRowSelection = {},
  manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, selectable = false,
  disabled = false, storageKey, storage }: PuppertinoTableOptions<T>): PuppertinoTableInstance<T> {
  const [localSelection, setLocalSelection] = useState<RowSelectionState>(() => initialRowSelection);
  const [localSorting, setLocalSorting] = useState<SortingState>(() => initialSorting);
  const sorting = controlledSorting ?? localSorting;
  const changeSorting = useCallback<OnChangeFn<SortingState>>(update => {
    if (controlledSorting === undefined) setLocalSorting(update);
    onSortingChange?.(update);
  }, [controlledSorting, onSortingChange]);
  const changeSelection = useCallback<OnChangeFn<RowSelectionState>>(update => {
    if (controlledSelection === undefined) setLocalSelection(update);
    onRowSelectionChange?.(update);
  }, [controlledSelection, onRowSelectionChange]);
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
    manualSorting, enableSorting: controlledSorting === undefined || !!onSortingChange, enableMultiSort: false, enableSortingRemoval: false, enableRowSelection: canSelect,
    enableSubRowSelection: false, initialState: { columnSizing: initialWidths },
    state: { sorting, rowSelection }, onSortingChange: changeSorting, onRowSelectionChange: changeSelection,
  }, state => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
  return table;
}
