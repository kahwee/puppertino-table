'use client';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
/** Application-owned navigation; works independently of FinderWindow. */
export function Sidebar({ size = 'large', className = '', ...props }) {
    const sizeClass = size === 'large' ? '' : `p-sidebar-${size}`;
    return _jsx("nav", { ...props, className: `p-sidebar pt-sidebar ${sizeClass} ${className}` });
}
export function SidebarGroup({ label, children, className = '', ...props }) {
    const id = useId();
    return (_jsxs("section", { ...props, className: `pt-sidebar-group ${className}`, "aria-labelledby": id, children: [_jsx("h2", { id: id, className: "p-sidebar-header", children: label }), children] }));
}
export function SidebarItem({ selected, icon, iconTone = 'accent', detail, children, className = '', ...props }) {
    const content = (_jsxs(_Fragment, { children: [icon && (_jsx("span", { className: "p-sidebar-icon", "data-tone": iconTone, "aria-hidden": "true", children: icon })), _jsx("span", { className: "pt-sidebar-label", children: children }), detail != null && _jsx("span", { className: "p-sidebar-detail", children: detail })] }));
    const classes = `p-sidebar-row pt-sidebar-item ${selected ? 'p-selected' : ''} ${className}`;
    if (typeof props.href === 'string') {
        return (_jsx("a", { ...props, className: classes, "aria-current": selected ? 'page' : undefined, children: content }));
    }
    return (_jsx("button", { type: "button", ...props, className: classes, "aria-current": selected ? 'page' : undefined, children: content }));
}
