'use client';
import { useLayoutEffect, useRef } from 'react';
import { createResizeController, } from './resize-controller.js';
import { resizeEnvironment } from './resize-dom.js';
import { persistResize } from './resize-persistence.js';
const controllers = new WeakMap();
/** Shared lifecycle/event adaptation for table columns and browser panels. */
export function useResizeGesture(key, adapter, options = {}) {
    let controller = controllers.get(key);
    if (!controller) {
        controller = createResizeController(resizeEnvironment, persistResize);
        controllers.set(key, controller);
    }
    const member = useRef({ adapter, options });
    // Update committed configuration before lifecycle registration or cancellation.
    useLayoutEffect(() => {
        member.current.adapter = adapter;
        member.current.options = options;
    });
    useLayoutEffect(() => controller.retain(member.current), [controller]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: Changing storage, responsive or cursor settings must cancel the active gesture.
    useLayoutEffect(() => {
        if (options.enabled === false)
            controller.cancelMember(member.current);
        return () => controller.cancelMember(member.current);
    }, [
        controller,
        options.enabled,
        options.storageKey,
        options.storage,
        options.cancelMediaQuery,
        options.dragClassName,
    ]);
    const consume = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return {
        cancel: () => controller.cancelMember(member.current),
        handle: (id) => ({
            onPointerDown: (event) => {
                if (controller.begin(member.current, id, event.clientX, event.pointerId, event.currentTarget, event.button))
                    consume(event);
            },
            onPointerMove: (event) => controller.move(member.current, event.pointerId, event.clientX),
            onPointerUp: (event) => controller.end(member.current, event.pointerId),
            onPointerCancel: (event) => controller.cancel(member.current, event.pointerId),
            onLostPointerCapture: (event) => controller.cancel(member.current, event.pointerId),
            onDoubleClick: () => {
                controller.reset(member.current, id);
            },
            onKeyDown: (event) => {
                if (controller.key(member.current, id, event.key, event.shiftKey))
                    consume(event);
            },
        }),
    };
}
