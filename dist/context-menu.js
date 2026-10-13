'use client';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, } from 'react';
const enabledItems = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';
export function useContextMenu() {
    const [state, setState] = useState(null);
    const close = useCallback(() => setState(null), []);
    const open = useCallback((context, event) => {
        event.preventDefault();
        event.stopPropagation();
        const target = event.currentTarget;
        const candidate = event.target instanceof Element
            ? event.target.closest('button,a[href],input,select,textarea,[tabindex]')
            : null;
        const focusTarget = candidate instanceof HTMLElement && target.contains(candidate) ? candidate : target;
        const rect = focusTarget.getBoundingClientRect();
        const pointer = 'clientX' in event && (event.clientX !== 0 || event.clientY !== 0);
        setState({
            context,
            position: pointer
                ? { x: event.clientX, y: event.clientY }
                : { x: rect.left + 8, y: rect.bottom },
            returnFocus: focusTarget,
        });
    }, []);
    return {
        state,
        close,
        open,
        getTriggerProps: (context) => ({
            'aria-haspopup': 'menu',
            onContextMenu: (event) => open(context, event),
            onKeyDown: (event) => {
                if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
                    open(context, event);
            },
        }),
        getDelegatedTriggerProps: ({ resolveContext }) => {
            const resolve = (event) => {
                if (event.defaultPrevented ||
                    !(event.target instanceof Element) ||
                    !event.currentTarget.contains(event.target))
                    return;
                const context = resolveContext(event.target, event.currentTarget);
                if (context !== undefined && context !== null)
                    open(context, event);
            };
            return {
                onContextMenuCapture: (event) => resolve(event),
                onKeyDownCapture: (event) => {
                    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
                        resolve(event);
                },
            };
        },
    };
}
/** Caller-owned commands; popover placement, keyboard navigation and focus stay shared. */
export function ContextMenu({ position, actions, ariaLabel, onClose, returnFocus, }) {
    const menu = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    useLayoutEffect(() => {
        const element = menu.current;
        if (!position || !element)
            return;
        element.showPopover?.();
        const rect = element.getBoundingClientRect();
        element.style.left = `${Math.max(8, Math.min(position.x, innerWidth - rect.width - 8))}px`;
        element.style.top = `${Math.max(8, Math.min(position.y, innerHeight - rect.height - 8))}px`;
        (element.querySelector(enabledItems) ?? element).focus();
        return () => {
            if (returnFocus?.isConnected)
                returnFocus.focus({ preventScroll: true });
        };
    }, [position, returnFocus]);
    useEffect(() => {
        if (!position)
            return;
        const outside = (event) => {
            if (!menu.current?.contains(event.target))
                close.current();
        };
        const dismiss = () => close.current();
        const outsideScroll = (event) => {
            if (!menu.current?.contains(event.target))
                close.current();
        };
        const onEscape = (event) => {
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
    if (!position)
        return null;
    const hasIcons = actions.some((action) => 'icon' in action && !!action.icon);
    const navigate = (event) => {
        const items = Array.from(menu.current?.querySelectorAll(enabledItems) ?? []);
        if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
            event.preventDefault();
            event.target.click();
            return;
        }
        const current = items.indexOf(document.activeElement);
        let next = current;
        if (event.key === 'ArrowDown')
            next = (current + 1) % items.length;
        else if (event.key === 'ArrowUp')
            next = (current - 1 + items.length) % items.length;
        else if (event.key === 'Home')
            next = 0;
        else if (event.key === 'End')
            next = items.length - 1;
        else if (event.key === 'Tab') {
            close.current();
            return;
        }
        else
            return;
        event.preventDefault();
        items[next]?.focus();
    };
    return (_jsx("div", { ref: menu, popover: "manual", className: "pt-context-menu", role: "menu", tabIndex: -1, "aria-label": ariaLabel, onKeyDown: navigate, onPointerMove: (event) => {
            if (event.pointerType === 'touch' || !(event.target instanceof Element))
                return;
            const item = event.target.closest(enabledItems);
            if (item && event.currentTarget.contains(item))
                item.focus({ preventScroll: true });
        }, onContextMenu: (event) => event.preventDefault(), style: { left: position.x, top: position.y }, children: actions.map((action) => {
            if ('type' in action && action.type === 'separator')
                return _jsx("hr", { className: "pt-menu-separator" }, action.id);
            if (!('label' in action))
                return null;
            const content = (_jsxs(_Fragment, { children: [hasIcons && (_jsx("span", { className: "pt-menu-icon", "aria-hidden": "true", children: action.icon })), _jsx("span", { className: "pt-menu-label", children: action.label }), action.shortcut && (_jsx("span", { className: "pt-menu-shortcut", "aria-hidden": "true", children: action.shortcut }))] }));
            if (action.href !== undefined)
                return (_jsx("a", { role: "menuitem", href: action.disabled ? undefined : action.href, target: action.target, rel: action.rel, download: action.download, "aria-disabled": action.disabled || undefined, tabIndex: action.disabled ? -1 : 0, onClick: (event) => {
                        if (action.disabled) {
                            event.preventDefault();
                            return;
                        }
                        onClose();
                        action.onSelect?.();
                    }, children: content }, action.id));
            return (_jsx("button", { type: "button", role: "menuitem", disabled: action.disabled, onClick: () => {
                    onClose();
                    action.onSelect();
                }, children: content }, action.id));
        }) }));
}
