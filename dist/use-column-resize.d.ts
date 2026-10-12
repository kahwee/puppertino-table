import type { RowData } from '@tanstack/react-table';
import { type KeyboardEvent, type PointerEvent } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import type { ColumnResizeOptions } from './resize-types.js';
export type { ColumnResizeOptions } from './resize-types.js';
export declare function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, options?: ColumnResizeOptions): {
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
