'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState, } from 'react';
import { columnSizeBounds } from './sizing.js';
import { useBrowserWidthPreferences } from './use-browser-width-preferences.js';
import { useResizeGesture } from './use-resize-gesture.js';
const clampPaneSize = (value, bounds) => typeof value === 'number' && Number.isFinite(value)
    ? Math.max(bounds.minSize, Math.min(bounds.maxSize, value))
    : bounds.size;
/** Adjacent sidebar/content/detail panes, thin dividers and compact single-pane navigation. */
export function SplitView({ panes, ariaLabel, orientation = 'horizontal', activePaneId, sizes: controlled, onSizesChange, onSizesCommit, resizable = true, disabled = false, cancelMediaQuery, storageKey, storage, className = '', style, }) {
    columnSizeBounds(panes.map((pane) => ({
        id: pane.id,
        size: pane.size ?? 240,
        minSize: pane.minSize ?? 160,
        maxSize: pane.maxSize ?? 720,
    })));
    const ids = panes.map((pane) => pane.id);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length)
        throw new Error('Split view panes need unique, nonempty IDs.');
    const visible = panes.filter((pane) => !pane.hidden);
    const [extent, setExtent] = useState();
    const bounds = columnSizeBounds(visible.slice(0, -1).map((pane) => ({
        id: pane.id,
        size: pane.size ?? 240,
        minSize: pane.minSize ?? 160,
        maxSize: pane.maxSize ?? 720,
    })));
    const minimum = visible.reduce((sum, pane) => sum + (pane.minSize ?? 160), 0);
    const preferences = useBrowserWidthPreferences({
        appOwned: controlled !== undefined,
        storageKey,
        storage,
    });
    const requested = Object.fromEntries(bounds.map((bound) => [
        bound.id,
        clampPaneSize((controlled ?? preferences.widths)[bound.id], bound),
    ]));
    const fit = (next) => {
        const normalized = Object.fromEntries(bounds.map((bound) => [bound.id, clampPaneSize(next[bound.id], bound)]));
        if (extent === undefined)
            return normalized;
        const minimumDetail = visible.at(-1)?.minSize ?? 160;
        const budget = Math.max(0, extent - minimumDetail - bounds.length);
        const total = bounds.reduce((sum, bound) => sum + normalized[bound.id], 0);
        const minimumAncestors = bounds.reduce((sum, bound) => sum + bound.minSize, 0);
        if (total > budget && total > minimumAncestors) {
            const ratio = Math.max(0, (budget - minimumAncestors) / (total - minimumAncestors));
            for (const bound of bounds)
                normalized[bound.id] = bound.minSize + (normalized[bound.id] - bound.minSize) * ratio;
        }
        return normalized;
    };
    const sizes = fit(requested);
    const snapshot = useRef(sizes);
    const surface = useRef(null);
    const owner = useRef({});
    const [compact, setCompact] = useState(false);
    const activeId = visible.some((pane) => pane.id === activePaneId) ? activePaneId : visible[0]?.id;
    const apply = (next) => {
        const normalized = fit(next);
        snapshot.current = normalized;
        if (controlled === undefined)
            preferences.apply(normalized);
        onSizesChange?.(normalized);
        return normalized;
    };
    const resize = useResizeGesture(owner.current, {
        coupled: true,
        snapshot: () => snapshot.current,
        bounds: (id) => {
            const bound = bounds.find((item) => item.id === id);
            if (!bound)
                throw new Error(`Unknown split pane: ${id}`);
            return bound;
        },
        apply,
        reset: (id) => apply({ ...snapshot.current, [id]: bounds.find((bound) => bound.id === id)?.size ?? 240 }),
    }, {
        enabled: resizable && !disabled && !compact && (controlled === undefined || !!onSizesChange),
        axis: orientation === 'vertical' ? 'y' : 'x',
        cancelMediaQuery,
        dragClassName: orientation === 'vertical' ? 'pt-vertical-resizing' : undefined,
        onCommit: (next) => {
            preferences.commit(next);
            onSizesCommit?.({ ...next });
        },
    });
    const schema = JSON.stringify([
        bounds,
        orientation,
        storageKey,
        controlled !== undefined,
        extent,
    ]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: Cancel on committed pane/bounds/ownership changes rather than adapter object identity.
    useEffect(() => () => resize.cancel(), [schema, storage]);
    useLayoutEffect(() => {
        snapshot.current = sizes;
    });
    useLayoutEffect(() => {
        const element = surface.current;
        if (!element)
            return;
        const update = () => {
            setExtent(orientation === 'horizontal' ? element.clientWidth : element.clientHeight);
            setCompact(orientation === 'horizontal' && element.clientWidth < minimum);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [orientation, minimum]);
    useLayoutEffect(() => {
        const element = surface.current;
        const focused = element?.ownerDocument.activeElement;
        if (!element || !focused || !element.contains(focused))
            return;
        const hiddenPane = focused.closest('.pt-split-pane');
        if (hiddenPane?.hidden) {
            const next = Array.from(element.querySelectorAll('.pt-split-pane')).find((pane) => !pane.hidden);
            next?.focus();
        }
    });
    return (_jsx("section", { ref: surface, "aria-label": ariaLabel, className: `pt-split-view ${className}`, "data-orientation": orientation, "data-compact": compact, style: style, children: panes.map((pane) => {
            const index = visible.indexOf(pane);
            const bound = bounds[index];
            const hidden = pane.hidden || (compact && pane.id !== activeId);
            return (_jsxs("section", { className: "pt-split-pane", "aria-label": pane.label, tabIndex: -1, hidden: hidden, style: {
                    flexBasis: compact ? '100%' : bound ? sizes[pane.id] : (pane.minSize ?? 160),
                    flexGrow: compact || index === visible.length - 1 ? 1 : 0,
                }, children: [_jsx("div", { className: "pt-split-pane-content", children: pane.content }), bound &&
                        !hidden &&
                        !compact &&
                        resizable &&
                        !disabled &&
                        (controlled === undefined || !!onSizesChange) && (_jsx("span", { role: "separator", className: "pt-split-divider", tabIndex: 0, "aria-label": `Resize ${pane.label} pane`, "aria-orientation": orientation === 'horizontal' ? 'vertical' : 'horizontal', "aria-valuemin": bound.minSize, "aria-valuemax": bound.maxSize, "aria-valuenow": sizes[pane.id], title: "Drag to resize; arrow keys adjust, Enter resets, Escape cancels.", ...resize.handle(pane.id) }))] }, pane.id));
        }) }));
}
