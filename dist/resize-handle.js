'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Subscribe } from '@tanstack/react-table';
import { useColumnResize } from './use-column-resize.js';
export function ColumnResizeHandle({ table, header, label, options, }) {
    const resolvedLabel = label ??
        (typeof header.column.columnDef.header === 'string'
            ? header.column.columnDef.header
            : header.column.id);
    const { handle } = useColumnResize(table, options);
    if (options?.enabled === false || header.isPlaceholder || header.column.columns.length > 0)
        return null;
    return (_jsx(Subscribe, { source: table.atoms.columnSizing, selector: (widths) => widths[header.column.id], children: () => (_jsx("span", { className: "pt-resizer", role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": `Resize ${resolvedLabel} column`, "aria-valuemin": header.column.columnDef.minSize ?? 20, "aria-valuemax": header.column.columnDef.maxSize ?? 1200, "aria-valuenow": header.getSize(), "aria-valuetext": `${header.getSize()} pixels`, title: "Drag to resize. Double-click or Enter to reset. Arrow keys adjust width; Escape cancels a drag.", ...handle(header.column.id) })) }));
}
