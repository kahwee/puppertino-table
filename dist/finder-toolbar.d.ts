import { type ComponentPropsWithRef, type ReactNode } from 'react';
import { type ContextMenuItem } from './context-menu.js';
export type FinderView = 'icons' | 'list' | 'columns' | 'gallery';
export interface FinderWindowControlsProps {
    onClose?(): void;
    onMinimize?(): void;
    onZoom?(): void;
}
/** Without handlers, traffic lights are decoration rather than inert buttons. */
export declare function FinderWindowControls({ onClose, onMinimize, onZoom }: FinderWindowControlsProps): import("react").JSX.Element;
export interface FinderToolbarProps extends ComponentPropsWithRef<'header'> {
    windowControls?: ReactNode;
}
export declare function FinderToolbar({ windowControls, children, className, ...props }: FinderToolbarProps): import("react").JSX.Element;
export declare function FinderToolbarGroup({ className, ...props }: ComponentPropsWithRef<'fieldset'>): import("react").JSX.Element;
export declare function FinderToolbarButton({ className, ...props }: ComponentPropsWithRef<'button'>): import("react").JSX.Element;
export interface FinderTitleProps extends ComponentPropsWithRef<'h1'> {
    as?: 'h1' | 'h2' | 'h3';
}
export declare function FinderTitle({ as: Heading, className, ...props }: FinderTitleProps): import("react").JSX.Element;
export interface FinderHistoryProps {
    onBack?(): void;
    onForward?(): void;
    backIcon: ReactNode;
    forwardIcon: ReactNode;
}
export declare function FinderHistory({ onBack, onForward, backIcon, forwardIcon }: FinderHistoryProps): import("react").JSX.Element;
export interface FinderViewSwitcherProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'children'> {
    value: FinderView;
    onValueChange(value: FinderView): void;
    icons: Readonly<Record<FinderView, ReactNode>>;
}
export declare function FinderViewSwitcher({ value, onValueChange, icons, className, ...props }: FinderViewSwitcherProps): import("react").JSX.Element;
export interface FinderSearchProps {
    value: string;
    onValueChange(value: string): void;
    /** Collapsed toolbar icon. The expanded field uses Puppertino’s native search glyph. */
    icon: ReactNode;
    ariaLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    collapsible?: boolean;
}
export declare function FinderSearch({ value, onValueChange, icon, ariaLabel, placeholder, disabled, collapsible, }: FinderSearchProps): import("react").JSX.Element;
export interface FinderActionsProps {
    actions: readonly ContextMenuItem[];
    icon: ReactNode;
    label?: string;
    menuLabel?: string;
    disabled?: boolean;
}
export declare function FinderActions({ actions, icon, label, menuLabel, disabled, }: FinderActionsProps): import("react").JSX.Element;
