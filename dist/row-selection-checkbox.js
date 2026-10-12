'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Subscribe } from '@tanstack/react-table';
/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox({ row, label, disabled = false, }) {
    return (_jsx(Subscribe, { source: row.table.atoms.rowSelection, selector: (selection) => !!selection[row.id], children: (selected) => (_jsx("input", { type: "checkbox", "aria-label": `Select ${label ?? row.id}`, checked: selected, disabled: disabled || !row.getCanSelect(), onClick: (event) => {
                event.stopPropagation();
                row.getToggleSelectedHandler()(event);
            }, onChange: () => { } })) }));
}
