'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import { FinderActions, FinderToolbarButton, FinderToolbarGroup } from './finder-toolbar.js';
/** Optional center tools shrink into a menu; navigation and Search stay outside this group. */
export function FinderToolbarItems({ items, selectedIds, onSelectedIdsChange, overflowIcon, label = 'Optional tools', }) {
    const selected = [...new Set(selectedIds ?? items.map((item) => item.id))].flatMap((id) => {
        const item = items.find((item) => item.id === id);
        return item ? [item] : [];
    });
    const group = useRef(null);
    const panel = useRef(null);
    const [slots, setSlots] = useState(selected.length);
    const panelId = useId();
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const returnFocus = useRef(null);
    const preferredWidth = selected.length * 32 + 40;
    useEffect(() => {
        const node = group.current;
        if (!node)
            return;
        const measure = () => setSlots(Math.max(0, Math.floor((node.getBoundingClientRect().width - 40) / 32)));
        const resize = new ResizeObserver(measure);
        resize.observe(node);
        measure();
        return () => resize.disconnect();
    }, []);
    const customize = () => {
        const trigger = group.current?.querySelector('[aria-label="More tools"]');
        if (!trigger)
            return;
        returnFocus.current = trigger;
        const rect = trigger.getBoundingClientRect();
        setPosition({
            left: Math.max(8, Math.min(rect.right - 280, window.innerWidth - 288)),
            top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 340)),
        });
        requestAnimationFrame(() => panel.current?.showPopover());
    };
    const change = (ids) => onSelectedIdsChange?.(ids);
    const move = (id, direction) => {
        const focused = document.activeElement;
        const ids = selected.map((item) => item.id);
        const index = ids.indexOf(id);
        const next = index + direction;
        if (next < 0 || next >= ids.length)
            return;
        [ids[index], ids[next]] = [ids[next], ids[index]];
        change(ids);
        requestAnimationFrame(() => {
            if (focused instanceof HTMLElement && focused.isConnected && !focused.matches(':disabled'))
                focused.focus();
            else
                Array.from(panel.current?.querySelectorAll('input') ?? [])
                    .find((input) => input.dataset.toolbarId === id)
                    ?.focus();
        });
    };
    return (_jsxs(FinderToolbarGroup, { ref: group, "aria-label": label, className: "pt-finder-toolbar-items", style: { width: preferredWidth, flexBasis: preferredWidth }, children: [selected.slice(0, slots).map((item) => (_jsx(FinderToolbarButton, { label: item.label, disabled: item.disabled, "aria-pressed": item.pressed, onClick: item.onSelect, children: item.icon }, item.id))), _jsx(FinderActions, { label: "More tools", menuLabel: "More toolbar tools", icon: overflowIcon, actions: [
                    ...selected.slice(slots).map((item) => ({ ...item, checked: item.pressed })),
                    ...(onSelectedIdsChange
                        ? [{ id: 'customize-toolbar', label: 'Customize Toolbar…', onSelect: customize }]
                        : []),
                ], disabled: !onSelectedIdsChange && selected.length <= slots }), _jsxs("div", { ref: panel, id: panelId, popover: "auto", role: "dialog", "aria-label": "Customize Toolbar", className: "pt-toolbar-customize", style: position, onToggle: (event) => {
                    if (event.newState === 'open')
                        panel.current?.querySelector('input')?.focus();
                }, onKeyDown: (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        panel.current?.hidePopover();
                        returnFocus.current?.focus();
                    }
                }, children: [_jsx("h2", { className: "pt-toolbar-customize-title", children: "Customize Toolbar" }), _jsx("p", { children: "Choose tools, then adjust their order." }), [
                        ...selected,
                        ...items.filter((item) => !selected.some((selected) => selected.id === item.id)),
                    ].map((item) => {
                        const index = selected.findIndex((selected) => selected.id === item.id);
                        return (_jsxs("div", { className: "pt-toolbar-customize-row", children: [_jsxs("label", { className: "pt-toolbar-customize-label", children: [_jsx("input", { "data-toolbar-id": item.id, type: "checkbox", checked: index >= 0, onChange: (event) => change(event.target.checked
                                                ? [...selected.map((item) => item.id), item.id]
                                                : selected
                                                    .filter((selected) => selected.id !== item.id)
                                                    .map((item) => item.id)) }), item.label] }), _jsxs("span", { className: "pt-toolbar-customize-order", children: [_jsx("button", { type: "button", "aria-label": `Move ${item.label} earlier`, disabled: index <= 0, onClick: () => move(item.id, -1), children: "\u2191" }), _jsx("button", { type: "button", "aria-label": `Move ${item.label} later`, disabled: index < 0 || index === selected.length - 1, onClick: () => move(item.id, 1), children: "\u2193" })] })] }, item.id));
                    }), _jsx("button", { type: "button", className: "p-button", onClick: () => change(items.map((item) => item.id)), children: "Restore default tools" })] })] }));
}
