"use client";
import type { RowData } from '@tanstack/react-table';
import type { ColumnResizeOptions } from './use-column-resize.js';
import { useColumnResize } from './use-column-resize.js';
import type { PuppertinoTableInstance } from './model.js';
import type { Header } from '@tanstack/react-table';
import { puppertinoTableFeatures } from './model.js';

export function ColumnResizeHandle<T extends RowData>({ table, header, label, options }: {
  table: PuppertinoTableInstance<T>; header: Header<typeof puppertinoTableFeatures, T>;
  label: string; options?: ColumnResizeOptions;
}) {
  const { handle } = useColumnResize(table, options);
  if (options?.enabled === false) return null;
  return <span className="pt-resizer" role="separator" tabIndex={0} aria-orientation="vertical" aria-label={`Resize ${label} column`}
    aria-valuemin={header.column.columnDef.minSize ?? 20} aria-valuemax={header.column.columnDef.maxSize ?? 1200}
    aria-valuenow={header.getSize()} aria-valuetext={`${header.getSize()} pixels`}
    title="Drag to resize. Double-click or Enter to reset. Arrow keys adjust width; Escape cancels a drag."
    {...handle(header.column.id)} />;
}
