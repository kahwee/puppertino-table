// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DensityScope } from './density.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
export function PuppertinoTable(props) {
    const { atoms, getRowLabel, selectable = false, selectionCheckboxes = true, disabled = false, resizable = true, columnSizing, onColumnSizingChange, onColumnSizingCommit, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', className = '', density, densityMetrics, getRowProps, getCellProps, leadingRows, } = props;
    const table = usePuppertinoTable(props);
    const showSelection = selectable && selectionCheckboxes;
    return (_jsx(DensityScope, { density: density, metrics: densityMetrics, className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(table.Subscribe, { source: table.atoms.columnSizing, children: () => (_jsxs("table", { className: "p-table pt-table", "aria-label": ariaLabel, style: { width: table.getTotalSize() + (showSelection ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [showSelection && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map((column) => (_jsx("col", { style: { width: column.getSize() } }, column.id)))] }), _jsx(TableHeader, { table: table, selectable: showSelection, disabled: disabled, resizable: resizable && (columnSizing === undefined || !!onColumnSizingChange), resizeOptions: {
                            storageKey: columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
                            storage,
                            cancelMediaQuery,
                            onCommit: onColumnSizingCommit,
                        } }), _jsx(TableBody, { table: table, selectable: showSelection, disabled: disabled, getRowLabel: getRowLabel, emptyContent: emptyContent, getRowProps: getRowProps, getCellProps: getCellProps, leadingRows: leadingRows })] })) }) }));
}
