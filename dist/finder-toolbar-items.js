'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FinderActions, FinderToolbarButton, FinderToolbarGroup } from './finder-toolbar.js';
/** Optional center tools shrink into a menu; navigation and Search stay outside this group. */
export function FinderToolbarItems({ items, selectedIds, onSelectedIdsChange, overflowIcon, label = 'Optional tools', }) {
    const selected = useMemo(() => [...new Set(selectedIds ?? items.map((item) => item.id))].flatMap((id) => {
        const item = items.find((item) => item.id === id);
        return item ? [item] : [];
    }), [items, selectedIds]);
    const group = useRef(null);
    const panel = useRef(null);
    const [slots, setSlots] = useState(selected.length);
    const panelId = useId();
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const returnFocus = useRef(null);
    const widthFor = useCallback((count) => {
        const tools = selected.slice(0, count);
        const groups = tools.filter((item, index) => index === 0 || item.group !== tools[index - 1].group).length;
        return count * 32 + groups * 4 + Math.max(0, groups - 1) * 8;
    }, [selected]);
    const customizable = !!onSelectedIdsChange;
    const preferredWidth = widthFor(selected.length) + (customizable ? 44 : 0);
    useEffect(() => {
        const node = group.current;
        if (!node)
            return;
        const measure = () => {
            const available = node.getBoundingClientRect().width;
            let next = selected.length;
            if (customizable || widthFor(next) > available + 0.5) {
                while (next > 0 && widthFor(next) + (next ? 44 : 36) > available + 0.5)
                    next--;
            }
            const focused = document.activeElement;
            const index = selected.findIndex((item) => focused instanceof HTMLElement && focused.dataset.toolbarItem === item.id);
            setSlots(next);
            if (index >= next && index >= 0)
                requestAnimationFrame(() => {
                    if (document.activeElement === document.body || document.activeElement === focused)
                        node.querySelector('[aria-label="More tools"]')?.focus();
                });
        };
        const resize = new ResizeObserver(measure);
        resize.observe(node);
        measure();
        return () => resize.disconnect();
    }, [selected, widthFor, customizable]);
    const positionPanel = useCallback(() => {
        const trigger = returnFocus.current;
        const dialog = panel.current;
        if (!trigger || !dialog)
            return;
        const rect = trigger.getBoundingClientRect();
        const bounds = dialog.getBoundingClientRect();
        setPosition({
            left: Math.max(8, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 8)),
            top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - bounds.height - 8)),
        });
    }, []);
    useEffect(() => {
        const reposition = () => {
            if (panel.current?.matches(':popover-open'))
                positionPanel();
        };
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        const resize = new ResizeObserver(reposition);
        if (group.current)
            resize.observe(group.current);
        if (panel.current)
            resize.observe(panel.current);
        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
            resize.disconnect();
        };
    }, [positionPanel]);
    const close = () => {
        panel.current?.hidePopover();
        returnFocus.current?.focus();
    };
    const customize = () => {
        const trigger = group.current?.querySelector('[aria-label="More tools"]');
        if (!trigger)
            return;
        returnFocus.current = trigger;
        requestAnimationFrame(() => {
            panel.current?.showPopover();
            positionPanel();
        });
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
    if (!selected.length && !customizable)
        return null;
    const clusters = [];
    for (const item of selected.slice(0, slots)) {
        const previous = clusters.at(-1);
        if (previous && previous.label === (item.group ?? label))
            previous.items.push(item);
        else
            clusters.push({ label: item.group ?? label, items: [item] });
    }
    return (_jsxs("fieldset", { ref: group, "aria-label": label, className: "pt-finder-toolbar-items", style: { width: preferredWidth, flexBasis: preferredWidth }, children: [clusters.map((cluster) => (_jsx(FinderToolbarGroup, { "aria-label": cluster.label, children: cluster.items.map((item) => (_jsx(FinderToolbarButton, { "data-toolbar-item": item.id, label: item.label, disabled: item.disabled, "aria-pressed": item.pressed, onClick: item.onSelect, children: item.icon }, item.id))) }, cluster.items[0].id))), (customizable || selected.length > slots) && (_jsx(FinderActions, { label: "More tools", menuLabel: "More toolbar tools", buttonClassName: "p-toolbar-circle", icon: overflowIcon, actions: [
                    ...selected.slice(slots).map((item) => ({ ...item, checked: item.pressed })),
                    ...(onSelectedIdsChange
                        ? [{ id: 'customize-toolbar', label: 'Customize Toolbar…', onSelect: customize }]
                        : []),
                ] })), _jsxs("div", { ref: panel, id: panelId, popover: "auto", role: "dialog", "aria-label": "Customize Toolbar", className: "pt-toolbar-customize", style: position, onToggle: (event) => {
                    if (event.newState === 'open')
                        panel.current?.querySelector('input')?.focus();
                }, onKeyDown: (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        close();
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
                                                    .map((item) => item.id)) }), _jsx("span", { className: "pt-toolbar-customize-icon", "aria-hidden": "true", children: item.icon }), item.label] }), _jsxs("span", { className: "pt-toolbar-customize-order", children: [_jsx("button", { type: "button", "aria-label": `Move ${item.label} earlier`, disabled: index <= 0, onClick: () => move(item.id, -1), children: "\u2191" }), _jsx("button", { type: "button", "aria-label": `Move ${item.label} later`, disabled: index < 0 || index === selected.length - 1, onClick: () => move(item.id, 1), children: "\u2193" })] })] }, item.id));
                    }), _jsxs("div", { className: "pt-toolbar-customize-footer", children: [_jsx("button", { type: "button", className: "p-button", onClick: () => change(items.map((item) => item.id)), children: "Restore default tools" }), _jsx("button", { type: "button", className: "p-button p-button-primary", onClick: close, children: "Done" })] })] })] }));
}
