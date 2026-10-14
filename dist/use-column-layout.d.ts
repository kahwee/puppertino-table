import type { ColumnSizingState } from '@tanstack/react-table';
import { type ColumnLayout, type ColumnLayoutColumn } from './column-layout.js';
export interface ColumnLayoutOptions {
    columns: readonly ColumnLayoutColumn[];
    storageKey: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    /** Read existing width-only preferences when no saved layout exists. */
    legacyWidthsKey?: string;
}
/** Width previews stay in an atom; only structural changes rerender the owner. */
export declare function useColumnLayout({ columns, storageKey, storage, legacyWidthsKey, }: ColumnLayoutOptions): {
    readonly layout: ColumnLayout;
    hidden: string[];
    order: string[];
    ready: boolean;
    columnSizing: import("@tanstack/react-store").Atom<ColumnSizingState>;
    setVisible: (id: string, visible: boolean) => void;
    move: (id: string, direction: -1 | 1, eligibleIds?: readonly string[]) => void;
    commitWidths: (widths: ColumnSizingState) => void;
    reset: () => void;
};
