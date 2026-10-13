// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DensityScope } from './density.js';
import { tableBehavior } from './table-behavior.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
export function PuppertinoTable(props) {
    const { atoms, getRowLabel, columnSizing, onColumnSizingCommit, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', status = 'ready', loadingContent, errorContent, className = '', density, densityMetrics, getRowProps, getCellProps, leadingRows, } = props;
    const table = usePuppertinoTable(props);
    const behavior = tableBehavior(table);
    const showSelection = behavior.selectable && behavior.selectionCheckboxes;
    return (_jsx(DensityScope, { density: density, metrics: densityMetrics, className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(table.Subscribe, { source: table.atoms.columnSizing, children: () => (_jsxs("table", { className: "p-table pt-table", "aria-label": ariaLabel, "aria-busy": status === 'loading' || undefined, style: { width: table.getTotalSize() + (showSelection ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [showSelection && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map((column) => (_jsx("col", { style: { width: column.getSize() } }, column.id)))] }), _jsx(TableHeader, { table: table, resizeOptions: {
                            storageKey: columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
                            storage,
                            cancelMediaQuery,
                            onCommit: onColumnSizingCommit,
                        } }), _jsx(TableBody, { table: table, getRowLabel: getRowLabel, emptyContent: emptyContent, status: status, loadingContent: loadingContent, errorContent: errorContent, getRowProps: getRowProps, getCellProps: getCellProps, leadingRows: leadingRows })] })) }) }));
}
