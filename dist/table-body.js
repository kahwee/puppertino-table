'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { memo } from 'react';
import { RowSelectionCheckbox } from './row-selection-checkbox.js';
import { tableBehavior } from './table-behavior.js';
function RenderTableBody({ table, selectable = false, disabled = false, getRowLabel, emptyContent = 'No rows', getRowProps, getCellProps, leadingRows, }) {
    const rows = table.getRowModel().rows;
    const context = {
        table,
        selectable,
        disabled,
        columnCount: table.getAllLeafColumns().length + (selectable ? 1 : 0),
    };
    return (_jsxs("tbody", { children: [typeof leadingRows === 'function' ? leadingRows(table, context) : leadingRows, rows.length ? (rows.map((row) => {
                const props = getRowProps?.(row, context);
                const className = [row.getIsSelected() ? 'p-selected' : '', props?.className].filter(Boolean).join(' ') ||
                    undefined;
                return (_createElement("tr", { ...props, key: row.id, className: className },
                    selectable && (_jsx("td", { className: "pt-selection", children: _jsx(RowSelectionCheckbox, { row: row, label: getRowLabel?.(row.original), disabled: disabled }) })),
                    row.getAllCells().map((cell) => (_createElement("td", { ...getCellProps?.(cell, context), key: cell.id },
                        _jsx(table.FlexRender, { cell: cell }))))));
            })) : (_jsx("tr", { children: _jsx("td", { colSpan: context.columnCount, children: emptyContent }) }))] }));
}
/** Geometry updates do not rerender cells; data and table state changes still do. */
const MemoTableBody = memo(RenderTableBody);
/** Resolve shared policy outside the memoized cells so policy changes still reach them. */
export function TableBody(props) {
    const behavior = tableBehavior(props.table);
    return (_jsx(MemoTableBody, { ...props, selectable: props.selectable ?? (behavior.selectable && behavior.selectionCheckboxes), disabled: behavior.disabled || !!props.disabled }));
}
