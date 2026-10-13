'use client';
import { tableBehavior } from './table-behavior.js';
import { useResizeGesture } from './use-resize-gesture.js';
export function useColumnResize(table, options = {}) {
    const columnById = (id) => {
        const column = table.getColumn(id);
        if (!column)
            throw new Error(`Unknown resize column: ${id}`);
        return column;
    };
    const adapter = {
        snapshot: () => Object.fromEntries(table.getAllLeafColumns().map((column) => [column.id, column.getSize()])),
        bounds: (id) => {
            const column = columnById(id);
            return {
                id,
                size: column.columnDef.size ?? 150,
                minSize: column.columnDef.minSize ?? 20,
                maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
            };
        },
        apply: (widths) => table.setColumnSizing(widths),
        reset: (id) => columnById(id).resetSize(),
    };
    return useResizeGesture(table.atoms.columnSizing, adapter, {
        ...options,
        enabled: tableBehavior(table).resizable && options.enabled !== false,
    });
}
