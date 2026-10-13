'use client';
import { type KeyboardEvent, type PointerEvent, useLayoutEffect, useRef } from 'react';
import {
  createResizeController,
  type ResizeAdapter,
  type ResizeMember,
} from './resize-controller.js';
import { resizeEnvironment } from './resize-dom.js';
import { persistResize } from './resize-persistence.js';
import type { ColumnResizeOptions } from './resize-types.js';

const controllers = new WeakMap<object, ReturnType<typeof createResizeController>>();

/** Shared lifecycle/event adaptation for table columns and browser panels. */
export function useResizeGesture(
  key: object,
  adapter: ResizeAdapter,
  options: ColumnResizeOptions = {},
) {
  let controller = controllers.get(key);
  if (!controller) {
    controller = createResizeController(resizeEnvironment, persistResize);
    controllers.set(key, controller);
  }
  const member = useRef<ResizeMember>({ adapter, options });
  // Update committed configuration before lifecycle registration or cancellation.
  useLayoutEffect(() => {
    member.current.adapter = adapter;
    member.current.options = options;
  });
  useLayoutEffect(() => controller.retain(member.current), [controller]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing storage, responsive or cursor settings must cancel the active gesture.
  useLayoutEffect(() => {
    if (options.enabled === false) controller.cancelMember(member.current);
    return () => controller.cancelMember(member.current);
  }, [
    controller,
    options.enabled,
    options.storageKey,
    options.storage,
    options.cancelMediaQuery,
    options.dragClassName,
  ]);
  const consume = (event: { preventDefault(): void; stopPropagation(): void }) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return {
    cancel: () => controller.cancelMember(member.current),
    handle: (id: string) => ({
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (
          controller.begin(
            member.current,
            id,
            event.clientX,
            event.pointerId,
            event.currentTarget,
            event.button,
          )
        )
          consume(event);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) =>
        controller.move(member.current, event.pointerId, event.clientX),
      onPointerUp: (event: PointerEvent<HTMLElement>) =>
        controller.end(member.current, event.pointerId),
      onPointerCancel: (event: PointerEvent<HTMLElement>) =>
        controller.cancel(member.current, event.pointerId),
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) =>
        controller.cancel(member.current, event.pointerId),
      onDoubleClick: () => {
        controller.reset(member.current, id);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (controller.key(member.current, id, event.key, event.shiftKey)) consume(event);
      },
    }),
  };
}
