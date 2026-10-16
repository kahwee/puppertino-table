import type { ColumnResizeOptions } from './resize-types.js';
import { type ColumnSizeBounds, clampSize } from './sizing.js';
export type ResizeWidths = Record<string, number>;
export interface ResizeAdapter {
  /** Coupled panes may normalize multiple sizes in one gesture. */
  coupled?: boolean;
  snapshot(): ResizeWidths;
  bounds(id: string): ColumnSizeBounds;
  // biome-ignore lint/suspicious/noConfusingVoidType: Independent adapters return void; coupled adapters can return normalized intent.
  apply(widths: ResizeWidths): ResizeWidths | void;
  // biome-ignore lint/suspicious/noConfusingVoidType: Preserve the existing reset contract while allowing coupled layouts to report normalized intent.
  reset(id: string): ResizeWidths | void;
}
export interface ResizeMember {
  adapter: ResizeAdapter;
  options: ColumnResizeOptions;
}
export interface ResizeTarget {
  focus(): void;
  setPointerCapture(pointer: number): void;
  hasPointerCapture(pointer: number): boolean;
  releasePointerCapture(pointer: number): void;
}
export interface ResizeEnvironment {
  /** Queue one preview before paint; return a cancellation function. */
  schedulePreview?(flush: () => void): () => void;
  listenCancel(cancel: () => boolean): () => void;
  isCompact(query?: string): boolean;
  startGesture(
    target: ResizeTarget,
    pointer: number,
    className: string,
    query: string | undefined,
    cancel: () => void,
  ): () => void;
}

interface ActiveResize {
  member: ResizeMember;
  id: string;
  x: number;
  width: number;
  before: ResizeWidths;
  latest: ResizeWidths;
  pointer: number;
  query?: string;
  cleanup: () => void;
  pendingX?: number;
  cancelFrame?: () => void;
}

/** Gesture ownership and width transitions. No React or browser globals. */
export function createResizeController(
  environment: ResizeEnvironment,
  persist: (member: ResizeMember, widths?: ResizeWidths) => void,
) {
  const members = new Set<ResizeMember>();
  let stopListening: (() => void) | undefined;
  let drag: ActiveResize | null = null;
  const applyPreview = (active: ActiveResize) => {
    if (active.pendingX === undefined) return;
    const x = active.pendingX;
    active.pendingX = undefined;
    active.latest = {
      ...active.member.adapter.snapshot(),
      [active.id]: clampSize(active.width + x - active.x, active.member.adapter.bounds(active.id)),
    };
    const applied = active.member.adapter.apply(active.latest);
    if (active.member.adapter.coupled)
      active.latest = { ...(applied ?? active.member.adapter.snapshot()) };
  };
  const finish = (cancel: boolean) => {
    const active = drag;
    if (!active) return false;
    active.cancelFrame?.();
    active.cancelFrame = undefined;
    // Pointer release can precede the queued frame. Flush its latest position
    // synchronously on completion; cancellation discards it without persisting.
    drag = null;
    if (!cancel) applyPreview(active);
    active.cleanup();
    if (cancel) {
      active.member.adapter.apply(
        active.member.adapter.coupled
          ? active.before
          : {
              ...active.before,
              ...active.member.adapter.snapshot(),
              [active.id]: active.before[active.id],
            },
      );
    } else
      persist(
        active.member,
        active.member.adapter.coupled
          ? active.latest
          : {
              ...active.member.adapter.snapshot(),
              [active.id]: active.latest[active.id],
            },
      );
    return true;
  };
  const owns = (member: ResizeMember, pointer: number) =>
    drag?.member === member && drag.pointer === pointer;
  const cancelMember = (member: ResizeMember) => {
    if (drag?.member === member) finish(true);
  };
  const resetMember = (member: ResizeMember, id: string) => {
    if (!members.has(member) || member.options.enabled === false || drag) return false;
    const widths = member.adapter.snapshot();
    const bounds = member.adapter.bounds(id);
    const applied = member.adapter.reset(id);
    persist(
      member,
      member.adapter.coupled
        ? (applied ?? member.adapter.snapshot())
        : { ...widths, [id]: clampSize(bounds.size, bounds) },
    );
    return true;
  };
  return {
    cancelMember,
    retain(member: ResizeMember) {
      if (!members.size) stopListening = environment.listenCancel(() => finish(true));
      members.add(member);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        cancelMember(member);
        members.delete(member);
        if (!members.size) {
          stopListening?.();
          stopListening = undefined;
        }
      };
    },
    begin(
      member: ResizeMember,
      id: string,
      x: number,
      pointer: number,
      target: ResizeTarget,
      button: number,
    ) {
      if (
        button !== 0 ||
        member.options.enabled === false ||
        drag ||
        !members.has(member) ||
        environment.isCompact(member.options.cancelMediaQuery)
      )
        return false;
      const before = member.adapter.snapshot();
      if (!Number.isFinite(before[id])) return false;
      const active: ActiveResize = {
        member,
        id,
        x,
        width: before[id],
        before,
        latest: { ...before },
        pointer,
        query: member.options.cancelMediaQuery,
        cleanup: () => {},
      };
      drag = active;
      try {
        active.cleanup = environment.startGesture(
          target,
          pointer,
          member.options.dragClassName ?? 'pt-resizing',
          active.query,
          () => finish(true),
        );
      } catch {
        finish(true);
        return false;
      }
      return true;
    },
    move(member: ResizeMember, pointer: number, x: number) {
      if (!owns(member, pointer) || !drag) return;
      const active = drag;
      active.pendingX = x;
      // Coupled panes normalize each step against other panes. Preserve that
      // sequence until a separate coupled-layout profile establishes equivalence.
      if (member.adapter.coupled || !environment.schedulePreview) {
        applyPreview(active);
      } else if (!active.cancelFrame) {
        active.cancelFrame = environment.schedulePreview(() => {
          active.cancelFrame = undefined;
          if (drag !== active) return;
          if (member.options.enabled === false || environment.isCompact(active.query)) finish(true);
          else applyPreview(active);
        });
      }
    },
    end(member: ResizeMember, pointer: number) {
      if (owns(member, pointer))
        finish(member.options.enabled === false || environment.isCompact(drag?.query));
    },
    cancel(member: ResizeMember, pointer: number) {
      if (owns(member, pointer)) finish(true);
    },
    reset: resetMember,
    key(member: ResizeMember, id: string, key: string, shift = false) {
      if (!members.has(member) || member.options.enabled === false || drag) return false;
      if (key === 'Enter') {
        return resetMember(member, id);
      }
      const widths = member.adapter.snapshot();
      const bounds = member.adapter.bounds(id);
      const step = shift ? 40 : 16;
      const next =
        key === 'ArrowLeft'
          ? widths[id] - step
          : key === 'ArrowRight'
            ? widths[id] + step
            : key === 'Home'
              ? bounds.minSize
              : key === 'End'
                ? bounds.maxSize
                : undefined;
      if (next === undefined) return false;
      const committed = { ...widths, [id]: clampSize(next, bounds) };
      const applied = member.adapter.apply(committed);
      persist(member, member.adapter.coupled ? (applied ?? member.adapter.snapshot()) : committed);
      return true;
    },
  };
}
