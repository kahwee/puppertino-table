// biome-ignore-all lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA treegrids use native table/cell elements with interactive hierarchy semantics.
// biome-ignore-all lint/a11y/useFocusableInteractive: This treegrid uses row focus, so cells are reached through their parent row.
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { memo, useMemo, useRef } from 'react';
import { ColumnOrderProvider } from './column-order.js';
import { DensityScope } from './density.js';
import { isCompositionKey } from './item-navigation.js';
import { RowSelectionCheckbox } from './row-selection-checkbox.js';
import { tableBehavior } from './table-behavior.js';
import { TableHeader } from './table-header.js';
import { useItemNavigation } from './use-item-navigation.js';
import { useOutline, validateOutlineItems } from './use-outline.js';
import { usePuppertinoTable } from './use-puppertino-table.js';
import { useRowSelectionGestures } from './use-row-selection-gestures.js';
export function visibleOutlineRows(rows, expanded) {
    const visible = [];
    const visit = (siblings, parentId) => {
        siblings.forEach((row, index) => {
            visible.push({ row, position: index + 1, siblingCount: siblings.length, parentId });
            if (expanded[row.id] === true)
                visit(row.subRows, row.id);
        });
    };
    visit(rows);
    return visible;
}
function OutlineBody({ table, outline, visible, getRowLabel, getRowProps, getCellProps, }) {
    const elements = useRef(new Map());
    const { orderedIds, rowsById } = useMemo(() => ({
        orderedIds: Object.freeze(visible.map(({ row }) => row.id)),
        rowsById: new Map(visible.map(({ row }) => [row.id, row])),
    }), [visible]);
    const behavior = tableBehavior(table);
    const gestures = useRowSelectionGestures(table, { orderedIds, disabled: behavior.disabled });
    const navigation = useItemNavigation({
        orderedIds,
        disabled: behavior.disabled,
        getItemElement: (id) => elements.current.get(id),
        getItemLabel: (id) => {
            const row = rowsById.get(id);
            return row ? getRowLabel(row.original) : '';
        },
        onNavigate: gestures.select,
    });
    const toggle = (row, recursive = false) => {
        navigation.focus(row.id);
        void outline.setExpanded(row.original, outline.expanded[row.id] !== true, recursive);
    };
    const keyDown = (event, item) => {
        if (event.defaultPrevented || isCompositionKey(event.nativeEvent))
            return;
        if (event.target === event.currentTarget &&
            !behavior.disabled &&
            !event.altKey &&
            !event.shiftKey &&
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === 'a' &&
            table.options.enableRowSelection !== false) {
            event.preventDefault();
            gestures.resetAnchor();
            table.setRowSelection((previous) => {
                const next = { ...previous };
                for (const { row } of visible)
                    if (row.getCanSelect())
                        next[row.id] = true;
                return next;
            });
            return;
        }
        if (event.target !== event.currentTarget ||
            behavior.disabled ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey)
            return;
        const { row, parentId } = item;
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (outline.expanded[row.id] !== true && outline.canExpand(row.original))
                void outline.setExpanded(row.original, true);
            else if (outline.expanded[row.id] === true && row.subRows[0]) {
                if (navigation.focus(row.subRows[0].id))
                    gestures.select(row.subRows[0].id);
            }
        }
        else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            if (outline.expanded[row.id] === true)
                void outline.setExpanded(row.original, false);
            else if (parentId && navigation.focus(parentId))
                gestures.select(parentId);
        }
        else if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (event.key === 'Enter' && outline.canExpand(row.original))
                toggle(row);
            else
                gestures.select(row.id, { shift: event.shiftKey, toggle: true });
        }
        else
            navigation.getItemProps(row.id).onKeyDown(event);
    };
    const showSelection = behavior.selectable && behavior.selectionCheckboxes;
    return (_jsx("tbody", { children: visible.map((item) => {
            const { row, position, siblingCount } = item;
            const canExpand = outline.canExpand(row.original);
            const expanded = outline.expanded[row.id] === true;
            const load = outline.loads.get(row.id);
            const context = {
                table,
                columnCount: table.getAllLeafColumns().length + (showSelection ? 1 : 0),
                selectable: behavior.selectable,
                disabled: behavior.disabled,
            };
            const rowProps = getRowProps?.(row, context);
            const rowAttributes = { ...rowProps };
            // Application attributes cannot replace native treegrid row semantics.
            delete rowAttributes.role;
            return (_createElement("tr", { ...rowAttributes, key: row.id, ref: (element) => {
                    if (element)
                        elements.current.set(row.id, element);
                    else
                        elements.current.delete(row.id);
                }, tabIndex: navigation.getItemProps(row.id).tabIndex, "aria-level": row.depth + 1, "aria-posinset": position, "aria-setsize": siblingCount, "aria-expanded": canExpand ? expanded : undefined, "aria-busy": load?.status === 'loading' || undefined, "aria-selected": behavior.selectable ? row.getIsSelected() : undefined, className: [row.getIsSelected() ? 'p-selected' : '', rowProps?.className]
                    .filter(Boolean)
                    .join(' ') || undefined, onFocus: (event) => {
                    navigation.getItemProps(row.id).onFocus();
                    rowProps?.onFocus?.(event);
                }, onKeyDown: (event) => {
                    rowProps?.onKeyDown?.(event);
                    if (!event.defaultPrevented)
                        keyDown(event, item);
                }, onClick: (event) => {
                    rowProps?.onClick?.(event);
                    if (event.defaultPrevented || event.target.closest('button,input,a'))
                        return;
                    navigation.focus(row.id);
                    gestures.select(row.id, {
                        shift: event.shiftKey,
                        toggle: event.metaKey || event.ctrlKey,
                    });
                } },
                showSelection && (_jsx("td", { role: "gridcell", className: "pt-selection", children: _jsx(RowSelectionCheckbox, { row: row, label: getRowLabel(row.original), orderedIds: orderedIds, disabled: behavior.disabled }) })),
                row.getAllCells().map((cell, index) => (_createElement("td", { ...getCellProps?.(cell, context), role: "gridcell", key: cell.id }, index === 0 ? (_jsxs("div", { className: "pt-outline-cell", style: { paddingInlineStart: row.depth * 18 }, children: [canExpand ? (_jsx("button", { type: "button", className: "pt-outline-disclosure", "aria-label": `${expanded ? 'Collapse' : 'Expand'} ${getRowLabel(row.original)}`, "aria-expanded": expanded, disabled: outline.readOnly, onClick: (event) => {
                                event.stopPropagation();
                                toggle(row, event.altKey);
                            }, children: _jsx("span", { className: "pt-outline-triangle", "data-expanded": expanded, "aria-hidden": "true" }) })) : (_jsx("span", { className: "pt-outline-spacer", "aria-hidden": "true" })), _jsx("span", { className: "pt-outline-label", children: _jsx(table.FlexRender, { cell: cell }) }), load?.status === 'loading' && (_jsx("span", { role: "status", className: "pt-outline-status", children: "Loading\u2026" })), load?.status === 'error' && (_jsxs("span", { className: "pt-outline-error", children: [_jsx("span", { role: "alert", children: "Could not load children." }), _jsxs("button", { type: "button", className: "p-button", disabled: outline.readOnly, onClick: (event) => {
                                        event.stopPropagation();
                                        void outline.retry(row.original);
                                    }, children: ["Retry ", getRowLabel(row.original)] })] }))] })) : (_jsx(table.FlexRender, { cell: cell })))))));
        }) }));
}
const MemoOutlineBody = memo(OutlineBody);
/** A resizable treegrid. Only the first data column exposes hierarchy; sorting stays within siblings. */
export function OutlineView(props) {
    const outline = useOutline({ ...props, getItemId: props.getRowId });
    validateOutlineItems(props.data, props.getRowId, outline.childrenFor);
    // Core row models are keyed by data identity; successful lazy loads rebuild the hierarchy.
    // biome-ignore lint/correctness/useExhaustiveDependencies: TanStack keys nested row-model construction by root data identity, including lazy child revisions.
    const data = useMemo(() => [...props.data], [props.data, outline.loadedChildren, props.cacheKey]);
    const table = usePuppertinoTable({ ...props, data, getSubRows: outline.childrenFor });
    const rows = table.getRowModel().rows;
    const visible = useMemo(() => visibleOutlineRows(rows, outline.expanded), [rows, outline.expanded]);
    const behavior = tableBehavior(table);
    const showSelection = behavior.selectable && behavior.selectionCheckboxes;
    // Sizing subscribers update geometry; header controls keep their own narrow subscriptions.
    const header = (_jsx(TableHeader, { table: table, getHeaderMenu: props.getHeaderMenu, onColumnOrderCommit: props.onColumnOrderCommit, selectionRows: visible.map(({ row }) => row), resizeOptions: {
            storageKey: props.columnSizing === undefined && !props.atoms?.columnSizing
                ? props.storageKey
                : undefined,
            storage: props.storage,
            cancelMediaQuery: props.cancelMediaQuery,
            onCommit: props.onColumnSizingCommit,
        } }));
    return (_jsx(DensityScope, { density: props.density, metrics: props.densityMetrics, role: "region", "aria-label": `${props.ariaLabel} scroll area`, tabIndex: 0, className: `pt-scroll pt-outline ${props.className ?? ''}`, children: _jsx(ColumnOrderProvider, { table: table, onCommit: props.onColumnOrderCommit, children: _jsx(table.Subscribe, { source: table.options.atoms?.columnSizing ?? table.atoms.columnSizing, children: () => (_jsxs("table", { className: "p-table pt-table", role: "treegrid", "aria-label": props.ariaLabel, "aria-multiselectable": behavior.selectable || undefined, style: { width: table.getTotalSize() + (showSelection ? 36 : 0) }, children: [props.caption && _jsx("caption", { children: props.caption }), _jsxs("colgroup", { children: [showSelection && _jsx("col", { style: { width: 36 } }), table.getAllLeafColumns().map((column) => (_jsx("col", { style: { width: column.getSize() } }, column.id)))] }), header, visible.length ? (_jsx(MemoOutlineBody, { table: table, outline: outline, visible: visible, getRowLabel: props.getRowLabel, getRowProps: props.getRowProps, getCellProps: props.getCellProps })) : (_jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { colSpan: table.getAllLeafColumns().length + (showSelection ? 1 : 0), children: props.emptyContent ?? 'No items' }) }) }))] })) }) }) }));
}
