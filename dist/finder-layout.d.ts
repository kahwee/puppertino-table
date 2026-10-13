import type { ComponentPropsWithRef, ReactNode } from 'react';
import { type DensityScopeProps } from './density.js';
import { type SidebarGroupProps, type SidebarItemButtonProps, type SidebarProps } from './sidebar.js';
export type FinderWindowProps = ComponentPropsWithRef<'section'>;
export declare function FinderWindow({ className, children, ...props }: FinderWindowProps): import("react").JSX.Element;
export declare function FinderBody({ className, ...props }: DensityScopeProps): import("react").JSX.Element;
export declare function FinderContent({ className, ...props }: ComponentPropsWithRef<'div'>): import("react").JSX.Element;
export declare function FinderSidebar({ className, ...props }: SidebarProps): import("react").JSX.Element;
export type FinderSidebarGroupProps = SidebarGroupProps;
export declare function FinderSidebarGroup({ className, ...props }: FinderSidebarGroupProps): import("react").JSX.Element;
export type FinderSidebarItemProps = SidebarItemButtonProps;
export declare function FinderSidebarItem({ className, ...props }: FinderSidebarItemProps): import("react").JSX.Element;
export declare function FinderPathBar({ className, ...props }: ComponentPropsWithRef<'nav'>): import("react").JSX.Element;
export declare function FinderStatusBar({ className, ...props }: ComponentPropsWithRef<'footer'>): import("react").JSX.Element;
export declare function FinderDetails({ className, ...props }: ComponentPropsWithRef<'aside'>): import("react").JSX.Element;
export interface FinderPreviewProps extends ComponentPropsWithRef<'div'> {
    artwork?: ReactNode;
    heading?: ReactNode;
    description?: ReactNode;
}
export declare function FinderPreview({ className, artwork, heading, description, children, ...props }: FinderPreviewProps): import("react").JSX.Element;
export declare function FinderEmptyState({ className, ...props }: ComponentPropsWithRef<'div'>): import("react").JSX.Element;
export declare function FinderIconGrid({ className, ...props }: ComponentPropsWithRef<'section'>): import("react").JSX.Element;
export interface FinderIconItemProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
    selected?: boolean;
    artwork?: ReactNode;
    description?: ReactNode;
}
export declare function FinderIconItem({ selected, artwork, description, children, className, ...props }: FinderIconItemProps): import("react").JSX.Element;
export declare function FinderGallery({ className, ...props }: ComponentPropsWithRef<'section'>): import("react").JSX.Element;
export declare function FinderFilmstrip({ className, ...props }: ComponentPropsWithRef<'section'>): import("react").JSX.Element;
export interface FinderGalleryItemProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
    selected?: boolean;
}
export declare function FinderGalleryItem({ selected, ...props }: FinderGalleryItemProps): import("react").JSX.Element;
