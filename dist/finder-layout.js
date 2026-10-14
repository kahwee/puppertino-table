'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DensityScope } from './density.js';
import { Sidebar, SidebarGroup, SidebarItem, } from './sidebar.js';
export function FinderWindow({ appearance = 'classic', className = '', children, ...props }) {
    return (_jsx("section", { ...props, "data-appearance": appearance, className: `pt-finder-container ${className}`, children: _jsx("div", { className: "p-window pt-finder-window", children: children }) }));
}
export function FinderBody({ className = '', ...props }) {
    return _jsx(DensityScope, { ...props, className: `pt-finder-workspace ${className}` });
}
export function FinderContent({ className = '', ...props }) {
    return _jsx("div", { ...props, className: `pt-finder-content ${className}` });
}
export function FinderSidebar({ className = '', ...props }) {
    return _jsx(Sidebar, { ...props, className: `pt-finder-sidebar ${className}` });
}
export function FinderSidebarGroup({ className = '', ...props }) {
    return _jsx(SidebarGroup, { ...props, className: `pt-finder-sidebar-group ${className}` });
}
export function FinderSidebarItem({ className = '', ...props }) {
    return _jsx(SidebarItem, { ...props, className: `pt-finder-folder ${className}` });
}
export function FinderPathBar({ className = '', ...props }) {
    return _jsx("nav", { "aria-label": "Current location", ...props, className: `pt-finder-path ${className}` });
}
export function FinderStatusBar({ className = '', ...props }) {
    return _jsx("footer", { ...props, className: `pt-finder-status ${className}` });
}
export function FinderDetails({ className = '', ...props }) {
    return _jsx("aside", { ...props, className: `pt-finder-details ${className}` });
}
export function FinderPreview({ className = '', artwork, heading, description, children, ...props }) {
    return (_jsxs("div", { ...props, className: `pt-finder-preview ${className}`, children: [artwork && _jsx("div", { className: "pt-finder-preview-artwork", children: artwork }), heading && _jsx("h2", { children: heading }), description && _jsx("p", { children: description }), children] }));
}
export function FinderEmptyState({ className = '', ...props }) {
    return _jsx("div", { ...props, className: `pt-finder-empty ${className}` });
}
export function FinderIconGrid({ className = '', ...props }) {
    return _jsx("section", { ...props, className: `pt-finder-icon-grid ${className}` });
}
export function FinderIconItem({ selected, artwork, description, children, className = '', ...props }) {
    return (_jsxs("button", { type: "button", ...props, "aria-pressed": !!selected, className: `pt-finder-icon-item ${className}`, children: [artwork && _jsx("div", { className: "pt-finder-item-artwork", children: artwork }), _jsx("span", { children: children }), description && _jsx("small", { children: description })] }));
}
export function FinderGallery({ className = '', ...props }) {
    return _jsx("section", { ...props, className: `pt-finder-gallery ${className}` });
}
export function FinderFilmstrip({ className = '', ...props }) {
    return _jsx("section", { ...props, className: `pt-finder-filmstrip ${className}` });
}
export function FinderGalleryItem({ selected, ...props }) {
    return _jsx("button", { type: "button", ...props, "aria-pressed": !!selected });
}
