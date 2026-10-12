import { type KeyboardEvent, type PointerEvent } from 'react';
import { type ResizeAdapter } from './resize-controller.js';
import type { ColumnResizeOptions } from './resize-types.js';
/** Shared lifecycle/event adaptation for table columns and browser panels. */
export declare function useResizeGesture(key: object, adapter: ResizeAdapter, options?: ColumnResizeOptions): {
    cancel: () => void;
    handle: (id: string) => {
        onPointerDown: (event: PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: PointerEvent<HTMLElement>) => void;
        onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
        onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
        onDoubleClick: () => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    };
};
