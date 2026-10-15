import type { ColumnSizingState } from '@tanstack/react-table';
import type { ContextMenuItem } from './context-menu.js';
import { type ColumnSizeBounds } from './sizing.js';
export interface ColumnLayoutColumn extends ColumnSizeBounds {
    label: string;
    required?: boolean;
    /** Pinned columns stay first, in schema order, and cannot be hidden. */
    pinned?: boolean;
    defaultHidden?: boolean;
}
export interface ColumnLayout {
    version: 1;
    order: string[];
    hidden: string[];
    widths: ColumnSizingState;
}
/** Normalize saved data against the current schema, retaining hidden-column widths. */
export declare function normalizeColumnLayout(columns: readonly ColumnLayoutColumn[], value?: unknown): ColumnLayout;
export declare function readColumnLayout(columns: readonly ColumnLayoutColumn[], text: string | null): ColumnLayout;
export declare function moveLayoutColumn(columns: readonly ColumnLayoutColumn[], layout: ColumnLayout, id: string, direction: -1 | 1, eligibleIds?: readonly string[]): ColumnLayout;
export interface ColumnLayoutCommands {
    columns: readonly ColumnLayoutColumn[];
    layout: ColumnLayout;
    setVisible(id: string, visible: boolean): void;
    move(id: string, direction: -1 | 1, eligibleIds?: readonly string[]): void;
    reset(): void;
}
/** Compose these with app-owned sorting actions in getHeaderMenu. */
export declare function columnLayoutMenu(commands: ColumnLayoutCommands, columnId?: string): ContextMenuItem[];
export interface ColumnLayoutPreset {
    id: string;
    name: string;
    layout: ColumnLayout;
    readOnly?: boolean;
}
export interface ColumnLayoutPresetDefinition {
    id: string;
    name: string;
    layout?: Partial<ColumnLayout>;
}
/** Ignore corrupt/retired schemas; normalize every snapshot before it reaches a table. */
export declare function readColumnLayoutPresets(columns: readonly ColumnLayoutColumn[], text: string | null, reserved?: readonly ColumnLayoutPreset[]): ColumnLayoutPreset[];
