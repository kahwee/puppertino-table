import type { RowData } from '@tanstack/react-table';
import { type PointerEvent, type KeyboardEvent } from 'react';
import type { PuppertinoTableInstance } from "./model.js";
export interface ColumnResizeOptions {
    enabled?: boolean;
    storageKey?: string;
    storage?: Pick<Storage, 'setItem'>;
    cancelMediaQuery?: string;
    dragClassName?: string;
}
export declare function useColumnResize<T extends RowData>(table: PuppertinoTableInstance<T>, { enabled, storageKey, storage, cancelMediaQuery, dragClassName }?: ColumnResizeOptions): {
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
