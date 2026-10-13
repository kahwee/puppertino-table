import { type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
export interface ContextMenuPosition {
    x: number;
    y: number;
}
interface MenuItemPresentation {
    /** Commands and links have no separator discriminator. */
    type?: never;
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
    target?: never;
    rel?: never;
    download?: never;
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
    onSelect?: never;
    href?: never;
    target?: never;
    rel?: never;
    download?: never;
    disabled?: never;
    icon?: never;
    shortcut?: never;
}
export type ContextMenuItem = ContextMenuAction | ContextMenuLink | ContextMenuSeparator;
export interface ContextMenuProps {
    position: ContextMenuPosition | null;
    actions: readonly ContextMenuItem[];
    ariaLabel: string;
    onClose(): void;
    returnFocus?: HTMLElement | null;
}
export interface DelegatedContextMenuOptions<T> {
    /** Resolve only app-owned items. Return undefined/null to preserve the native menu. */
    resolveContext(target: Element, root: HTMLElement): T | null | undefined;
}
/** Open menu context, viewport coordinates and focus-restoration target. */
export interface ContextMenuState<T> {
    context: T;
    position: ContextMenuPosition;
    returnFocus: HTMLElement;
}
export declare function useContextMenu<T>(): {
    state: ContextMenuState<T> | null;
    close: () => void;
    open: (context: T, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
    getTriggerProps: (context: T) => {
        'aria-haspopup': 'menu';
        onContextMenu: (event: MouseEvent<HTMLElement>) => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    };
    getDelegatedTriggerProps: ({ resolveContext }: DelegatedContextMenuOptions<T>) => {
        onContextMenuCapture: (event: MouseEvent<HTMLElement>) => void;
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    };
};
/** Caller-owned commands; Base UI owns menu focus, navigation, dismissal and placement. */
export declare function ContextMenu({ position, actions, ariaLabel, onClose, returnFocus, }: ContextMenuProps): import("react").JSX.Element | null;
export {};
