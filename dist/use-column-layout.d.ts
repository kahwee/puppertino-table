import type { ColumnOrderState, ColumnSizingState, Updater } from '@tanstack/react-table';
import { type ColumnLayout, type ColumnLayoutColumn, type ColumnLayoutPreset, type ColumnLayoutPresetDefinition } from './column-layout.js';
export interface ColumnLayoutOptions {
    columns: readonly ColumnLayoutColumn[];
    storageKey: string;
    presets?: readonly ColumnLayoutPresetDefinition[];
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    /** Read existing width-only preferences when no saved layout exists. */
    legacyWidthsKey?: string;
}
/** Width previews stay in an atom; only structural changes rerender the owner. */
export declare function useColumnLayout({ columns, storageKey, storage, legacyWidthsKey, presets: definitions, }: ColumnLayoutOptions): {
    presets: ColumnLayoutPreset[];
    getActivePresetId: () => string;
    readonly activePresetId: string;
    applyPreset(id: string): void;
    savePreset(name: string): string | null;
    renamePreset(id: string, name: string): boolean;
    deletePreset(id: string): void;
    columnOrder: import("@tanstack/react-store").Atom<ColumnOrderState>;
    commitOrder: (update: Updater<ColumnOrderState>) => void;
    persistence: import("@tanstack/react-store").Atom<"saved" | "session">;
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
