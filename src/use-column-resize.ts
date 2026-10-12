"use client";
import type { RowData } from '@tanstack/react-table';
import { useEffect, useRef, type PointerEvent, type KeyboardEvent } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { createResizeController, type ResizeMember } from './resize-controller.js';
import { resizeEnvironment } from './resize-dom.js';
import { persistResize } from './resize-persistence.js';
import type { ColumnResizeOptions } from './resize-types.js';
export type { ColumnResizeOptions } from './resize-types.js';
const controllers = new WeakMap<object, ReturnType<typeof createResizeController>>();

export function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, options: ColumnResizeOptions = {}) {
  const key = table.atoms.columnSizing;
  let controller = controllers.get(key);
  if (!controller) { controller = createResizeController(resizeEnvironment, persistResize); controllers.set(key, controller); }
  const adapter = {
    snapshot: () => Object.fromEntries(table.getAllLeafColumns().map(column => [column.id, column.getSize()])),
    bounds: (id: string) => {
      const column = table.getColumn(id)!;
      return { id, size: column.columnDef.size ?? 150, minSize: column.columnDef.minSize ?? 20, maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER };
    },
    apply: (widths: Record<string, number>) => table.setColumnSizing(widths),
    reset: (id: string) => table.getColumn(id)!.resetSize(),
  };
  const member = useRef<ResizeMember>({ adapter, options });
  // Update committed configuration before lifecycle registration or cancellation.
  useEffect(() => { member.current.adapter = adapter; member.current.options = options; });
  useEffect(() => controller.retain(member.current), [controller]);
  useEffect(() => {
    if (options.enabled === false) controller.cancelMember(member.current);
    return () => controller.cancelMember(member.current);
  }, [controller, options.enabled, options.storageKey, options.storage, options.cancelMediaQuery, options.dragClassName]);
  const consume = (event: { preventDefault(): void; stopPropagation(): void }) => { event.preventDefault(); event.stopPropagation(); };
  return { handle: (id: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => { if (controller.begin(member.current, id, event.clientX, event.pointerId, event.currentTarget, event.button)) consume(event); },
    onPointerMove: (event: PointerEvent<HTMLElement>) => controller.move(member.current, event.pointerId, event.clientX),
    onPointerUp: (event: PointerEvent<HTMLElement>) => controller.end(member.current, event.pointerId),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => controller.cancel(member.current, event.pointerId),
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => controller.cancel(member.current, event.pointerId),
    onDoubleClick: () => { controller.reset(member.current, id); },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => { if (controller.key(member.current, id, event.key, event.shiftKey)) consume(event); },
  }) };
}
