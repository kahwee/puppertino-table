// biome-ignore-all lint/a11y/noNoninteractiveTabindex: This wrapper provides a keyboard-focusable horizontal scroll region.
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ColumnOrderProvider } from './column-order.js';
import { DensityScope } from './density.js';
import { tableBehavior } from './table-behavior.js';
import { TableBody } from './table-body.js';
import { TableHeader } from './table-header.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
import { VirtualTableBody } from './virtual-table-body.js';
export function PuppertinoTable(props) {
    const { atoms, getRowLabel, columnSizing, onColumnSizingCommit, onColumnOrderCommit, storageKey, storage, cancelMediaQuery, ariaLabel, caption, emptyContent = 'No rows', status = 'ready', loadingContent, errorContent, className = '', density, densityMetrics, getRowProps, getCellProps, leadingRows, getHeaderMenu, virtualization, } = props;
    const [scrollElement, setScrollElement] = useState(null);
    if (virtualization && leadingRows !== undefined)
        throw new Error('Virtual tables do not support leadingRows. Use the ordinary TableBody for custom leading rows.');
    const table = usePuppertinoTable(props);
    const behavior = tableBehavior(table);
    const showSelection = behavior.selectable && behavior.selectionCheckboxes;
    // Sizing subscribers update geometry; header controls keep their own narrow subscriptions.
    const header = (_jsx(TableHeader, { table: table, getHeaderMenu: getHeaderMenu, onColumnOrderCommit: onColumnOrderCommit, resizeOptions: {
            storageKey: columnSizing === undefined && !atoms?.columnSizing ? storageKey : undefined,
            storage,
            cancelMediaQuery,
            onCommit: onColumnSizingCommit,
        } }));
    return (_jsx(DensityScope, { ref: virtualization ? setScrollElement : undefined, style: virtualization ? { height: virtualization.height } : undefined, density: density, metrics: densityMetrics, className: `pt-scroll ${className}`, tabIndex: 0, role: "region", "aria-label": `${ariaLabel} scroll area`, children: _jsx(ColumnOrderProvider, { table: table, onCommit: onColumnOrderCommit, children: _jsx(table.Subscribe, { source: table.options.atoms?.columnSizing ?? table.atoms.columnSizing, children: () => (_jsxs("table", { className: `p-table pt-table${virtualization ? ' pt-virtual-table' : ''}`, "aria-label": ariaLabel, "aria-rowcount": virtualization && table.getRowModel().rows.length > 0
                        ? table.getRowModel().rows.length +
                            table.getHeaderGroups().length +
                            (status !== 'ready' ? 1 : 0)
                        : undefined, "aria-busy": status === 'loading' || undefined, style: { width: table.getTotalSize() + (showSelection ? 36 : 0) }, children: [caption && _jsx("caption", { children: caption }), _jsxs("colgroup", { children: [showSelection && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map((column) => (_jsx("col", { style: { width: column.getSize() } }, column.id)))] }), header, virtualization ? (_jsx(VirtualTableBody, { table: table, scrollElement: scrollElement, options: virtualization, getRowLabel: getRowLabel, getRowProps: getRowProps, getCellProps: getCellProps, status: status, emptyContent: emptyContent, loadingContent: loadingContent, errorContent: errorContent })) : (_jsx(TableBody, { table: table, getRowLabel: getRowLabel, emptyContent: emptyContent, status: status, loadingContent: loadingContent, errorContent: errorContent, getRowProps: getRowProps, getCellProps: getCellProps, leadingRows: leadingRows }))] })) }) }) }));
}
