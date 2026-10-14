'use client';
import { type ComponentPropsWithRef, type ReactNode, useEffect, useRef, useState } from 'react';
import { ContextMenu, type ContextMenuItem, type ContextMenuState } from './context-menu.js';
import { useFinderToolbarNavigation } from './finder-toolbar-navigation.js';

export const finderViews = ['icons', 'list', 'columns', 'gallery', 'outline'] as const;
export type FinderView = (typeof finderViews)[number];
export interface FinderWindowControlsProps {
  onClose?(): void;
  onMinimize?(): void;
  onZoom?(): void;
}
/** Without handlers, traffic lights are decoration rather than inert buttons. */
export function FinderWindowControls({ onClose, onMinimize, onZoom }: FinderWindowControlsProps) {
  return (
    <span className="p-traffic-lights">
      {(
        [
          ['close', 'Close window', onClose],
          ['min', 'Minimize window', onMinimize],
          ['zoom', 'Zoom window', onZoom],
        ] as const
      ).map(([name, label, handler]) =>
        handler ? (
          <button
            key={name}
            type="button"
            className={`p-traffic-light p-traffic-light-${name}`}
            aria-label={label}
            onClick={handler}
          />
        ) : (
          <span
            key={name}
            className={`p-traffic-light p-traffic-light-${name}`}
            aria-hidden="true"
          />
        ),
      )}
    </span>
  );
}
export interface FinderToolbarProps extends ComponentPropsWithRef<'header'> {
  windowControls?: ReactNode;
  label?: string;
  /** One Tab stop with Left/Right and Home/End navigation. Text fields retain editing keys. */
  keyboardNavigation?: boolean;
}
export function FinderToolbar({
  windowControls = <FinderWindowControls />,
  label = 'Finder toolbar',
  keyboardNavigation = false,
  children,
  className = '',
  ...props
}: FinderToolbarProps) {
  const content = useRef<HTMLDivElement>(null);
  useFinderToolbarNavigation(content, keyboardNavigation);
  return (
    <header {...props} className={`pt-finder-toolbar ${className}`}>
      <div className="pt-finder-titlebar">{windowControls}</div>
      <div ref={content} role="toolbar" aria-label={label} className="pt-finder-toolbar-content">
        {children}
      </div>
    </header>
  );
}
export function FinderToolbarGroup({
  className = '',
  ...props
}: ComponentPropsWithRef<'fieldset'>) {
  return <fieldset {...props} className={`p-toolbar-group pt-finder-toolbar-group ${className}`} />;
}
export interface FinderToolbarButtonProps extends ComponentPropsWithRef<'button'> {
  /** Supplies both the accessible name and native hover hint for icon buttons. */
  label?: string;
}
export function FinderToolbarButton({
  label,
  title,
  'aria-label': ariaLabel,
  className = '',
  ...props
}: FinderToolbarButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-label={ariaLabel ?? label}
      title={title ?? label}
      className={`p-toolbar-btn ${className}`}
    />
  );
}
export interface FinderTitleProps extends ComponentPropsWithRef<'h1'> {
  as?: 'h1' | 'h2' | 'h3';
}
export function FinderTitle({ as: Heading = 'h1', className = '', ...props }: FinderTitleProps) {
  return <Heading {...props} className={`pt-finder-title ${className}`} />;
}
export interface FinderHistoryProps {
  onBack?(): void;
  onForward?(): void;
  backIcon: ReactNode;
  forwardIcon: ReactNode;
}
export function FinderHistory({ onBack, onForward, backIcon, forwardIcon }: FinderHistoryProps) {
  return (
    <FinderToolbarGroup aria-label="Navigation history" className="pt-finder-history">
      <FinderToolbarButton aria-label="Back" title="Back" disabled={!onBack} onClick={onBack}>
        {backIcon}
      </FinderToolbarButton>
      <span className="p-toolbar-divider" aria-hidden="true" />
      <FinderToolbarButton
        aria-label="Forward"
        title="Forward"
        disabled={!onForward}
        onClick={onForward}
      >
        {forwardIcon}
      </FinderToolbarButton>
    </FinderToolbarGroup>
  );
}
export interface FinderViewSwitcherProps
  extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'children'> {
  value: FinderView;
  onValueChange(value: FinderView): void;
  icons: Readonly<Record<Exclude<FinderView, 'outline'>, ReactNode> & { outline?: ReactNode }>;
  /** Omit to show supplied views; existing four-icon callers keep their original toolbar. */
  views?: readonly FinderView[];
}
export function FinderViewSwitcher({
  value,
  onValueChange,
  icons,
  views = finderViews.filter(
    (view) => view !== 'outline' || icons.outline != null || value === 'outline',
  ),
  className = '',
  ...props
}: FinderViewSwitcherProps) {
  return (
    <FinderToolbarGroup aria-label="View" {...props} className={`pt-finder-views ${className}`}>
      {views.map((view) => (
        <FinderToolbarButton
          key={view}
          aria-label={view[0].toUpperCase() + view.slice(1)}
          title={`${view === 'icons' ? 'Icon' : view[0].toUpperCase() + view.slice(1)} view`}
          aria-pressed={value === view}
          onClick={() => onValueChange(view)}
        >
          {icons[view] ?? view[0].toUpperCase() + view.slice(1)}
        </FinderToolbarButton>
      ))}
    </FinderToolbarGroup>
  );
}
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
export function FinderSearch({
  value,
  onValueChange,
  icon,
  ariaLabel = 'Search files',
  placeholder = 'Search',
  disabled,
  collapsible = true,
}: FinderSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return expanded || value || !collapsible ? (
    <label className="p-search p-search-xlarge pt-finder-search">
      <input
        ref={input}
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onValueChange('');
            setExpanded(false);
            if (collapsible) requestAnimationFrame(() => trigger.current?.focus());
          }
        }}
      />
    </label>
  ) : (
    <button
      ref={trigger}
      type="button"
      className="p-toolbar-circle"
      aria-label="Search"
      title="Search"
      disabled={disabled}
      onClick={() => {
        setExpanded(true);
        requestAnimationFrame(() => input.current?.focus());
      }}
    >
      {icon}
    </button>
  );
}
export interface FinderActionsProps {
  actions: readonly ContextMenuItem[];
  icon: ReactNode;
  label?: string;
  menuLabel?: string;
  disabled?: boolean;
}
export function FinderActions({
  actions,
  icon,
  label = 'Actions',
  menuLabel = 'Finder actions',
  disabled,
}: FinderActionsProps) {
  const [menu, setMenu] = useState<ContextMenuState<null> | null>(null);
  useEffect(() => {
    if (disabled) setMenu(null);
  }, [disabled]);
  return (
    <>
      <FinderToolbarButton
        aria-label={label}
        title={label}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={!!menu && !disabled}
        onClick={(event) => {
          const target = event.currentTarget;
          const rect = target.getBoundingClientRect();
          setMenu(
            menu
              ? null
              : {
                  context: null,
                  position: { x: rect.right - 220, y: rect.bottom + 6 },
                  returnFocus: target,
                },
          );
        }}
      >
        {icon}
      </FinderToolbarButton>
      <ContextMenu
        ariaLabel={menuLabel}
        position={disabled ? null : (menu?.position ?? null)}
        returnFocus={menu?.returnFocus}
        onClose={() => setMenu(null)}
        actions={actions}
      />
    </>
  );
}
