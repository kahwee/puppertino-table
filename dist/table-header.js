'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ColumnResizeHandle } from './resize-handle.js';
export function TableHeader({ table, selectable = false, disabled = false, resizable = true, resizeOptions, }) {
    const groups = table.getHeaderGroups();
    const options = {
        ...resizeOptions,
        enabled: resizable && !disabled && resizeOptions?.enabled !== false,
    };
    return (_jsx("thead", { children: groups.map((group, index) => (_jsxs("tr", { children: [selectable && index === 0 && (_jsx("th", { className: "pt-selection", rowSpan: groups.length, scope: "col", children: _jsx("span", { className: "pt-sr-only", children: "Select rows" }) })), group.headers.map((header) => {
                    const column = header.column;
                    const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
                    const sorted = column.getIsSorted();
                    return (_jsxs("th", { colSpan: header.colSpan, scope: column.columns.length === 0 ? 'col' : 'colgroup', "aria-sort": sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined, children: [!header.isPlaceholder &&
                                (column.getCanSort() ? (_jsxs("button", { type: "button", className: "pt-sort", "aria-label": `Sort by ${label}`, disabled: disabled, onClick: () => column.toggleSorting(), children: [_jsx(table.FlexRender, { header: header }), _jsx("span", { className: "pt-sort-arrow", "aria-hidden": "true", "data-direction": sorted || 'none', children: "\u2304" })] })) : (_jsx(table.FlexRender, { header: header }))), options.enabled && (_jsx(ColumnResizeHandle, { table: table, header: header, label: label, options: options }))] }, header.id));
                })] }, group.id))) }));
}
