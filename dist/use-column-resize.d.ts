import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance } from './model.js';
import type { ColumnResizeOptions } from './resize-types.js';
export declare function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, options?: ColumnResizeOptions): {
    cancel: () => void;
    handle: (id: string) => {
        onPointerDown: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerMove: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerUp: (event: import("react").PointerEvent<HTMLElement>) => void;
        onPointerCancel: (event: import("react").PointerEvent<HTMLElement>) => void;
        onLostPointerCapture: (event: import("react").PointerEvent<HTMLElement>) => void;
        onDoubleClick: () => void;
        onKeyDown: (event: import("react").KeyboardEvent<HTMLElement>) => void;
    };
};
