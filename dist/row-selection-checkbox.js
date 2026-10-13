'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Subscribe } from '@tanstack/react-table';
import { useRowSelectionGestures } from './use-row-selection-gestures.js';
/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox({ row, label, disabled = false, }) {
    const { select } = useRowSelectionGestures(row.table, { disabled });
    return (_jsx(Subscribe, { source: row.table.atoms.rowSelection, selector: (selection) => !!selection[row.id], children: (selected) => (_jsx("input", { type: "checkbox", "aria-label": `Select ${label ?? row.id}`, checked: selected, disabled: disabled || !row.getCanSelect(), onClick: (event) => {
                event.stopPropagation();
                select(row.id, {
                    shift: event.shiftKey,
                    toggle: !event.shiftKey || event.metaKey || event.ctrlKey,
                });
            }, onChange: () => { } })) }));
}
