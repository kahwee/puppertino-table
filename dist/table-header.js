'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Subscribe } from '@tanstack/react-table';
import { ColumnResizeHandle } from './resize-handle.js';
import { selectionAnchorFor } from './selection-anchor.js';
import { tableBehavior } from './table-behavior.js';
export function TableHeader({ table, selectable: selectionOverride, disabled: disabledOverride, resizable: resizeOverride, resizeOptions, }) {
    const behavior = tableBehavior(table);
    const selectable = selectionOverride ?? (behavior.selectable && behavior.selectionCheckboxes);
    const disabled = behavior.disabled || !!disabledOverride;
    const resizable = behavior.resizable && resizeOverride !== false;
    const groups = table.getHeaderGroups();
    const options = {
        ...resizeOptions,
        enabled: resizable && !disabled && resizeOptions?.enabled !== false,
    };
    return (_jsx("thead", { children: groups.map((group, index) => (_jsxs("tr", { children: [selectable && index === 0 && (_jsx("th", { className: "pt-selection", rowSpan: groups.length, scope: "col", children: _jsx(Subscribe, { source: table.atoms.rowSelection, children: (selection) => {
                            const rows = table.getRowModel().rows.filter((row) => row.getCanSelect());
                            const selected = rows.filter((row) => selection[row.id]).length;
                            const checked = rows.length > 0 && selected === rows.length;
                            const mixed = selected > 0 && !checked;
                            return (_jsx("input", { type: "checkbox", "aria-label": "Select all visible rows", "aria-checked": mixed ? 'mixed' : checked, checked: checked, disabled: disabled || rows.length === 0, ref: (input) => {
                                    if (input)
                                        input.indeterminate = mixed;
                                }, onClick: (event) => event.stopPropagation(), onChange: (event) => {
                                    if (!disabled && rows.length > 0) {
                                        selectionAnchorFor(table.atoms.rowSelection).current = null;
                                        table.toggleAllPageRowsSelected(event.target.checked);
                                    }
                                } }));
                        } }) })), group.headers.map((header) => {
                    if (header.isPlaceholder)
                        return _jsx("td", { colSpan: header.colSpan }, header.id);
                    const column = header.column;
                    const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
                    const sorted = column.getIsSorted();
                    return (_jsxs("th", { colSpan: header.colSpan, scope: column.columns.length === 0 ? 'col' : 'colgroup', "aria-sort": sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined, children: [column.getCanSort() ? (_jsxs("button", { type: "button", className: "pt-sort", "aria-label": `Sort by ${label}`, disabled: disabled, onClick: () => column.toggleSorting(), children: [_jsx(table.FlexRender, { header: header }), _jsx("span", { className: "pt-sort-arrow", "aria-hidden": "true", "data-direction": sorted || 'none', children: "\u2304" })] })) : (_jsx(table.FlexRender, { header: header })), options.enabled && (_jsx(ColumnResizeHandle, { table: table, header: header, label: label, options: options }))] }, header.id));
                })] }, group.id))) }));
}
