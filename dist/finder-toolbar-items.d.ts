import { type ReactNode } from 'react';
export interface FinderToolbarItem {
    id: string;
    label: string;
    icon: ReactNode;
    /** Consecutive tools with the same group share a capsule. */
    group?: string;
    disabled?: boolean;
    pressed?: boolean;
    onSelect(): void;
}
export interface FinderToolbarItemsProps {
    items: readonly FinderToolbarItem[];
    /** App-owned IDs, in display order. Omit to show all items. */
    selectedIds?: readonly string[];
    onSelectedIdsChange?(ids: string[]): void;
    overflowIcon: ReactNode;
    label?: string;
}
/** Optional center tools shrink into a menu; navigation and Search stay outside this group. */
export declare function FinderToolbarItems({ items, selectedIds, onSelectedIdsChange, overflowIcon, label, }: FinderToolbarItemsProps): import("react").JSX.Element | null;
