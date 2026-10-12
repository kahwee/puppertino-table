"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useColumnResize } from './use-column-resize.js';
export function ColumnResizeHandle({ table, header, label, options }) {
    const { handle } = useColumnResize(table, options);
    if (options?.enabled === false)
        return null;
    return _jsx("span", { className: "pt-resizer", role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": `Resize ${label} column`, "aria-valuemin": header.column.columnDef.minSize ?? 20, "aria-valuemax": header.column.columnDef.maxSize ?? 1200, "aria-valuenow": header.getSize(), "aria-valuetext": `${header.getSize()} pixels`, title: "Drag to resize. Double-click or Enter to reset. Arrow keys adjust width; Escape cancels a drag.", ...handle(header.column.id) });
}
