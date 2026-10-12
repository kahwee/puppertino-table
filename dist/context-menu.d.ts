import { type KeyboardEvent, type MouseEvent } from 'react';
export interface ContextMenuPosition {
    x: number;
    y: number;
}
export interface ContextMenuAction {
    id: string;
    label: string;
    disabled?: boolean;
    onSelect(): void;
}
export interface ContextMenuProps {
    position: ContextMenuPosition | null;
    actions: readonly ContextMenuAction[];
    ariaLabel: string;
    onClose(): void;
    returnFocus?: HTMLElement | null;
}
export declare function useContextMenu<T>(): {
    state: {
        context: T;
        position: ContextMenuPosition;
        returnFocus: HTMLElement;
    } | null;
    close: () => void;
    open: (context: T, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
    getTriggerProps: (context: T) => {
        'aria-haspopup': 'menu';
        onContextMenu: (event: MouseEvent<HTMLElement>) => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    };
};
/** Caller-owned commands; popover placement, keyboard navigation and focus stay shared. */
export declare function ContextMenu({ position, actions, ariaLabel, onClose, returnFocus, }: ContextMenuProps): import("react").JSX.Element | null;
