'use client';
import { makeStateUpdater, useTable } from '@tanstack/react-table';
import { useEffect, useMemo, useRef } from 'react';
import { puppertinoTableFeatures, } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';
/** Shared state wiring for complete tables and custom semantic layouts. */
export function usePuppertinoTable({ data, columns, getRowId, sorting: controlledSorting, onSortingChange, initialSorting = [], initialRowSelection = {}, manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, selectable = false, disabled = false, columnSizing, onColumnSizingChange, storageKey, storage, }) {
    const canSelect = selectable && !disabled && (controlledSelection === undefined || !!onRowSelectionChange);
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
    const controlledSizing = columnSizing !== undefined;
    const table = useTable({
        features: puppertinoTableFeatures,
        columns: sizedColumns,
        data,
        getRowId,
        manualSorting,
        enableSorting: controlledSorting === undefined || !!onSortingChange,
        enableMultiSort: false,
        enableSortingRemoval: false,
        enableRowSelection: canSelect,
        enableSubRowSelection: false,
        initialState: {
            ...(controlledSorting === undefined ? { sorting: initialSorting } : {}),
            ...(controlledSelection === undefined ? { rowSelection: initialRowSelection } : {}),
            ...(!controlledSizing ? { columnSizing: readColumnSizing(bounds) } : {}),
        },
        state: {
            ...(controlledSorting !== undefined ? { sorting: controlledSorting } : {}),
            ...(controlledSelection !== undefined ? { rowSelection: controlledSelection } : {}),
            ...(controlledSizing ? { columnSizing } : {}),
        },
        onColumnSizingChange: (update) => {
            if (controlledSizing)
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
    const sizingAtom = table.baseAtoms.columnSizing;
    const restored = useRef(null);
    // Restore only after hydration. This is initialization, not a user resize or storage write.
    useEffect(() => {
        if (controlledSizing) {
            restored.current = null;
            return;
        }
        const schema = JSON.stringify(bounds);
        if (restored.current?.schema === schema &&
            restored.current.key === storageKey &&
            restored.current.adapter === storage)
            return;
        restored.current = { schema, key: storageKey, adapter: storage };
        let widths = readColumnSizing(bounds);
        try {
            widths = readColumnSizing(bounds, storageKey, storage ?? window.localStorage);
        }
        catch {
            widths = readColumnSizing(bounds);
        }
        sizingAtom.set(widths);
    }, [sizingAtom, bounds, storageKey, storage, controlledSizing]);
    return table;
}
