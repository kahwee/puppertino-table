import type { ColumnResizeOptions } from './resize-types.js';
import { type ColumnSizeBounds } from './sizing.js';
export type ResizeWidths = Record<string, number>;
export interface ResizeAdapter {
    snapshot(): ResizeWidths;
    bounds(id: string): ColumnSizeBounds;
    apply(widths: ResizeWidths): void;
    reset(id: string): void;
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
    listenCancel(cancel: () => boolean): () => void;
    isCompact(query?: string): boolean;
    startGesture(target: ResizeTarget, pointer: number, className: string, query: string | undefined, cancel: () => void): () => void;
}
/** Gesture ownership and width transitions. No React or browser globals. */
export declare function createResizeController(environment: ResizeEnvironment, persist: (member: ResizeMember, widths?: ResizeWidths) => void): {
    cancelMember: (member: ResizeMember) => void;
    retain(member: ResizeMember): () => void;
    begin(member: ResizeMember, id: string, x: number, pointer: number, target: ResizeTarget, button: number): boolean;
    move(member: ResizeMember, pointer: number, x: number): void;
    end(member: ResizeMember, pointer: number): void;
    cancel(member: ResizeMember, pointer: number): void;
    reset: (member: ResizeMember, id: string) => boolean;
    key(member: ResizeMember, id: string, key: string, shift?: boolean): boolean;
};
