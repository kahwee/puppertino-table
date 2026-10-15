'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { closestCenter, DndContext, DragOverlay, MouseSensor, TouchSensor, useDndContext, useSensor, useSensors, } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable, } from '@dnd-kit/sortable';
import { createContext, useContext, useEffect, useId, useRef, useState, } from 'react';
import { tableBehavior } from './table-behavior.js';
/** Preserve absent/hidden IDs while moving visible leaf columns through native table state. */
export function reorderColumn(order, visible, locked, active, over) {
    const all = [...new Set([...order, ...visible])];
    if (active === over ||
        !visible.includes(active) ||
        !visible.includes(over) ||
        locked.includes(active) ||
        locked.includes(over))
        return all;
    const next = arrayMove(all, all.indexOf(active), all.indexOf(over));
    return [
        ...locked.filter((id) => next.includes(id)),
        ...next.filter((id) => !locked.includes(id)),
    ];
}
export const ColumnOrderScope = createContext(false);
const DragPreview = createContext({
    active: null,
    over: null,
    after: false,
});
/** DnD Kit contexts and announcements stay outside the semantic table. */
export function ColumnOrderProvider({ table, onCommit, children, }) {
    const id = useId();
    const [active, setActive] = useState(null);
    const [over, setOver] = useState(null);
    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));
    const point = useRef(null);
    useEffect(() => {
        if (!active)
            return;
        const mouse = (event) => {
            point.current = { x: event.clientX, y: event.clientY };
        };
        const touch = (event) => {
            const item = event.touches[0];
            if (item)
                point.current = { x: item.clientX, y: item.clientY };
        };
        window.addEventListener('mousemove', mouse, true);
        window.addEventListener('touchmove', touch, true);
        return () => {
            window.removeEventListener('mousemove', mouse, true);
            window.removeEventListener('touchmove', touch, true);
        };
    }, [active]);
    const behavior = tableBehavior(table);
    const columns = table.getAllLeafColumns();
    const visible = columns.map((column) => column.id);
    const enabled = behavior.reorderable && table.getHeaderGroups().length === 1;
    const schema = JSON.stringify([visible, behavior.lockedColumns]);
    const startedSchema = useRef(schema);
    const cancelled = useRef(false);
    const [wasEnabled, setWasEnabled] = useState(enabled);
    useEffect(() => {
        if (enabled)
            setWasEnabled(true);
    }, [enabled]);
    useEffect(() => {
        if (active && (!enabled || startedSchema.current !== schema)) {
            cancelled.current = true;
            setActive(null);
            setOver(null);
        }
    }, [active, enabled, schema]);
    const label = (key) => {
        const column = columns.find((column) => column.id === key);
        return typeof column?.columnDef.header === 'string' ? column.columnDef.header : (key ?? '');
    };
    const clear = () => {
        setActive(null);
        setOver(null);
    };
    const finish = (event) => {
        clear();
        if (cancelled.current || !enabled || startedSchema.current !== schema || !event.over)
            return;
        const target = event.over.rect, cursor = point.current;
        if (!cursor ||
            cursor.x < target.left ||
            cursor.x > target.right ||
            cursor.y < target.top ||
            cursor.y > target.bottom)
            return;
        const next = reorderColumn(table.atoms.columnOrder.get(), visible, behavior.lockedColumns, String(event.active.id), String(event.over.id));
        if (JSON.stringify(next) ===
            JSON.stringify([...new Set([...table.atoms.columnOrder.get(), ...visible])]))
            return;
        table.setColumnOrder(next);
        onCommit?.(next);
    };
    // Keep the boundary after activation so column changes and busy mode preserve row DOM.
    if (!enabled && !wasEnabled)
        return children;
    return (_jsxs(DndContext, { id: id, sensors: sensors, cancelDrop: () => cancelled.current || !enabled || startedSchema.current !== schema, collisionDetection: closestCenter, modifiers: [restrictToHorizontalAxis], onDragStart: (event) => {
            cancelled.current = false;
            startedSchema.current = schema;
            point.current = null;
            setActive(String(event.active.id));
        }, onDragOver: (event) => setOver(event.over ? String(event.over.id) : null), onDragCancel: clear, onDragEnd: finish, accessibility: {
            screenReaderInstructions: {
                draggable: 'Drag a column header to reorder. For keyboard reordering, open column options and choose Move earlier or Move later.',
            },
            announcements: {
                onDragStart: (event) => `Picked up ${label(String(event.active.id))} column.`,
                onDragOver: (event) => event.over
                    ? `${label(String(event.active.id))} will move ${visible.indexOf(String(event.active.id)) < visible.indexOf(String(event.over.id)) ? 'after' : 'before'} ${label(String(event.over.id))}.`
                    : 'Outside column headers.',
                onDragEnd: () => 'Column drag finished.',
                onDragCancel: () => 'Column drag cancelled. Order unchanged.',
            },
        }, children: [_jsx(SortableContext, { items: visible.filter((key) => !behavior.lockedColumns.includes(key)), disabled: !enabled, strategy: horizontalListSortingStrategy, children: _jsx(ColumnOrderScope, { value: true, children: _jsx(DragPreview, { value: {
                            active,
                            over,
                            after: !!active && !!over && visible.indexOf(active) < visible.indexOf(over),
                        }, children: children }) }) }), _jsx(DragOverlay, { dropAnimation: null, children: active ? _jsx("div", { className: "pt-column-drag-preview", children: label(active) }) : null })] }));
}
export function OrderableHeaderCell({ id, locked, children, ...props }) {
    const { listeners, setNodeRef, attributes, isDragging } = useSortable({ id, disabled: locked });
    const drag = useContext(DragPreview);
    const { active: nativeActive } = useDndContext();
    const eligible = (target) => target instanceof Element && !target.closest('.pt-resizer, .pt-header-menu-trigger, input, a');
    return (_jsx("th", { ...props, ref: setNodeRef, "data-pt-orderable": !locked || undefined, "data-pt-dragging": isDragging || undefined, "data-pt-drop": nativeActive && drag.active && drag.over === id && drag.active !== id
            ? drag.after
                ? 'after'
                : 'before'
            : undefined, "aria-describedby": locked ? undefined : attributes['aria-describedby'], onContextMenu: (event) => {
            if (nativeActive)
                event.preventDefault();
            else
                props.onContextMenu?.(event);
        }, onMouseDown: (event) => {
            if (!locked && eligible(event.target))
                listeners?.onMouseDown?.(event);
        }, onTouchStart: (event) => {
            if (!locked && eligible(event.target))
                listeners?.onTouchStart?.(event);
        }, children: children }));
}
