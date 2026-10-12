'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState, } from 'react';
import { fitColumnPanels } from './column-browser-layout.js';
import { DensityScope } from './density.js';
import { clampSize, columnSizeBounds } from './sizing.js';
import { useResizeGesture } from './use-resize-gesture.js';
/** Caller-rendered hierarchy. No fetching, navigation, selection or application commands. */
export function ColumnBrowser({ panels, ariaLabel, density = 'compact', densityMetrics, minimumCurrentWidth = 288, resizable = true, resizeDisabled: disabled = false, cancelMediaQuery, widths: controlled, onWidthsChange, className = '', style, }) {
    const ids = panels.map((panel) => panel.id);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
        throw new Error('Browser panels need unique stable IDs.');
    if (!Number.isFinite(minimumCurrentWidth) || minimumCurrentWidth <= 0)
        throw new RangeError('The current panel minimum must be positive and finite.');
    const bounds = columnSizeBounds(panels.slice(0, -1).map((panel) => ({
        id: panel.id,
        size: panel.width ?? 224,
        minSize: panel.minWidth ?? 120,
        maxSize: panel.maxWidth ?? 640,
    })));
    const [localWidths, setLocalWidths] = useState({});
    const widths = Object.fromEntries(bounds.map((bound) => [bound.id, clampSize((controlled ?? localWidths)[bound.id], bound)]));
    const snapshot = useRef(widths);
    const surface = useRef(null);
    const owner = useRef({});
    const apply = (next) => {
        const normalized = Object.fromEntries(bounds.map((bound) => [bound.id, clampSize(next[bound.id], bound)]));
        if (controlled === undefined)
            setLocalWidths(normalized);
        onWidthsChange?.(normalized);
    };
    const resize = useResizeGesture(owner.current, {
        snapshot: () => snapshot.current,
        bounds: (id) => {
            const bound = bounds.find((bound) => bound.id === id);
            if (!bound)
                throw new Error(`Unknown browser panel: ${id}`);
            return bound;
        },
        apply,
        reset: (id) => apply({ ...snapshot.current, [id]: bounds.find((bound) => bound.id === id)?.size ?? 224 }),
    }, {
        enabled: resizable && !disabled && (controlled === undefined || !!onWidthsChange),
        cancelMediaQuery,
    });
    const schema = JSON.stringify(bounds);
    useLayoutEffect(() => {
        snapshot.current = widths;
    });
    // Panel removal or changed bounds cancel a drag just as table schema changes do.
    // biome-ignore lint/correctness/useExhaustiveDependencies: Cancellation is keyed to stable schema values, not newly created handler objects.
    useEffect(() => () => resize.cancel(), [schema]);
    const geometry = JSON.stringify(bounds.map((bound) => widths[bound.id]));
    useLayoutEffect(() => {
        const element = surface.current;
        if (!element)
            return;
        const ancestorWidths = JSON.parse(geometry);
        const fit = () => {
            const layout = fitColumnPanels(element.clientWidth, ancestorWidths, minimumCurrentWidth);
            element.style.setProperty('--pt-current-panel-width', `${layout.currentWidth}px`);
            element.scrollLeft = layout.scrollLeft;
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(element);
        return () => observer.disconnect();
    }, [geometry, minimumCurrentWidth]);
    return (_jsx(DensityScope, { ref: surface, density: density, metrics: densityMetrics, className: `pt-column-browser ${className}`, style: style, role: "region", tabIndex: 0, "aria-label": ariaLabel, children: panels.map((panel, index) => {
            const bound = bounds[index];
            return (_jsxs("section", { className: "pt-browser-panel", "aria-label": panel.label, style: { flexBasis: bound ? widths[panel.id] : 'var(--pt-current-panel-width, 100%)' }, children: [_jsx("div", { className: "pt-browser-panel-content", children: panel.content }), bound && resizable && !disabled && (controlled === undefined || !!onWidthsChange) && (_jsx("span", { className: "pt-panel-resizer", role: "separator", tabIndex: 0, "aria-orientation": "vertical", "aria-label": `Resize ${panel.label} panel`, "aria-valuemin": bound.minSize, "aria-valuemax": bound.maxSize, "aria-valuenow": widths[panel.id], title: "Drag to resize. Arrow keys adjust width; Enter resets and Escape cancels.", ...resize.handle(panel.id) }))] }, panel.id));
        }) }));
}
export function ColumnBrowserItem({ icon, trailing, selected = false, pathSelected = false, className = '', children, ...props }) {
    return (_jsxs("button", { type: "button", ...props, className: `pt-browser-item ${selected ? 'p-selected' : ''} ${pathSelected ? 'pt-path-selected' : ''} ${className}`, "aria-pressed": selected, "aria-current": pathSelected ? 'location' : undefined, children: [icon && (_jsx("span", { className: "pt-icon", "aria-hidden": "true", children: icon })), _jsx("span", { className: "pt-item-label", children: children }), trailing && (_jsx("span", { className: "pt-item-trailing", "aria-hidden": "true", children: trailing }))] }));
}
