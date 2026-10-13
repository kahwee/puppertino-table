import { type KeyboardEvent } from 'react';
import { type ItemNavigationOrientation } from './item-navigation.js';
import type { SelectionModifiers } from './selection-gestures.js';
export interface ItemNavigationHookOptions {
    orderedIds: readonly string[];
    getItemElement(id: string): HTMLElement | null | undefined;
    orientation?: ItemNavigationOrientation;
    /** Supply a function to measure responsive grid columns when a key is pressed. */
    columns?: number | (() => number);
    disabled?: boolean;
    isItemDisabled?(id: string): boolean;
    /** Called after navigation; connect it to app selection when desired. */
    onNavigate?(id: string, modifiers: SelectionModifiers): void;
    /** Enables prefix matching; repeated characters cycle through matching items. */
    getItemLabel?(id: string): string;
}
/** Roving focus for native rows, buttons and links. Activation and commands remain app-owned. */
export declare function useItemNavigation({ orderedIds, getItemElement, orientation, columns, disabled, isItemDisabled, onNavigate, getItemLabel, }: ItemNavigationHookOptions): {
    activeId: string;
    focus: (id: string) => boolean;
    getItemProps: (id: string) => {
        tabIndex: number;
        onFocus: () => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    };
};
