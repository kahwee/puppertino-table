'use client';
import { jsx as _jsx } from "react/jsx-runtime";
/** Shared click/keyboard semantics, including Shift selection and row-event isolation. */
export function RowSelectionCheckbox({ row, label, disabled = false, }) {
    return (_jsx("input", { type: "checkbox", "aria-label": `Select ${label ?? row.id}`, checked: row.getIsSelected(), disabled: disabled || !row.getCanSelect(), onClick: (event) => {
            event.stopPropagation();
            row.getToggleSelectedHandler()(event);
        }, onChange: () => { } }));
}
