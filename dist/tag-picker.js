'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from 'react';
import { useTagPopover } from './use-tag-popover.js';
/** Controlled tags in a Finder-style token field. Import Puppertino popover CSS. */
export function TagPicker({ options, value, onValueChange, mixedValue = [], onCreate, disabled = false, trigger = 'Tags', triggerClassName = 'p-button', title = 'Assign tags', }) {
    const id = useId();
    const anchor = useRef(null);
    const panel = useRef(null);
    const input = useRef(null);
    const tokens = useRef(new Map());
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(-1);
    const normalized = query.trim().toLowerCase();
    const exact = options.find((option) => option.label.trim().toLowerCase() === normalized);
    const candidates = options.filter((option) => !value.includes(option.id) && option.label.toLowerCase().includes(normalized));
    const canCreate = Boolean(onCreate && normalized && !exact);
    const choices = [
        ...candidates.filter((option) => !option.disabled),
        ...(canCreate ? [{ id: '', label: query.trim(), create: true }] : []),
    ];
    const optionId = (option) => `${id}-option-${options.indexOf(option) < 0 ? options.length : options.indexOf(option)}`;
    const close = (restore = false) => {
        setOpen(false);
        setQuery('');
        setActive(-1);
        if (restore)
            anchor.current?.focus();
    };
    useTagPopover(open && !disabled, anchor, panel, input);
    const apply = (option) => {
        if (disabled || option.disabled)
            return;
        if (option.create)
            onCreate?.(query.trim());
        else if (!value.includes(option.id))
            onValueChange([...value, option.id]);
        setQuery('');
        setActive(-1);
        input.current?.focus();
    };
    const remove = (key) => {
        if (disabled || options.find((option) => option.id === key)?.disabled)
            return;
        onValueChange(value.filter((item) => item !== key));
        input.current?.focus();
    };
    return (_jsxs("fieldset", { className: "pt-tag-picker", "aria-label": "Tags", onBlur: (event) => {
            if (event.relatedTarget instanceof Node &&
                !event.currentTarget.contains(event.relatedTarget))
                close();
        }, children: [_jsx("button", { ref: anchor, type: "button", className: triggerClassName, "aria-label": "Tags", title: "Tags", "aria-haspopup": "dialog", "aria-controls": id, "aria-expanded": open && !disabled, disabled: disabled, onClick: () => (open ? close() : setOpen(true)), children: trigger }), _jsx("div", { id: id, ref: panel, popover: "auto", role: "dialog", "aria-label": "Assign tags", className: "p-popover pt-tag-popover", "data-state": open && !disabled ? 'open' : 'closed', onToggle: (event) => {
                    if (event.newState === 'closed')
                        close();
                }, onKeyDown: (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        close(true);
                    }
                }, children: _jsxs("div", { className: "pt-tag-content", children: [_jsx("div", { className: "pt-tag-title", title: title, children: title }), _jsxs("div", { className: "pt-tag-field", children: [value.map((key) => {
                                    const option = options.find((item) => item.id === key);
                                    return (_jsx("button", { type: "button", className: "pt-tag-token", disabled: option?.disabled, ref: (node) => {
                                            if (node)
                                                tokens.current.set(key, node);
                                            else
                                                tokens.current.delete(key);
                                        }, "aria-label": `Remove tag ${option?.label ?? key}`, title: `Remove ${option?.label ?? key}`, onFocus: () => setActive(-1), onClick: () => remove(key), onKeyDown: (event) => {
                                            if (event.key === 'Backspace' || event.key === 'Delete') {
                                                event.preventDefault();
                                                remove(key);
                                            }
                                        }, children: option?.label ?? key }, key));
                                }), _jsx("input", { ref: input, role: "combobox", "aria-label": "Tag name", "aria-autocomplete": "list", "aria-expanded": open, "aria-controls": `${id}-options`, "aria-activedescendant": active >= 0 && choices[active] ? optionId(choices[active]) : undefined, value: query, onChange: (event) => {
                                        setQuery(event.target.value);
                                        setActive(-1);
                                    }, onKeyDown: (event) => {
                                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                            event.preventDefault();
                                            const next = choices.length
                                                ? (active +
                                                    (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) +
                                                    choices.length) %
                                                    choices.length
                                                : -1;
                                            setActive(next);
                                            document
                                                .getElementById(choices[next] ? optionId(choices[next]) : '')
                                                ?.scrollIntoView({ block: 'nearest' });
                                        }
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            const option = choices[active] ??
                                                exact ??
                                                (canCreate ? { id: '', label: query.trim(), create: true } : undefined);
                                            if (option)
                                                apply(option);
                                        }
                                        if (event.key === 'Backspace' && !query && value.length) {
                                            event.preventDefault();
                                            tokens.current.get(value[value.length - 1])?.focus();
                                        }
                                    } })] }), _jsxs("div", { id: `${id}-options`, role: "listbox", "aria-label": "Available tags", className: "pt-tag-options", children: [candidates.map((option) => (_jsxs("button", { id: optionId(option), type: "button", role: "option", tabIndex: -1, disabled: option.disabled, "aria-selected": choices[active] === option, onMouseDown: (event) => event.preventDefault(), onPointerMove: (event) => {
                                        if (event.pointerType === 'touch' || option.disabled)
                                            return;
                                        setActive(choices.findIndex((choice) => choice.id === option.id));
                                        input.current?.focus({ preventScroll: true });
                                    }, onClick: () => apply(option), children: [_jsx("span", { className: "pt-tag-dot", "aria-hidden": "true" }), _jsx("span", { className: "pt-tag-label", children: option.label }), mixedValue.includes(option.id) && _jsx("small", { children: "Some items" })] }, option.id))), canCreate && (_jsxs("button", { id: `${id}-option-${options.length}`, type: "button", role: "option", tabIndex: -1, "aria-selected": active === choices.length - 1, onMouseDown: (event) => event.preventDefault(), onPointerMove: (event) => {
                                        if (event.pointerType === 'touch')
                                            return;
                                        setActive(choices.length - 1);
                                        input.current?.focus({ preventScroll: true });
                                    }, onClick: () => apply({ id: '', label: query.trim(), create: true }), children: ["Create tag \u201C", query.trim(), "\u201D"] }))] }), !candidates.length && !canCreate && (_jsx("div", { className: "pt-tag-empty", children: normalized ? 'No matching tags' : 'All tags assigned' }))] }) })] }));
}
