'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, } from 'react';
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
        (element.querySelector('button:not(:disabled)') ?? element).focus();
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
    const navigate = (event) => {
        const buttons = Array.from(menu.current?.querySelectorAll('button:not(:disabled)') ?? []);
        const current = buttons.indexOf(document.activeElement);
        let next = current;
        if (event.key === 'ArrowDown')
            next = (current + 1) % buttons.length;
        else if (event.key === 'ArrowUp')
            next = (current - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home')
            next = 0;
        else if (event.key === 'End')
            next = buttons.length - 1;
        else if (event.key === 'Tab') {
            close.current();
            return;
        }
        else
            return;
        event.preventDefault();
        buttons[next]?.focus();
    };
    return (_jsx("div", { ref: menu, popover: "manual", className: "pt-context-menu", role: "menu", tabIndex: -1, "aria-label": ariaLabel, onKeyDown: navigate, onContextMenu: (event) => event.preventDefault(), style: { left: position.x, top: position.y }, children: actions.map((action) => (_jsx("button", { type: "button", role: "menuitem", disabled: action.disabled, onClick: () => {
                onClose();
                action.onSelect();
            }, children: action.label }, action.id))) }));
}
