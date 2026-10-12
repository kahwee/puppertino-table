"use client";
import { createElement as _createElement } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { usePuppertinoTable } from './use-puppertino-table.js';
import { useColumnResize } from './use-column-resize.js';
export function PuppertinoTable({ data, columns, getRowId, sorting, onSortingChange, manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable = false, disabled = false, resizable = true, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '', getRowProps, getCellProps, leadingRows }) {
    const table = usePuppertinoTable({ data, columns, getRowId, sorting, onSortingChange, manualSorting,
        rowSelection: controlledSelection, onRowSelectionChange, selectable, disabled, storageKey, storage });
    const options = { enabled: resizable && !disabled, storageKey, storage, cancelMediaQuery };
    const { handle } = useColumnResize(table, options);
    const groups = table.getHeaderGroups();
    return _jsx("div", { className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(table.Subscribe, { source: table.atoms.columnSizing, children: () => _jsxs("table", { className: "p-table pt-table", "aria-label": ariaLabel, style: { width: table.getTotalSize() + (selectable ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [selectable && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map(column => _jsx("col", { style: { width: column.getSize() } }, column.id))] }), _jsx("thead", { children: groups.map((group, index) => _jsxs("tr", { children: [selectable && index === 0 && _jsx("th", { className: "pt-selection", rowSpan: groups.length, scope: "col", children: _jsx("span", { className: "pt-sr-only", children: "Select rows" }) }), group.headers.map(header => {
                                    const column = header.column;
                                    const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
                                    const sorted = column.getIsSorted();
                                    const leaf = column.columns.length === 0;
                                    return _jsxs("th", { colSpan: header.colSpan, scope: leaf ? 'col' : 'colgroup', "aria-sort": sorted ? sorted === 'asc' ? 'ascending' : 'descending' : undefined, children: [!header.isPlaceholder && (column.getCanSort() ? _jsxs("button", { type: "button", className: "pt-sort", "aria-label": `Sort by ${label}`, disabled: disabled, onClick: () => column.toggleSorting(), children: [_jsx(table.FlexRender, { header: header }), _jsx("span", { className: "pt-sort-arrow", "aria-hidden": "true", "data-direction": sorted || 'none', children: "\u2304" })] }) : _jsx(table.FlexRender, { header: header })), leaf && !header.isPlaceholder && resizable && !disabled && _jsx("span", { className: "pt-resizer", role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": `Resize ${label} column`, "aria-valuemin": column.columnDef.minSize, "aria-valuemax": column.columnDef.maxSize, "aria-valuenow": header.getSize(), "aria-valuetext": `${header.getSize()} pixels`, title: "Drag to resize. Double-click or Enter to reset. Arrows adjust width; Escape cancels a drag.", ...handle(column.id) })] }, header.id);
                                })] }, group.id)) }), _jsx(MemoTableBody, { table: table, selectable: selectable, getRowLabel: getRowLabel, emptyContent: emptyContent, getRowProps: getRowProps, getCellProps: getCellProps, leadingRows: leadingRows })] }) }) });
}
/** Geometry updates do not rerender cells. State and data changes still do. */
function TableBody({ table, selectable, getRowLabel, emptyContent, getRowProps, getCellProps, leadingRows }) {
    const rows = table.getRowModel().rows;
    return _jsxs("tbody", { children: [typeof leadingRows === 'function' ? leadingRows(table) : leadingRows, rows.length ? rows.map(row => {
                const props = getRowProps?.(row);
                const className = [row.getIsSelected() ? 'p-selected' : '', props?.className].filter(Boolean).join(' ') || undefined;
                return _createElement("tr", { ...props, key: row.id, className: className },
                    selectable && _jsx("td", { className: "pt-selection", children: _jsx("input", { type: "checkbox", "aria-label": `Select ${getRowLabel?.(row.original) ?? row.id}`, checked: row.getIsSelected(), disabled: !row.getCanSelect(), onClick: event => { event.stopPropagation(); row.getToggleSelectedHandler()(event); }, onChange: () => { } }) }),
                    row.getAllCells().map(cell => _createElement("td", { ...getCellProps?.(cell), key: cell.id },
                        _jsx(table.FlexRender, { cell: cell }))));
            }) : _jsx("tr", { children: _jsx("td", { colSpan: table.getAllLeafColumns().length + (selectable ? 1 : 0), children: emptyContent }) })] });
}
const MemoTableBody = memo(TableBody);
