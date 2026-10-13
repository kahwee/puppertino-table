import { type ComponentPropsWithRef, type ReactNode } from 'react';
import { type DensityScopeProps } from './density.js';
export type FinderWindowProps = ComponentPropsWithRef<'section'>;
export declare function FinderWindow({ className, children, ...props }: FinderWindowProps): import("react").JSX.Element;
export declare function FinderBody({ className, ...props }: DensityScopeProps): import("react").JSX.Element;
export declare function FinderContent({ className, ...props }: ComponentPropsWithRef<'div'>): import("react").JSX.Element;
export declare function FinderSidebar({ className, ...props }: ComponentPropsWithRef<'nav'>): import("react").JSX.Element;
export interface FinderSidebarGroupProps extends ComponentPropsWithRef<'section'> {
    label: string;
}
export declare function FinderSidebarGroup({ label, children, className, ...props }: FinderSidebarGroupProps): import("react").JSX.Element;
export interface FinderSidebarItemProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-current'> {
    selected?: boolean;
    icon?: ReactNode;
    iconTone?: 'accent' | 'secondary';
}
export declare function FinderSidebarItem({ selected, icon, iconTone, children, className, ...props }: FinderSidebarItemProps): import("react").JSX.Element;
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
