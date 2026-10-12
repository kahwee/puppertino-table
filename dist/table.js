"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useMemo, useState } from 'react';
import { useTable } from '@tanstack/react-table';
import { puppertinoTableFeatures } from './model.js';
import { columnSizeBounds, readColumnSizing } from './sizing.js';
import { useColumnResize } from './use-column-resize.js';
export function PuppertinoTable({ data, columns, getRowId, sorting, onSortingChange, manualSorting = true, rowSelection: controlledSelection, onRowSelectionChange, getRowLabel, selectable = false, disabled = false, resizable = true, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '' }) {
    const [localSelection, setLocalSelection] = useState({});
    const rowSelection = controlledSelection ?? localSelection;
    const canSelect = selectable && !disabled && (controlledSelection === undefined || !!onRowSelectionChange);
    const bounds = useMemo(() => columnSizeBounds(columns), [columns]);
    const sizedColumns = useMemo(() => {
        const byId = new Map(bounds.map(bound => [bound.id, bound]));
        const decorate = (defs) => defs.map(def => {
            if ('columns' in def && def.columns)
                return { ...def, columns: decorate(def.columns) };
            const id = def.id ?? ('accessorKey' in def ? String(def.accessorKey).replaceAll('.', '_') : '');
            return { ...def, ...byId.get(id) };
        });
        return decorate(columns);
    }, [columns, bounds]);
    const [initialWidths] = useState(() => {
        try {
            return readColumnSizing(bounds, storageKey, storage || localStorage);
        }
        catch {
            return readColumnSizing(bounds);
        }
    });
    const table = useTable({ features: puppertinoTableFeatures, columns: sizedColumns, data, getRowId,
        manualSorting, enableMultiSort: false, enableSortingRemoval: false, enableRowSelection: canSelect,
        enableSubRowSelection: false, initialState: { columnSizing: initialWidths },
        state: { sorting, rowSelection }, onSortingChange, onRowSelectionChange: onRowSelectionChange ?? setLocalSelection,
    }, state => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
    const options = { enabled: resizable && !disabled, storageKey, storage, cancelMediaQuery };
    const { handle } = useColumnResize(table, options);
    const groups = table.getHeaderGroups();
    return _jsx("div", { className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(table.Subscribe, { source: table.atoms.columnSizing, children: () => _jsxs("table", { className: "p-table pt-table", "aria-label": ariaLabel, style: { width: table.getTotalSize() + (selectable ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [selectable && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map(column => _jsx("col", { style: { width: column.getSize() } }, column.id))] }), _jsx("thead", { children: groups.map((group, index) => _jsxs("tr", { children: [selectable && index === 0 && _jsx("th", { className: "pt-selection", rowSpan: groups.length, scope: "col", children: _jsx("span", { className: "pt-sr-only", children: "Select rows" }) }), group.headers.map(header => {
                                    const column = header.column;
                                    const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
                                    const sorted = column.getIsSorted();
                                    const leaf = column.columns.length === 0;
                                    return _jsxs("th", { colSpan: header.colSpan, scope: leaf ? 'col' : 'colgroup', "aria-sort": sorted ? sorted === 'asc' ? 'ascending' : 'descending' : undefined, children: [!header.isPlaceholder && (column.getCanSort() ? _jsxs("button", { type: "button", className: "pt-sort", "aria-label": `Sort by ${label}`, disabled: disabled, onClick: () => column.toggleSorting(), children: [_jsx(table.FlexRender, { header: header }), _jsx("span", { className: "pt-sort-arrow", "aria-hidden": "true", "data-direction": sorted || 'none', children: "\u2304" })] }) : _jsx(table.FlexRender, { header: header })), leaf && !header.isPlaceholder && resizable && !disabled && _jsx("span", { className: "pt-resizer", role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": `Resize ${label} column`, "aria-valuemin": column.columnDef.minSize, "aria-valuemax": column.columnDef.maxSize, "aria-valuenow": header.getSize(), "aria-valuetext": `${header.getSize()} pixels`, title: "Drag to resize. Double-click or Enter to reset. Arrows adjust width; Escape cancels a drag.", ...handle(column.id) })] }, header.id);
                                })] }, group.id)) }), _jsx(MemoTableBody, { table: table, selectable: selectable, getRowLabel: getRowLabel, emptyContent: emptyContent })] }) }) });
}
/** Geometry updates do not rerender cells. State and data changes still do. */
function TableBody({ table, selectable, getRowLabel, emptyContent }) {
    const rows = table.getRowModel().rows;
    return _jsx("tbody", { children: rows.length ? rows.map(row => _jsxs("tr", { className: row.getIsSelected() ? 'p-selected' : undefined, children: [selectable && _jsx("td", { className: "pt-selection", children: _jsx("input", { type: "checkbox", "aria-label": `Select ${getRowLabel?.(row.original) ?? row.id}`, checked: row.getIsSelected(), disabled: !row.getCanSelect(), onClick: event => { event.stopPropagation(); row.getToggleSelectedHandler()(event); }, onChange: () => { } }) }), row.getAllCells().map(cell => _jsx("td", { children: _jsx(table.FlexRender, { cell: cell }) }, cell.id))] }, row.id)) : _jsx("tr", { children: _jsx("td", { colSpan: table.getAllLeafColumns().length + (selectable ? 1 : 0), children: emptyContent }) }) });
}
const MemoTableBody = memo(TableBody);
