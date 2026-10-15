'use client';
import { useSelector } from '@tanstack/react-store';
import type { RowData } from '@tanstack/react-table';
import { makeStateUpdater, useTable } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';
import {
  type PuppertinoColumnDef,
  type PuppertinoTableInstance,
  puppertinoTableFeatures,
} from './model.js';
import { selectionAnchorFor } from './selection-anchor.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';

import { validateAtomIdentity, validateAtomOwnership } from './state-ownership.js';
import { tableDefaults } from './table-behavior.js';
import type { PuppertinoTableOptions } from './table-options.js';
import { useColumnSizingPersistence } from './use-column-sizing-persistence.js';

/** Shared state wiring for complete tables and custom semantic layouts. */
export function usePuppertinoTable<T extends RowData>({
  data,
  columns,
  atoms,
  getRowId,
  getSubRows,
  sorting: controlledSorting,
  onSortingChange,
  initialSorting = [],
  initialRowSelection = {},
  manualSorting = tableDefaults.manualSorting,
  rowSelection: controlledSelection,
  onRowSelectionChange,
  selectable = tableDefaults.selectable,
  selectionAnchor,
  isRowSelectable,
  disabled = tableDefaults.disabled,
  columnSizing,
  onColumnSizingChange,
  columnOrder,
  onColumnOrderChange,
  initialColumnOrder = [],
  reorderable = false,
  lockedColumns = tableDefaults.lockedColumns,
  selectionCheckboxes = tableDefaults.selectionCheckboxes,
  resizable = tableDefaults.resizable,
  storageKey,
  storage,
}: PuppertinoTableOptions<T>): PuppertinoTableInstance<T> {
  const mountedAtoms = useRef(atoms ? { ...atoms } : undefined);
  validateAtomIdentity(mountedAtoms.current, atoms);
  validateAtomOwnership({
    atoms,
    sorting: controlledSorting,
    onSortingChange,
    rowSelection: controlledSelection,
    onRowSelectionChange,
    columnSizing,
    onColumnSizingChange,
    columnOrder,
    onColumnOrderChange,
  });
  const atomSorting = !!atoms?.sorting;
  const atomSelection = !!atoms?.rowSelection;
  const canSelect =
    selectable &&
    !disabled &&
    (atomSelection || controlledSelection === undefined || !!onRowSelectionChange);
  const bounds = useMemo(() => columnSizeBounds(columns), [columns]);
  const sizedColumns = useMemo(() => {
    const byId = new Map(bounds.map((bound) => [bound.id, bound]));
    const decorate = (defs: readonly PuppertinoColumnDef<T>[]): PuppertinoColumnDef<T>[] =>
      defs.map((def) => {
        if ('columns' in def && def.columns) return { ...def, columns: decorate(def.columns) };
        const id =
          def.id ?? ('accessorKey' in def ? String(def.accessorKey).replaceAll('.', '_') : '');
        return { ...def, ...byId.get(id) };
      });
    return decorate(columns);
  }, [columns, bounds]);
  const appOwnedSizing = columnSizing !== undefined || !!atoms?.columnSizing;
  const table = useTable(
    {
      features: puppertinoTableFeatures,
      atoms,
      columns: sizedColumns,
      data,
      getRowId,
      getSubRows,
      manualSorting,
      enableSorting:
        !disabled && (atomSorting || controlledSorting === undefined || !!onSortingChange),
      meta: {
        puppertino: {
          selectable,
          selectionCheckboxes,
          disabled,
          reorderable:
            reorderable && !disabled && (columnOrder === undefined || !!onColumnOrderChange),
          lockedColumns,
          resizable:
            resizable && !disabled && (columnSizing === undefined || !!onColumnSizingChange),
        },
      },
      enableMultiSort: false,
      enableSortingRemoval: false,
      enableRowSelection:
        canSelect && (isRowSelectable ? (row) => isRowSelectable(row.original) : true),
      enableSubRowSelection: false,
      initialState: {
        ...(!atoms?.columnOrder && columnOrder === undefined
          ? { columnOrder: initialColumnOrder }
          : {}),
        ...(!atomSorting && controlledSorting === undefined ? { sorting: initialSorting } : {}),
        ...(!atomSelection && controlledSelection === undefined
          ? { rowSelection: initialRowSelection }
          : {}),
        ...(!appOwnedSizing ? { columnSizing: readColumnSizing(bounds) } : {}),
      },
      state: {
        ...(columnOrder !== undefined ? { columnOrder } : {}),
        ...(controlledSorting !== undefined ? { sorting: controlledSorting } : {}),
        ...(controlledSelection !== undefined ? { rowSelection: controlledSelection } : {}),
        ...(columnSizing !== undefined ? { columnSizing } : {}),
      },
      onColumnOrderChange: (update) => {
        if (columnOrder === undefined) makeStateUpdater('columnOrder', table)(update);
        onColumnOrderChange?.(update);
      },
      onColumnSizingChange: (update) => {
        if (columnSizing === undefined) makeStateUpdater('columnSizing', table)(update);
        onColumnSizingChange?.(update);
      },
      onSortingChange: (update) => {
        if (controlledSorting === undefined) makeStateUpdater('sorting', table)(update);
        onSortingChange?.(update);
      },
      onRowSelectionChange: (update) => {
        if (controlledSelection === undefined) makeStateUpdater('rowSelection', table)(update);
        onRowSelectionChange?.(update);
      },
    },
    (state) => ({
      sorting: state.sorting,
      rowSelection: state.rowSelection,
    }),
  );
  selectionAnchorFor(table.atoms.rowSelection, selectionAnchor);
  // Structural order changes must refresh cells as well as the locally updated header.
  const observedOrder = useSelector(atoms?.columnOrder ?? table.baseAtoms.columnOrder);
  const instance: PuppertinoTableInstance<T> = {
    ...table,
    state: { ...table.state, columnOrder: columnOrder ?? observedOrder },
  };
  useColumnSizingPersistence({
    table: instance,
    bounds,
    appOwned: appOwnedSizing,
    storageKey,
    storage,
  });
  return instance;
}
