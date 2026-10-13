'use client';
import { type ComponentPropsWithRef, type ReactNode, useId } from 'react';

export type SidebarSize = 'small' | 'medium' | 'large' | 'touch';
export interface SidebarProps extends ComponentPropsWithRef<'nav'> {
  /** Puppertino row metrics. Large is the standard desktop sidebar. */
  size?: SidebarSize;
}
/** Application-owned navigation; works independently of FinderWindow. */
export function Sidebar({ size = 'large', className = '', ...props }: SidebarProps) {
  const sizeClass = size === 'large' ? '' : `p-sidebar-${size}`;
  return <nav {...props} className={`p-sidebar pt-sidebar ${sizeClass} ${className}`} />;
}
export interface SidebarGroupProps extends ComponentPropsWithRef<'section'> {
  label: string;
}
export function SidebarGroup({ label, children, className = '', ...props }: SidebarGroupProps) {
  const id = useId();
  return (
    <section {...props} className={`pt-sidebar-group ${className}`} aria-labelledby={id}>
      <h2 id={id} className="p-sidebar-header">
        {label}
      </h2>
      {children}
    </section>
  );
}
interface SidebarItemPresentation {
  selected?: boolean;
  icon?: ReactNode;
  iconTone?: 'accent' | 'secondary';
  /** Optional trailing count or status, supplied by the application. */
  detail?: ReactNode;
}
export type SidebarItemButtonProps = SidebarItemPresentation &
  Omit<ComponentPropsWithRef<'button'>, 'aria-current'> & { href?: never };
export type SidebarItemLinkProps = SidebarItemPresentation &
  Omit<ComponentPropsWithRef<'a'>, 'aria-current'> & { href: string };
export type SidebarItemProps = SidebarItemButtonProps | SidebarItemLinkProps;
export function SidebarItem({
  selected,
  icon,
  iconTone = 'accent',
  detail,
  children,
  className = '',
  ...props
}: SidebarItemProps) {
  const content = (
    <>
      {icon && (
        <span className="p-sidebar-icon" data-tone={iconTone} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="pt-sidebar-label">{children}</span>
      {detail != null && <span className="p-sidebar-detail">{detail}</span>}
    </>
  );
  const classes = `p-sidebar-row pt-sidebar-item ${selected ? 'p-selected' : ''} ${className}`;
  if (typeof props.href === 'string') {
    return (
      <a {...props} className={classes} aria-current={selected ? 'page' : undefined}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      {...props}
      className={classes}
      aria-current={selected ? 'page' : undefined}
    >
      {content}
    </button>
  );
}
