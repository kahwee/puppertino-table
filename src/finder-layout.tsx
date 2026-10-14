'use client';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { DensityScope, type DensityScopeProps } from './density.js';
import {
  Sidebar,
  SidebarGroup,
  type SidebarGroupProps,
  SidebarItem,
  type SidebarItemButtonProps,
  type SidebarProps,
} from './sidebar.js';

export interface FinderWindowProps extends ComponentPropsWithRef<'section'> {
  /** Tahoe uses softer chrome and a continuous sidebar material; classic preserves the original skin. */
  appearance?: 'classic' | 'tahoe';
}
export function FinderWindow({
  appearance = 'classic',
  className = '',
  children,
  ...props
}: FinderWindowProps) {
  return (
    <section {...props} data-appearance={appearance} className={`pt-finder-container ${className}`}>
      <div className="p-window pt-finder-window">{children}</div>
    </section>
  );
}
export function FinderBody({ className = '', ...props }: DensityScopeProps) {
  return <DensityScope {...props} className={`pt-finder-workspace ${className}`} />;
}
export function FinderContent({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} className={`pt-finder-content ${className}`} />;
}
export function FinderSidebar({ className = '', ...props }: SidebarProps) {
  return <Sidebar {...props} className={`pt-finder-sidebar ${className}`} />;
}
export type FinderSidebarGroupProps = SidebarGroupProps;
export function FinderSidebarGroup({ className = '', ...props }: FinderSidebarGroupProps) {
  return <SidebarGroup {...props} className={`pt-finder-sidebar-group ${className}`} />;
}
export type FinderSidebarItemProps = SidebarItemButtonProps;
export function FinderSidebarItem({ className = '', ...props }: FinderSidebarItemProps) {
  return <SidebarItem {...props} className={`pt-finder-folder ${className}`} />;
}
export function FinderPathBar({ className = '', ...props }: ComponentPropsWithRef<'nav'>) {
  return <nav aria-label="Current location" {...props} className={`pt-finder-path ${className}`} />;
}
export function FinderStatusBar({ className = '', ...props }: ComponentPropsWithRef<'footer'>) {
  return <footer {...props} className={`pt-finder-status ${className}`} />;
}
export function FinderDetails({ className = '', ...props }: ComponentPropsWithRef<'aside'>) {
  return <aside {...props} className={`pt-finder-details ${className}`} />;
}
export interface FinderPreviewProps extends ComponentPropsWithRef<'div'> {
  artwork?: ReactNode;
  heading?: ReactNode;
  description?: ReactNode;
}
export function FinderPreview({
  className = '',
  artwork,
  heading,
  description,
  children,
  ...props
}: FinderPreviewProps) {
  return (
    <div {...props} className={`pt-finder-preview ${className}`}>
      {artwork && <div className="pt-finder-preview-artwork">{artwork}</div>}
      {heading && <h2>{heading}</h2>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
export function FinderEmptyState({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} className={`pt-finder-empty ${className}`} />;
}
export function FinderIconGrid({ className = '', ...props }: ComponentPropsWithRef<'section'>) {
  return <section {...props} className={`pt-finder-icon-grid ${className}`} />;
}
export interface FinderIconItemProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
  selected?: boolean;
  artwork?: ReactNode;
  description?: ReactNode;
}
export function FinderIconItem({
  selected,
  artwork,
  description,
  children,
  className = '',
  ...props
}: FinderIconItemProps) {
  return (
    <button
      type="button"
      {...props}
      aria-pressed={!!selected}
      className={`pt-finder-icon-item ${className}`}
    >
      {artwork && <div className="pt-finder-item-artwork">{artwork}</div>}
      <span>{children}</span>
      {description && <small>{description}</small>}
    </button>
  );
}
export function FinderGallery({ className = '', ...props }: ComponentPropsWithRef<'section'>) {
  return <section {...props} className={`pt-finder-gallery ${className}`} />;
}
export function FinderFilmstrip({ className = '', ...props }: ComponentPropsWithRef<'section'>) {
  return <section {...props} className={`pt-finder-filmstrip ${className}`} />;
}
export interface FinderGalleryItemProps
  extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
  selected?: boolean;
}
export function FinderGalleryItem({ selected, ...props }: FinderGalleryItemProps) {
  return <button type="button" {...props} aria-pressed={!!selected} />;
}
