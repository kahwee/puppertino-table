'use client';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  /** A controlled checkmark uses menuitemcheckbox semantics. */
  checked?: boolean;
  /** Keep checkbox menus open for repeated choices. Commands close by default. */
  closeOnSelect?: boolean;
  href?: never;
  target?: never;
  rel?: never;
  download?: never;
}
export interface ContextMenuLink extends MenuItemPresentation {
  checked?: never;
  closeOnSelect?: never;
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

export function useContextMenu<T>() {
  const [state, setState] = useState<ContextMenuState<T> | null>(null);
  const close = useCallback(() => setState(null), []);
  const open = useCallback(
    (context: T, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      const candidate =
        event.target instanceof Element
          ? event.target.closest('button,a[href],input,select,textarea,[tabindex]')
          : null;
      const focusTarget =
        candidate instanceof HTMLElement && target.contains(candidate) ? candidate : target;
      const rect = focusTarget.getBoundingClientRect();
      const pointer = 'clientX' in event && (event.clientX !== 0 || event.clientY !== 0);
      setState({
        context,
        position: pointer
          ? { x: event.clientX, y: event.clientY }
          : { x: rect.left + 8, y: rect.bottom },
        returnFocus: focusTarget,
      });
    },
    [],
  );
  return {
    state,
    close,
    open,
    getTriggerProps: (context: T) => ({
      'aria-haspopup': 'menu' as const,
      onContextMenu: (event: MouseEvent<HTMLElement>) => open(context, event),
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
          open(context, event);
      },
    }),
    getDelegatedTriggerProps: ({ resolveContext }: DelegatedContextMenuOptions<T>) => {
      const resolve = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
        if (
          event.defaultPrevented ||
          !(event.target instanceof Element) ||
          !event.currentTarget.contains(event.target)
        )
          return;
        const context = resolveContext(event.target, event.currentTarget);
        if (context !== undefined && context !== null) open(context, event);
      };
      return {
        onContextMenuCapture: (event: MouseEvent<HTMLElement>) => resolve(event),
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
            resolve(event);
        },
      };
    },
  };
}

/** Caller-owned commands; Base UI owns menu focus, navigation, dismissal and placement. */
export function ContextMenu({
  position,
  actions,
  ariaLabel,
  onClose,
  returnFocus,
}: ContextMenuProps) {
  const menu = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const anchor = useMemo(
    () =>
      position
        ? {
            contextElement: returnFocus ?? undefined,
            getBoundingClientRect: () => ({
              x: position.x,
              y: position.y,
              left: position.x,
              top: position.y,
              right: position.x,
              bottom: position.y,
              width: 0,
              height: 0,
              toJSON: () => ({}),
            }),
          }
        : null,
    [position, returnFocus],
  );
  useEffect(() => {
    if (!position) return;
    const dismiss = () => close.current();
    const outsideScroll = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) dismiss();
    };
    document.addEventListener('scroll', outsideScroll, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);
    return () => {
      document.removeEventListener('scroll', outsideScroll, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
    };
  }, [position]);
  if (!position) return null;
  const hasIcons = actions.some((action) => 'icon' in action && !!action.icon);
  const hasChecks = actions.some(
    (action) => 'checked' in action && typeof action.checked === 'boolean',
  );
  const theme = returnFocus?.closest('.p-dark-mode,.p-light-mode,[data-p-theme]');
  const themeClass = theme?.matches('.p-dark-mode,[data-p-theme="darkmode"]')
    ? 'p-dark-mode'
    : theme?.matches('.p-light-mode,[data-p-theme="lightmode"]')
      ? 'p-light-mode'
      : '';
  const container =
    returnFocus?.closest<HTMLElement>('dialog[open],[popover]:popover-open') ?? undefined;
  return (
    <BaseContextMenu.Root
      open
      onOpenChange={(open) => {
        if (!open) close.current();
      }}
    >
      <BaseContextMenu.Portal container={container}>
        <BaseContextMenu.Positioner
          role="region"
          aria-label={ariaLabel}
          anchor={anchor}
          side="bottom"
          align="start"
          sideOffset={0}
          alignOffset={0}
          collisionPadding={8}
          positionMethod="fixed"
          className="pt-context-positioner"
        >
          <BaseContextMenu.Popup
            ref={menu}
            className={`pt-context-menu ${themeClass}`}
            aria-label={ariaLabel}
            finalFocus={() => (returnFocus?.isConnected ? returnFocus : false)}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
                event.preventDefault();
                event.target.click();
              }
            }}
          >
            {actions.map((action) => {
              if ('type' in action && action.type === 'separator')
                return <BaseContextMenu.Separator key={action.id} className="pt-menu-separator" />;
              if (!('label' in action)) return null;
              const content = (
                <>
                  {hasChecks && (
                    <span className="pt-menu-check" aria-hidden="true">
                      {action.checked ? '✓' : ''}
                    </span>
                  )}
                  {hasIcons && (
                    <span className="pt-menu-icon" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  <span className="pt-menu-label">{action.label}</span>
                  {action.shortcut && (
                    <span className="pt-menu-shortcut" aria-hidden="true">
                      {action.shortcut}
                    </span>
                  )}
                </>
              );
              if (typeof action.checked === 'boolean')
                return (
                  <BaseContextMenu.CheckboxItem
                    key={action.id}
                    checked={action.checked}
                    disabled={action.disabled}
                    label={action.label}
                    closeOnClick={false}
                    onCheckedChange={() => {
                      if (action.closeOnSelect !== false) close.current();
                      action.onSelect();
                    }}
                  >
                    {content}
                  </BaseContextMenu.CheckboxItem>
                );
              if (action.href !== undefined) {
                if (action.disabled)
                  return (
                    <BaseContextMenu.Item key={action.id} disabled label={action.label}>
                      {content}
                    </BaseContextMenu.Item>
                  );
                return (
                  <BaseContextMenu.LinkItem
                    key={action.id}
                    href={action.href}
                    target={action.target}
                    rel={action.rel}
                    download={action.download}
                    label={action.label}
                    closeOnClick={false}
                    onClick={() => {
                      close.current();
                      action.onSelect?.();
                    }}
                  >
                    {content}
                  </BaseContextMenu.LinkItem>
                );
              }
              return (
                <BaseContextMenu.Item
                  key={action.id}
                  nativeButton
                  render={<button type="button" />}
                  disabled={action.disabled}
                  label={action.label}
                  closeOnClick={false}
                  onClick={() => {
                    close.current();
                    action.onSelect();
                  }}
                >
                  {content}
                </BaseContextMenu.Item>
              );
            })}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}
