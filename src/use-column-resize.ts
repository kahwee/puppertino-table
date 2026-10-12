'use client';
import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance } from './model.js';
import type { ColumnResizeOptions } from './resize-types.js';
import { useResizeGesture } from './use-resize-gesture.js';

export type { ColumnResizeOptions } from './resize-types.js';

export function useColumnResize<T extends RowData>(
  table: PuppertinoTableInstance<T>,
  options: ColumnResizeOptions = {},
) {
  const columnById = (id: string) => {
    const column = table.getColumn(id);
    if (!column) throw new Error(`Unknown resize column: ${id}`);
    return column;
  };
  const adapter = {
    snapshot: () =>
      Object.fromEntries(table.getAllLeafColumns().map((column) => [column.id, column.getSize()])),
    bounds: (id: string) => {
      const column = columnById(id);
      return {
        id,
        size: column.columnDef.size ?? 150,
        minSize: column.columnDef.minSize ?? 20,
        maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
      };
    },
    apply: (widths: Record<string, number>) => table.setColumnSizing(widths),
    reset: (id: string) => columnById(id).resetSize(),
  };
  return useResizeGesture(table.atoms.columnSizing, adapter, options);
}
