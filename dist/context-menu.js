'use client';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
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
/** Caller-owned commands; Base UI owns menu focus, navigation, dismissal and placement. */
export function ContextMenu({ position, actions, ariaLabel, onClose, returnFocus, }) {
    const menu = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    const anchor = useMemo(() => position
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
        : null, [position, returnFocus]);
    useEffect(() => {
        if (!position)
            return;
        const dismiss = () => close.current();
        const outsideScroll = (event) => {
            if (!menu.current?.contains(event.target))
                dismiss();
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
    if (!position)
        return null;
    const hasIcons = actions.some((action) => 'icon' in action && !!action.icon);
    const theme = returnFocus?.closest('.p-dark-mode,.p-light-mode,[data-p-theme]');
    const themeClass = theme?.matches('.p-dark-mode,[data-p-theme="darkmode"]')
        ? 'p-dark-mode'
        : theme?.matches('.p-light-mode,[data-p-theme="lightmode"]')
            ? 'p-light-mode'
            : '';
    const container = returnFocus?.closest('dialog[open],[popover]:popover-open') ?? undefined;
    return (_jsx(BaseContextMenu.Root, { open: true, onOpenChange: (open) => {
            if (!open)
                close.current();
        }, children: _jsx(BaseContextMenu.Portal, { container: container, children: _jsx(BaseContextMenu.Positioner, { role: "region", "aria-label": ariaLabel, anchor: anchor, side: "bottom", align: "start", sideOffset: 0, alignOffset: 0, collisionPadding: 8, positionMethod: "fixed", className: "pt-context-positioner", children: _jsx(BaseContextMenu.Popup, { ref: menu, className: `pt-context-menu ${themeClass}`, "aria-label": ariaLabel, finalFocus: () => (returnFocus?.isConnected ? returnFocus : false), onContextMenu: (event) => event.preventDefault(), onKeyDown: (event) => {
                        if (event.key === ' ' && event.target instanceof HTMLAnchorElement) {
                            event.preventDefault();
                            event.target.click();
                        }
                    }, children: actions.map((action) => {
                        if ('type' in action && action.type === 'separator')
                            return _jsx(BaseContextMenu.Separator, { className: "pt-menu-separator" }, action.id);
                        if (!('label' in action))
                            return null;
                        const content = (_jsxs(_Fragment, { children: [hasIcons && (_jsx("span", { className: "pt-menu-icon", "aria-hidden": "true", children: action.icon })), _jsx("span", { className: "pt-menu-label", children: action.label }), action.shortcut && (_jsx("span", { className: "pt-menu-shortcut", "aria-hidden": "true", children: action.shortcut }))] }));
                        if (action.href !== undefined) {
                            if (action.disabled)
                                return (_jsx(BaseContextMenu.Item, { disabled: true, label: action.label, children: content }, action.id));
                            return (_jsx(BaseContextMenu.LinkItem, { href: action.href, target: action.target, rel: action.rel, download: action.download, label: action.label, closeOnClick: false, onClick: () => {
                                    close.current();
                                    action.onSelect?.();
                                }, children: content }, action.id));
                        }
                        return (_jsx(BaseContextMenu.Item, { nativeButton: true, render: _jsx("button", { type: "button" }), disabled: action.disabled, label: action.label, closeOnClick: false, onClick: () => {
                                close.current();
                                action.onSelect();
                            }, children: content }, action.id));
                    }) }) }) }) }));
}
