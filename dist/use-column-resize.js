"use client";
import { useEffect, useRef } from 'react';
import { clampSize } from './sizing.js';
const activeClasses = new Map();
function markDrag(name, delta) {
    const count = Math.max(0, (activeClasses.get(name) || 0) + delta);
    if (count)
        activeClasses.set(name, count);
    else
        activeClasses.delete(name);
    document.documentElement.classList.toggle(name, count > 0);
}
/** One gesture and one set of global listeners for each table's sizing store. */
function createController() {
    const members = new Set();
    let drag = null;
    const snapshot = (table) => Object.fromEntries(table.getAllLeafColumns().map(column => [column.id, column.getSize()]));
    const bounds = (table, id) => {
        const column = table.getColumn(id);
        return { id, size: column.columnDef.size ?? 150, minSize: column.columnDef.minSize ?? 20, maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER };
    };
    const save = ({ table, options }) => {
        try {
            if (options.storageKey)
                (options.storage || localStorage).setItem(options.storageKey, JSON.stringify(snapshot(table)));
        }
        catch { /* Storage is optional. */ }
    };
    const finish = (cancel = false) => {
        const active = drag;
        if (!active)
            return;
        drag = null;
        active.removeMedia();
        markDrag(active.className, -1);
        if (active.target.hasPointerCapture(active.pointer))
            active.target.releasePointerCapture(active.pointer);
        active.member.table.setColumnSizing(cancel ? active.before : snapshot(active.member.table));
        if (!cancel)
            save(active.member);
    };
    const cancel = (event) => { if (event.key === 'Escape' && drag) {
        event.preventDefault();
        finish(true);
    } };
    const blur = () => finish(true);
    const cancelMember = (member) => { if (drag?.member === member)
        finish(true); };
    return {
        cancelMember,
        retain(member) {
            if (!members.size) {
                window.addEventListener('keydown', cancel);
                window.addEventListener('blur', blur);
            }
            members.add(member);
            return () => {
                cancelMember(member);
                members.delete(member);
                if (!members.size) {
                    window.removeEventListener('keydown', cancel);
                    window.removeEventListener('blur', blur);
                }
            };
        },
        handle(id, member) {
            const reset = () => { member.table.getColumn(id).resetSize(); save(member); };
            return {
                onPointerDown: (event) => {
                    const { table, options } = member;
                    if (options.enabled === false || event.button !== 0 || drag || !members.has(member))
                        return;
                    const media = options.cancelMediaQuery ? window.matchMedia(options.cancelMediaQuery) : undefined;
                    if (media?.matches)
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.focus();
                    const before = snapshot(table);
                    const modeChange = () => { if (media?.matches)
                        finish(true); };
                    drag = { member, id, x: event.clientX, width: before[id], before, target: event.currentTarget,
                        pointer: event.pointerId, className: options.dragClassName ?? 'pt-resizing', media,
                        removeMedia: () => media?.removeEventListener('change', modeChange) };
                    media?.addEventListener('change', modeChange);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    markDrag(drag.className, 1);
                },
                onPointerMove: (event) => {
                    const active = drag;
                    if (active?.member === member && active.pointer === event.pointerId) {
                        const { table } = member;
                        table.setColumnSizing({ ...snapshot(table), [active.id]: clampSize(active.width + event.clientX - active.x, bounds(table, active.id)) });
                    }
                },
                onPointerUp: (event) => {
                    if (drag?.member === member && event.pointerId === drag.pointer)
                        finish(member.options.enabled === false || !!drag.media?.matches);
                },
                onPointerCancel: (event) => { if (drag?.member === member && event.pointerId === drag.pointer)
                    finish(true); },
                onLostPointerCapture: (event) => { if (drag?.member === member && event.pointerId === drag.pointer)
                    finish(true); },
                onDoubleClick: () => { if (member.options.enabled !== false && !drag)
                    reset(); },
                onKeyDown: (event) => {
                    if (member.options.enabled === false || drag)
                        return;
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        reset();
                        return;
                    }
                    const { table } = member;
                    const step = event.shiftKey ? 40 : 16;
                    const widths = snapshot(table);
                    const next = event.key === 'ArrowLeft' ? widths[id] - step : event.key === 'ArrowRight' ? widths[id] + step : event.key === 'Home' ? bounds(table, id).minSize : event.key === 'End' ? bounds(table, id).maxSize : undefined;
                    if (next === undefined)
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    table.setColumnSizing({ ...widths, [id]: clampSize(next, bounds(table, id)) });
                    save(member);
                },
            };
        },
    };
}
// The atom survives table wrapper rerenders. Weak keys allow discarded tables to be collected.
const controllers = new WeakMap();
export function useColumnResize(table, options = {}) {
    const key = table.atoms.columnSizing;
    let controller = controllers.get(key);
    if (!controller) {
        controller = createController();
        controllers.set(key, controller);
    }
    const member = useRef({ table, options });
    member.current.table = table;
    member.current.options = options;
    useEffect(() => controller.retain(member.current), [controller]);
    useEffect(() => {
        if (options.enabled === false)
            controller.cancelMember(member.current);
        return () => controller.cancelMember(member.current);
    }, [controller, options.enabled, options.storageKey, options.storage, options.cancelMediaQuery, options.dragClassName]);
    return { handle: (id) => controller.handle(id, member.current) };
}
