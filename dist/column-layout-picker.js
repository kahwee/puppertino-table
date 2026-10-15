'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Popover } from '@base-ui/react/popover';
import { useSelector } from '@tanstack/react-store';
import { useEffect, useId, useRef, useState } from 'react';
/** Small native preset picker with an anchored, explicit save/rename workflow. */
export function ColumnLayoutPicker({ controller, disabled = false, label = 'Column layout', }) {
    // Preview widths leave the committed preset unchanged. Render only when its ID changes.
    const selected = useSelector(controller.columnSizing, () => controller.getActivePresetId());
    const persistence = useSelector(controller.persistence);
    const id = useId();
    const input = useRef(null);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('save');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const preset = controller.presets.find((item) => item.id === selected);
    const unavailable = disabled || !controller.ready;
    useEffect(() => {
        if (unavailable)
            setOpen(false);
    }, [unavailable]);
    return (_jsxs("div", { className: "pt-layout-picker", children: [_jsx("label", { htmlFor: id, children: label }), _jsx("span", { className: "p-select", children: _jsxs("select", { id: id, value: selected, disabled: unavailable, onChange: (event) => {
                        controller.applyPreset(event.target.value);
                        setNotice('Column layout applied.');
                    }, children: [_jsx("option", { value: "", disabled: true, children: "Custom layout" }), controller.presets.map((item) => (_jsx("option", { value: item.id, children: item.name }, item.id)))] }) }), _jsxs(Popover.Root, { open: !unavailable && open, onOpenChange: (value) => {
                    setOpen(value);
                    setError('');
                    setMode('save');
                    setName('');
                }, children: [_jsx(Popover.Trigger, { className: "p-button p-button-borderless", disabled: unavailable, "aria-label": "Layout options", title: "Save or manage layouts", children: "\u22EF" }), _jsx(Popover.Portal, { children: _jsx(Popover.Positioner, { side: "bottom", align: "end", sideOffset: 6, collisionPadding: 8, children: _jsxs(Popover.Popup, { className: "pt-layout-popup", initialFocus: input, children: [_jsx(Popover.Title, { children: mode === 'rename' ? 'Rename layout' : 'Save current layout' }), _jsxs("form", { onSubmit: (event) => {
                                            event.preventDefault();
                                            const success = mode === 'rename' && preset
                                                ? controller.renamePreset(preset.id, name)
                                                : controller.savePreset(name);
                                            if (!success) {
                                                setError('Use a unique name of 1–64 characters. Up to 30 layouts can be saved.');
                                                input.current?.focus();
                                                return;
                                            }
                                            setNotice(mode === 'rename' ? 'Layout renamed.' : 'Layout saved.');
                                            setOpen(false);
                                        }, children: [_jsx("label", { htmlFor: `${id}-name`, children: "Name" }), _jsx("input", { ref: input, id: `${id}-name`, className: "p-field", autoComplete: "off", value: name, maxLength: 64, required: true, "aria-invalid": !!error || undefined, "aria-describedby": error ? `${id}-error` : undefined, onChange: (event) => {
                                                    setName(event.target.value);
                                                    setError('');
                                                } }), error && (_jsx("p", { id: `${id}-error`, role: "alert", children: error })), _jsxs("div", { className: "pt-layout-form-actions", children: [_jsx(Popover.Close, { className: "p-button", type: "button", children: "Cancel" }), _jsx("button", { className: "p-button p-button-primary", type: "submit", children: mode === 'rename' ? 'Rename' : 'Save' })] })] }), preset && !preset.readOnly && (_jsxs("div", { className: "pt-layout-manage", children: [_jsx("button", { className: "p-button p-button-borderless", type: "button", onClick: () => {
                                                    setMode('rename');
                                                    setName(preset.name);
                                                    setError('');
                                                    input.current?.focus();
                                                    input.current?.select();
                                                }, children: "Rename saved layout\u2026" }), _jsx("button", { className: "p-button p-button-borderless", type: "button", onClick: () => {
                                                    controller.deletePreset(preset.id);
                                                    setNotice('Saved layout deleted. Current columns kept.');
                                                    setOpen(false);
                                                }, children: "Delete saved layout" })] }))] }) }) })] }), _jsx("span", { className: "pt-layout-notice", role: "status", children: persistence === 'session' ? 'Storage unavailable. Changes kept for this visit.' : notice })] }));
}
