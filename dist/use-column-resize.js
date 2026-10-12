"use client";
import { useEffect, useRef } from 'react';
import { createResizeController } from './resize-controller.js';
import { resizeEnvironment } from './resize-dom.js';
import { persistResize } from './resize-persistence.js';
const controllers = new WeakMap();
export function useColumnResize(table, options = {}) {
    const key = table.atoms.columnSizing;
    let controller = controllers.get(key);
    if (!controller) {
        controller = createResizeController(resizeEnvironment, persistResize);
        controllers.set(key, controller);
    }
    const adapter = {
        snapshot: () => Object.fromEntries(table.getAllLeafColumns().map(column => [column.id, column.getSize()])),
        bounds: (id) => {
            const column = table.getColumn(id);
            return { id, size: column.columnDef.size ?? 150, minSize: column.columnDef.minSize ?? 20, maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER };
        },
        apply: (widths) => table.setColumnSizing(widths),
        reset: (id) => table.getColumn(id).resetSize(),
    };
    const member = useRef({ adapter, options });
    // Update committed configuration before lifecycle registration or cancellation.
    useEffect(() => { member.current.adapter = adapter; member.current.options = options; });
    useEffect(() => controller.retain(member.current), [controller]);
    useEffect(() => {
        if (options.enabled === false)
            controller.cancelMember(member.current);
        return () => controller.cancelMember(member.current);
    }, [controller, options.enabled, options.storageKey, options.storage, options.cancelMediaQuery, options.dragClassName]);
    const consume = (event) => { event.preventDefault(); event.stopPropagation(); };
    return { handle: (id) => ({
            onPointerDown: (event) => { if (controller.begin(member.current, id, event.clientX, event.pointerId, event.currentTarget, event.button))
                consume(event); },
            onPointerMove: (event) => controller.move(member.current, event.pointerId, event.clientX),
            onPointerUp: (event) => controller.end(member.current, event.pointerId),
            onPointerCancel: (event) => controller.cancel(member.current, event.pointerId),
            onLostPointerCapture: (event) => controller.cancel(member.current, event.pointerId),
            onDoubleClick: () => { controller.reset(member.current, id); },
            onKeyDown: (event) => { if (controller.key(member.current, id, event.key, event.shiftKey))
                consume(event); },
        }) };
}
