// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
export function PuppertinoTable({ data, columns, getRowId, sorting, onSortingChange, initialSorting, initialRowSelection, manualSorting = true, rowSelection, onRowSelectionChange, getRowLabel, selectable = false, disabled = false, resizable = true, columnSizing, onColumnSizingChange, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '', getRowProps, getCellProps, leadingRows, }) {
    const table = usePuppertinoTable({
        data,
        columns,
        getRowId,
        sorting,
        onSortingChange,
        initialSorting,
        initialRowSelection,
        manualSorting,
        rowSelection,
        onRowSelectionChange,
        selectable,
        disabled,
        columnSizing,
        onColumnSizingChange,
        storageKey,
        storage,
    });
    return (_jsx("div", { className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(table.Subscribe, { source: table.atoms.columnSizing, children: () => (_jsxs("table", { className: "p-table pt-table", "aria-label": ariaLabel, style: { width: table.getTotalSize() + (selectable ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [selectable && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map((column) => (_jsx("col", { style: { width: column.getSize() } }, column.id)))] }), _jsx(TableHeader, { table: table, selectable: selectable, disabled: disabled, resizable: resizable && (columnSizing === undefined || !!onColumnSizingChange), resizeOptions: {
                            storageKey: columnSizing === undefined ? storageKey : undefined,
                            storage,
                            cancelMediaQuery,
                        } }), _jsx(TableBody, { table: table, selectable: selectable, disabled: disabled, getRowLabel: getRowLabel, emptyContent: emptyContent, getRowProps: getRowProps, getCellProps: getCellProps, leadingRows: leadingRows })] })) }) }));
}
