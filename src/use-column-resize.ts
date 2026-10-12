"use client";
import type { RowData } from '@tanstack/react-table';
import { useEffect, useRef, type PointerEvent, type KeyboardEvent } from 'react';
import type { PuppertinoTableInstance } from "./model.js";
import type { ColumnSizingState } from "@tanstack/react-table";
import { clampSize } from './sizing.js';
export interface ColumnResizeOptions {
  enabled?: boolean; storageKey?: string; storage?: Pick<Storage, 'setItem'>;
  cancelMediaQuery?: string; dragClassName?: string;
}
const activeClasses = new Map<string, number>();
function markDrag(name: string, delta: number) {
  const count = Math.max(0, (activeClasses.get(name) || 0) + delta);
  if (count) activeClasses.set(name, count); else activeClasses.delete(name);
  document.documentElement.classList.toggle(name, count > 0);
}

export function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, { enabled = true, storageKey, storage, cancelMediaQuery, dragClassName = "pt-resizing" }: ColumnResizeOptions = {}) {
  const bounds = (id: string) => {
    const column = table.getColumn(id)!;
    return { id, size: column.columnDef.size ?? 150, minSize: column.columnDef.minSize ?? 20, maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER };
  };
  const clamp = (id: string, value: number) => clampSize(value, bounds(id));
  const snapshot = () => Object.fromEntries(table.getAllLeafColumns().map(column => [column.id, column.getSize()])) as ColumnSizingState;
  const save = () => { try { if (storageKey) (storage || localStorage).setItem(storageKey, JSON.stringify(snapshot())); } catch { /* Resizing still works without storage. */ } };
  const reset = (id: string) => { table.getColumn(id)!.resetSize(); save(); };
  const drag = useRef<{ id: string; x: number; width: number; before: ColumnSizingState; target: HTMLElement; pointer: number } | null>(null);
  const apply = (next: ColumnSizingState, persist = false) => {
    table.setColumnSizing(next);
    if (persist) save();
  };
  const finish = (cancel = false) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    markDrag(dragClassName, -1);
    if (active.target.hasPointerCapture(active.pointer)) active.target.releasePointerCapture(active.pointer);
    apply(cancel ? active.before : snapshot(), !cancel);
  };
  useEffect(() => { if (!enabled) finish(true); }, [enabled]);
  useEffect(() => {
    const cancel = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && drag.current) { event.preventDefault(); finish(true); } };
    const blur = () => finish(true);
    const compact = cancelMediaQuery ? window.matchMedia(cancelMediaQuery) : undefined;
    const modeChange = () => { if (compact?.matches) finish(true); };
    compact?.addEventListener("change", modeChange);
    window.addEventListener('keydown', cancel); window.addEventListener('blur', blur);
    return () => {
      compact?.removeEventListener("change", modeChange);
      window.removeEventListener('keydown', cancel); window.removeEventListener('blur', blur);
      // Never save a gesture interrupted by route or display-mode changes.
      const active = drag.current; drag.current = null;
      if (active) markDrag(dragClassName, -1);
      if (active?.target.hasPointerCapture(active.pointer)) active.target.releasePointerCapture(active.pointer);
      if (active) table.setColumnSizing(active.before);
    };
  }, [table.atoms.columnSizing, cancelMediaQuery, dragClassName]);
  return { handle: (id: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0 || drag.current) return;
      event.preventDefault(); event.stopPropagation(); event.currentTarget.focus();
      const before = snapshot();
      drag.current = { id, x: event.clientX, width: before[id], before, target: event.currentTarget, pointer: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId); markDrag(dragClassName, 1);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const active = drag.current;
      if (active && active.pointer === event.pointerId) apply({ ...snapshot(), [active.id]: clamp(active.id, active.width + event.clientX - active.x) });
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => { if (event.pointerId === drag.current?.pointer) finish(!enabled || !!(cancelMediaQuery && window.matchMedia(cancelMediaQuery).matches)); },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => { if (event.pointerId === drag.current?.pointer) finish(true); },
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => { if (event.pointerId === drag.current?.pointer) finish(true); },
    onDoubleClick: () => { if (enabled) reset(id); },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!enabled || drag.current) return;
      if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); reset(id); return; }
      const step = event.shiftKey ? 40 : 16;
      const widths = snapshot();
      const next = event.key === 'ArrowLeft' ? widths[id] - step : event.key === 'ArrowRight' ? widths[id] + step : event.key === 'Home' ? bounds(id).minSize : event.key === 'End' ? bounds(id).maxSize : undefined;
      if (next === undefined) return;
      event.preventDefault(); event.stopPropagation(); apply({ ...snapshot(), [id]: clamp(id, next) }, true);
    },
  }) };
}
