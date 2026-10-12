'use client';
import { makeStateUpdater, useTable } from '@tanstack/react-table';
import { useMemo, useRef } from 'react';
import { puppertinoTableFeatures, } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';
import { validateAtomIdentity, validateAtomOwnership } from './state-ownership.js';
import { useColumnSizingPersistence } from './use-column-sizing-persistence.js';
/** Shared state wiring for complete tables and custom semantic layouts. */
export function usePuppertinoTable({ data, columns, atoms, getRowId, sorting: controlledSorting, onSortingChange, initialSorting = [], initialRowSelection = {}, manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, selectable = false, disabled = false, columnSizing, onColumnSizingChange, storageKey, storage, }) {
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
    });
    const atomSorting = !!atoms?.sorting;
    const atomSelection = !!atoms?.rowSelection;
    const canSelect = selectable &&
        !disabled &&
        (atomSelection || controlledSelection === undefined || !!onRowSelectionChange);
    const bounds = useMemo(() => columnSizeBounds(columns), [columns]);
    const sizedColumns = useMemo(() => {
        const byId = new Map(bounds.map((bound) => [bound.id, bound]));
        const decorate = (defs) => defs.map((def) => {
            if ('columns' in def && def.columns)
                return { ...def, columns: decorate(def.columns) };
            const id = def.id ?? ('accessorKey' in def ? String(def.accessorKey).replaceAll('.', '_') : '');
            return { ...def, ...byId.get(id) };
        });
        return decorate(columns);
    }, [columns, bounds]);
    const appOwnedSizing = columnSizing !== undefined || !!atoms?.columnSizing;
    const table = useTable({
        features: puppertinoTableFeatures,
        atoms,
        columns: sizedColumns,
        data,
        getRowId,
        manualSorting,
        enableSorting: atomSorting || controlledSorting === undefined || !!onSortingChange,
        enableMultiSort: false,
        enableSortingRemoval: false,
        enableRowSelection: canSelect,
        enableSubRowSelection: false,
        initialState: {
            ...(!atomSorting && controlledSorting === undefined ? { sorting: initialSorting } : {}),
            ...(!atomSelection && controlledSelection === undefined
                ? { rowSelection: initialRowSelection }
                : {}),
            ...(!appOwnedSizing ? { columnSizing: readColumnSizing(bounds) } : {}),
        },
        state: {
            ...(controlledSorting !== undefined ? { sorting: controlledSorting } : {}),
            ...(controlledSelection !== undefined ? { rowSelection: controlledSelection } : {}),
            ...(columnSizing !== undefined ? { columnSizing } : {}),
        },
        onColumnSizingChange: (update) => {
            if (columnSizing !== undefined)
                onColumnSizingChange?.(update);
            else
                makeStateUpdater('columnSizing', table)(update);
        },
        onSortingChange: (update) => {
            if (controlledSorting === undefined)
                makeStateUpdater('sorting', table)(update);
            onSortingChange?.(update);
        },
        onRowSelectionChange: (update) => {
            if (controlledSelection === undefined)
                makeStateUpdater('rowSelection', table)(update);
            onRowSelectionChange?.(update);
        },
    }, (state) => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
    useColumnSizingPersistence({ table, bounds, appOwned: appOwnedSizing, storageKey, storage });
    return table;
}
