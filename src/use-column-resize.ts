"use client";
import type { RowData, ColumnSizingState } from '@tanstack/react-table';
import { useEffect, useRef, type PointerEvent, type KeyboardEvent } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { clampSize } from './sizing.js';
export interface ColumnResizeOptions {
  enabled?: boolean; storageKey?: string; storage?: Pick<Storage, 'setItem'>;
  cancelMediaQuery?: string; dragClassName?: string;
}
type Member<T extends RowData> = { table: PuppertinoTableInstance<T>; options: ColumnResizeOptions };
const activeClasses = new Map<string, number>();
function markDrag(name: string, delta: number) {
  const count = Math.max(0, (activeClasses.get(name) || 0) + delta);
  if (count) activeClasses.set(name, count); else activeClasses.delete(name);
  document.documentElement.classList.toggle(name, count > 0);
}

/** One gesture and one set of global listeners for each table's sizing store. */
function createController<T extends RowData>() {
  const members = new Set<Member<T>>();
  let drag: { member: Member<T>; id: string; x: number; width: number; before: ColumnSizingState;
    target: HTMLElement; pointer: number; className: string; media?: MediaQueryList; removeMedia: () => void } | null = null;
  const snapshot = (table: PuppertinoTableInstance<T>) => Object.fromEntries(table.getAllLeafColumns().map(column => [column.id, column.getSize()])) as ColumnSizingState;
  const bounds = (table: PuppertinoTableInstance<T>, id: string) => {
    const column = table.getColumn(id)!;
    return { id, size: column.columnDef.size ?? 150, minSize: column.columnDef.minSize ?? 20, maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER };
  };
  const save = ({ table, options }: Member<T>) => {
    try { if (options.storageKey) (options.storage || localStorage).setItem(options.storageKey, JSON.stringify(snapshot(table))); } catch { /* Storage is optional. */ }
  };
  const finish = (cancel = false) => {
    const active = drag;
    if (!active) return;
    drag = null;
    active.removeMedia();
    markDrag(active.className, -1);
    if (active.target.hasPointerCapture(active.pointer)) active.target.releasePointerCapture(active.pointer);
    active.member.table.setColumnSizing(cancel ? active.before : snapshot(active.member.table));
    if (!cancel) save(active.member);
  };
  const cancel = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && drag) { event.preventDefault(); finish(true); } };
  const blur = () => finish(true);
  const cancelMember = (member: Member<T>) => { if (drag?.member === member) finish(true); };
  return {
    cancelMember,
    retain(member: Member<T>) {
      if (!members.size) { window.addEventListener('keydown', cancel); window.addEventListener('blur', blur); }
      members.add(member);
      return () => {
        cancelMember(member);
        members.delete(member);
        if (!members.size) { window.removeEventListener('keydown', cancel); window.removeEventListener('blur', blur); }
      };
    },
    handle(id: string, member: Member<T>) {
      const reset = () => { member.table.getColumn(id)!.resetSize(); save(member); };
      return {
        onPointerDown: (event: PointerEvent<HTMLElement>) => {
          const { table, options } = member;
          if (options.enabled === false || event.button !== 0 || drag || !members.has(member)) return;
          const media = options.cancelMediaQuery ? window.matchMedia(options.cancelMediaQuery) : undefined;
          if (media?.matches) return;
          event.preventDefault(); event.stopPropagation(); event.currentTarget.focus();
          const before = snapshot(table);
          const modeChange = () => { if (media?.matches) finish(true); };
          drag = { member, id, x: event.clientX, width: before[id], before, target: event.currentTarget,
            pointer: event.pointerId, className: options.dragClassName ?? 'pt-resizing', media,
            removeMedia: () => media?.removeEventListener('change', modeChange) };
          media?.addEventListener('change', modeChange);
          event.currentTarget.setPointerCapture(event.pointerId); markDrag(drag.className, 1);
        },
        onPointerMove: (event: PointerEvent<HTMLElement>) => {
          const active = drag;
          if (active?.member === member && active.pointer === event.pointerId) {
            const { table } = member;
            table.setColumnSizing({ ...snapshot(table), [active.id]: clampSize(active.width + event.clientX - active.x, bounds(table, active.id)) });
          }
        },
        onPointerUp: (event: PointerEvent<HTMLElement>) => {
          if (drag?.member === member && event.pointerId === drag.pointer) finish(member.options.enabled === false || !!drag.media?.matches);
        },
        onPointerCancel: (event: PointerEvent<HTMLElement>) => { if (drag?.member === member && event.pointerId === drag.pointer) finish(true); },
        onLostPointerCapture: (event: PointerEvent<HTMLElement>) => { if (drag?.member === member && event.pointerId === drag.pointer) finish(true); },
        onDoubleClick: () => { if (member.options.enabled !== false && !drag) reset(); },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (member.options.enabled === false || drag) return;
          if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); reset(); return; }
          const { table } = member;
          const step = event.shiftKey ? 40 : 16;
          const widths = snapshot(table);
          const next = event.key === 'ArrowLeft' ? widths[id] - step : event.key === 'ArrowRight' ? widths[id] + step : event.key === 'Home' ? bounds(table, id).minSize : event.key === 'End' ? bounds(table, id).maxSize : undefined;
          if (next === undefined) return;
          event.preventDefault(); event.stopPropagation();
          table.setColumnSizing({ ...widths, [id]: clampSize(next, bounds(table, id)) }); save(member);
        },
      };
    },
  };
}
// The atom survives table wrapper rerenders. Weak keys allow discarded tables to be collected.
const controllers = new WeakMap<object, unknown>();
export function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, options: ColumnResizeOptions = {}) {
  const key = table.atoms.columnSizing;
  let controller = controllers.get(key) as ReturnType<typeof createController<T>> | undefined;
  if (!controller) { controller = createController<T>(); controllers.set(key, controller); }
  const member = useRef<Member<T>>({ table, options });
  member.current.table = table; member.current.options = options;
  useEffect(() => controller.retain(member.current), [controller]);
  useEffect(() => {
    if (options.enabled === false) controller.cancelMember(member.current);
    return () => controller.cancelMember(member.current);
  }, [controller, options.enabled, options.storageKey, options.storage, options.cancelMediaQuery, options.dragClassName]);
  return { handle: (id: string) => controller.handle(id, member.current) };
}
