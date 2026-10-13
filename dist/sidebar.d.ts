import { type ComponentPropsWithRef, type ReactNode } from 'react';
export type SidebarSize = 'small' | 'medium' | 'large' | 'touch';
export interface SidebarProps extends ComponentPropsWithRef<'nav'> {
    /** Puppertino row metrics. Large is the standard desktop sidebar. */
    size?: SidebarSize;
}
/** Application-owned navigation; works independently of FinderWindow. */
export declare function Sidebar({ size, className, ...props }: SidebarProps): import("react").JSX.Element;
export interface SidebarGroupProps extends ComponentPropsWithRef<'section'> {
    label: string;
}
export declare function SidebarGroup({ label, children, className, ...props }: SidebarGroupProps): import("react").JSX.Element;
interface SidebarItemPresentation {
    selected?: boolean;
    icon?: ReactNode;
    iconTone?: 'accent' | 'secondary';
    /** Optional trailing count or status, supplied by the application. */
    detail?: ReactNode;
}
export type SidebarItemButtonProps = SidebarItemPresentation & Omit<ComponentPropsWithRef<'button'>, 'aria-current'> & {
    href?: never;
};
export type SidebarItemLinkProps = SidebarItemPresentation & Omit<ComponentPropsWithRef<'a'>, 'aria-current'> & {
    href: string;
};
export type SidebarItemProps = SidebarItemButtonProps | SidebarItemLinkProps;
export declare function SidebarItem({ selected, icon, iconTone, detail, children, className, ...props }: SidebarItemProps): import("react").JSX.Element;
export {};
