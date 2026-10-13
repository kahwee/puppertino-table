'use client';
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
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
const enabledItems = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';
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

/** Caller-owned commands; popover placement, keyboard navigation and focus stay shared. */
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
  useLayoutEffect(() => {
    const element = menu.current;
    if (!position || !element) return;
    element.showPopover?.();
    const rect = element.getBoundingClientRect();
    element.style.left = `${Math.max(8, Math.min(position.x, innerWidth - rect.width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(position.y, innerHeight - rect.height - 8))}px`;
    (element.querySelector<HTMLElement>(enabledItems) ?? element).focus();
    return () => {
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [position, returnFocus]);
  useEffect(() => {
    if (!position) return;
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close.current();
    };
    const dismiss = () => close.current();
    const outsideScroll = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) close.current();
    };
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', onEscape, true);
    document.addEventListener('scroll', outsideScroll, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', onEscape, true);
      document.removeEventListener('scroll', outsideScroll, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
    };
  }, [position]);
  if (!position) return null;
  const hasIcons = actions.some((action) => 'icon' in action && !!action.icon);
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>(enabledItems) ?? []);
    if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
      event.preventDefault();
      event.target.click();
      return;
    }
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next = current;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'Tab') {
      close.current();
      return;
    } else return;
    event.preventDefault();
    items[next]?.focus();
  };
  return (
    <div
      ref={menu}
      popover="manual"
      className="pt-context-menu"
      role="menu"
      tabIndex={-1}
      aria-label={ariaLabel}
      onKeyDown={navigate}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch' || !(event.target instanceof Element)) return;
        const item = event.target.closest<HTMLElement>(enabledItems);
        if (item && event.currentTarget.contains(item)) item.focus({ preventScroll: true });
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{ left: position.x, top: position.y }}
    >
      {actions.map((action) => {
        if ('type' in action && action.type === 'separator')
          return <hr key={action.id} className="pt-menu-separator" />;
        if (!('label' in action)) return null;
        const content = (
          <>
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
        if (action.href !== undefined)
          return (
            <a
              key={action.id}
              role="menuitem"
              href={action.disabled ? undefined : action.href}
              target={action.target}
              rel={action.rel}
              download={action.download}
              aria-disabled={action.disabled || undefined}
              tabIndex={action.disabled ? -1 : 0}
              onClick={(event) => {
                if (action.disabled) {
                  event.preventDefault();
                  return;
                }
                onClose();
                action.onSelect?.();
              }}
            >
              {content}
            </a>
          );
        return (
          <button
            type="button"
            key={action.id}
            role="menuitem"
            disabled={action.disabled}
            onClick={() => {
              onClose();
              action.onSelect();
            }}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
