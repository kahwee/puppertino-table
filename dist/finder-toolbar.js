'use client';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ContextMenu } from './context-menu.js';
/** Without handlers, traffic lights are decoration rather than inert buttons. */
export function FinderWindowControls({ onClose, onMinimize, onZoom }) {
    return (_jsx("span", { className: "p-traffic-lights", children: [
            ['close', 'Close window', onClose],
            ['min', 'Minimize window', onMinimize],
            ['zoom', 'Zoom window', onZoom],
        ].map(([name, label, handler]) => handler ? (_jsx("button", { type: "button", className: `p-traffic-light p-traffic-light-${name}`, "aria-label": label, onClick: handler }, name)) : (_jsx("span", { className: `p-traffic-light p-traffic-light-${name}`, "aria-hidden": "true" }, name))) }));
}
export function FinderToolbar({ windowControls = _jsx(FinderWindowControls, {}), children, className = '', ...props }) {
    return (_jsxs("header", { ...props, className: `pt-finder-toolbar ${className}`, children: [_jsx("div", { className: "pt-finder-titlebar", children: windowControls }), _jsx("div", { className: "pt-finder-toolbar-content", children: children })] }));
}
export function FinderToolbarGroup({ className = '', ...props }) {
    return _jsx("fieldset", { ...props, className: `p-toolbar-group pt-finder-toolbar-group ${className}` });
}
export function FinderToolbarButton({ className = '', ...props }) {
    return _jsx("button", { type: "button", ...props, className: `p-toolbar-btn ${className}` });
}
export function FinderTitle({ as: Heading = 'h1', className = '', ...props }) {
    return _jsx(Heading, { ...props, className: `pt-finder-title ${className}` });
}
export function FinderHistory({ onBack, onForward, backIcon, forwardIcon }) {
    return (_jsxs(FinderToolbarGroup, { "aria-label": "Navigation history", className: "pt-finder-history", children: [_jsx(FinderToolbarButton, { "aria-label": "Back", title: "Back", disabled: !onBack, onClick: onBack, children: backIcon }), _jsx("span", { className: "p-toolbar-divider", "aria-hidden": "true" }), _jsx(FinderToolbarButton, { "aria-label": "Forward", title: "Forward", disabled: !onForward, onClick: onForward, children: forwardIcon })] }));
}
export function FinderViewSwitcher({ value, onValueChange, icons, className = '', ...props }) {
    return (_jsx(FinderToolbarGroup, { "aria-label": "View", ...props, className: `pt-finder-views ${className}`, children: ['icons', 'list', 'columns', 'gallery'].map((view) => (_jsx(FinderToolbarButton, { "aria-label": view[0].toUpperCase() + view.slice(1), title: `${view === 'icons' ? 'Icon' : view[0].toUpperCase() + view.slice(1)} view`, "aria-pressed": value === view, onClick: () => onValueChange(view), children: icons[view] }, view))) }));
}
export function FinderSearch({ value, onValueChange, icon, ariaLabel = 'Search files', placeholder = 'Search', disabled, collapsible = true, }) {
    const [expanded, setExpanded] = useState(false);
    const input = useRef(null);
    const trigger = useRef(null);
    return expanded || value || !collapsible ? (_jsx("label", { className: "p-search p-search-xlarge pt-finder-search", children: _jsx("input", { ref: input, type: "search", "aria-label": ariaLabel, placeholder: placeholder, disabled: disabled, value: value, onChange: (event) => onValueChange(event.target.value), onKeyDown: (event) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    onValueChange('');
                    setExpanded(false);
                    if (collapsible)
                        requestAnimationFrame(() => trigger.current?.focus());
                }
            } }) })) : (_jsx("button", { ref: trigger, type: "button", className: "p-toolbar-circle", "aria-label": "Search", title: "Search", disabled: disabled, onClick: () => {
            setExpanded(true);
            requestAnimationFrame(() => input.current?.focus());
        }, children: icon }));
}
export function FinderActions({ actions, icon, label = 'Actions', menuLabel = 'Finder actions', disabled, }) {
    const [menu, setMenu] = useState(null);
    useEffect(() => {
        if (disabled)
            setMenu(null);
    }, [disabled]);
    return (_jsxs(_Fragment, { children: [_jsx(FinderToolbarButton, { "aria-label": label, title: label, disabled: disabled, "aria-haspopup": "menu", "aria-expanded": !!menu && !disabled, onClick: (event) => {
                    const target = event.currentTarget;
                    const rect = target.getBoundingClientRect();
                    setMenu(menu
                        ? null
                        : {
                            context: null,
                            position: { x: rect.right - 220, y: rect.bottom + 6 },
                            returnFocus: target,
                        });
                }, children: icon }), _jsx(ContextMenu, { ariaLabel: menuLabel, position: disabled ? null : (menu?.position ?? null), returnFocus: menu?.returnFocus, onClose: () => setMenu(null), actions: actions })] }));
}
