'use client';
import { type RowData, Subscribe } from '@tanstack/react-table';
import type { ColumnResizeHandleProps } from './resize-types.js';
import { tableBehavior } from './table-behavior.js';
import { useColumnResize } from './use-column-resize.js';

export function ColumnResizeHandle<T extends RowData>({
  table,
  header,
  label,
  options,
}: ColumnResizeHandleProps<T>) {
  const resolvedLabel =
    label ??
    (typeof header.column.columnDef.header === 'string'
      ? header.column.columnDef.header
      : header.column.id);
  const { handle } = useColumnResize(table, options);
  if (
    !tableBehavior(table).resizable ||
    options?.enabled === false ||
    header.isPlaceholder ||
    header.column.columns.length > 0
  )
    return null;
  return (
    <Subscribe
      source={table.options.atoms?.columnSizing ?? table.atoms.columnSizing}
      selector={(widths) => widths[header.column.id]}
    >
      {() => (
        // biome-ignore lint/a11y/useSemanticElements: An interactive ARIA separator exposes resize values and pointer/keyboard actions; an hr is static.
        <span
          className="pt-resizer"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={`Resize ${resolvedLabel} column`}
          aria-valuemin={header.column.columnDef.minSize ?? 20}
          aria-valuemax={header.column.columnDef.maxSize ?? 1200}
          aria-valuenow={header.getSize()}
          aria-valuetext={`${header.getSize()} pixels`}
          title="Drag to resize. Double-click or Enter to reset. Arrow keys adjust width; Escape cancels a drag."
          {...handle(header.column.id)}
        />
      )}
    </Subscribe>
  );
}
