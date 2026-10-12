'use client';
import { useTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { puppertinoTableFeatures, } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';
/** Shared state wiring for complete tables and custom semantic layouts. */
export function usePuppertinoTable({ data, columns, getRowId, sorting: controlledSorting, onSortingChange, initialSorting = [], initialRowSelection = {}, manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, selectable = false, disabled = false, storageKey, storage, }) {
    const [localSelection, setLocalSelection] = useState(() => initialRowSelection);
    const [localSorting, setLocalSorting] = useState(() => initialSorting);
    const sorting = controlledSorting ?? localSorting;
    const changeSorting = useCallback((update) => {
        if (controlledSorting === undefined)
            setLocalSorting(update);
        onSortingChange?.(update);
    }, [controlledSorting, onSortingChange]);
    const changeSelection = useCallback((update) => {
        if (controlledSelection === undefined)
            setLocalSelection(update);
        onRowSelectionChange?.(update);
    }, [controlledSelection, onRowSelectionChange]);
    const rowSelection = controlledSelection ?? localSelection;
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
    const [initialWidths] = useState(() => {
        try {
            return readColumnSizing(bounds, storageKey, storage || localStorage);
        }
        catch {
            return readColumnSizing(bounds);
        }
    });
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
        initialState: { columnSizing: initialWidths },
        state: { sorting, rowSelection },
        onSortingChange: changeSorting,
        onRowSelectionChange: changeSelection,
    }, (state) => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
    return table;
}
