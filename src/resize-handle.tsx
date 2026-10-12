"use client";
import type { RowData } from '@tanstack/react-table';
import type { ColumnResizeOptions } from './use-column-resize.js';
import { useColumnResize } from './use-column-resize.js';
import type { PuppertinoTableInstance } from './model.js';
import type { Header } from '@tanstack/react-table';
import { puppertinoTableFeatures } from './model.js';

export interface ColumnResizeHandleProps<T extends RowData> {
  table: PuppertinoTableInstance<T>;
  header: Header<typeof puppertinoTableFeatures, T>;
  /** Defaults to a string header or the stable column ID. */
  label?: string;
  options?: ColumnResizeOptions;
}
export function ColumnResizeHandle<T extends RowData>({ table, header, label, options }: ColumnResizeHandleProps<T>) {
  const resolvedLabel = label ?? (typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.column.id);
  const { handle } = useColumnResize(table, options);
  if (options?.enabled === false || header.isPlaceholder || header.column.columns.length > 0) return null;
  return <span className="pt-resizer" role="separator" tabIndex={0} aria-orientation="vertical" aria-label={`Resize ${resolvedLabel} column`}
    aria-valuemin={header.column.columnDef.minSize ?? 20} aria-valuemax={header.column.columnDef.maxSize ?? 1200}
    aria-valuenow={header.getSize()} aria-valuetext={`${header.getSize()} pixels`}
    title="Drag to resize. Double-click or Enter to reset. Arrow keys adjust width; Escape cancels a drag."
    {...handle(header.column.id)} />;
}
