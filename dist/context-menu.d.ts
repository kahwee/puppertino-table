import { type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
export interface ContextMenuPosition {
    x: number;
    y: number;
}
interface MenuItemPresentation {
    id: string;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
    /** Display hint only; the caller owns shortcut bindings. */
    shortcut?: string;
}
export interface ContextMenuAction extends MenuItemPresentation {
    onSelect(): void;
    href?: never;
}
export interface ContextMenuLink extends MenuItemPresentation {
    href: string;
    target?: string;
    rel?: string;
    download?: string | boolean;
    onSelect?: () => void;
}
export interface ContextMenuSeparator {
    id: string;
    type: 'separator';
}
export type ContextMenuItem = ContextMenuAction | ContextMenuLink | ContextMenuSeparator;
export interface ContextMenuProps {
    position: ContextMenuPosition | null;
    actions: readonly ContextMenuItem[];
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
export {};
