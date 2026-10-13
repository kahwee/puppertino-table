'use client';
import { useCallback, useRef, useState } from 'react';
import { nextItemId } from './item-navigation.js';
/** Roving focus for native rows, buttons and links. Activation and commands remain app-owned. */
export function useItemNavigation({ orderedIds, getItemElement, orientation = 'vertical', columns = 1, disabled = false, isItemDisabled, onNavigate, getItemLabel, }) {
    const [focusedId, setFocusedId] = useState(null);
    const typed = useRef({ text: '', time: 0 });
    const eligible = orderedIds.filter((id) => !isItemDisabled?.(id));
    const activeId = focusedId !== null && eligible.includes(focusedId) ? focusedId : eligible[0];
    const focus = useCallback((id) => {
        if (disabled || !orderedIds.includes(id) || isItemDisabled?.(id))
            return false;
        const element = getItemElement(id);
        if (!element)
            return false;
        element.focus();
        if (element.ownerDocument.activeElement !== element)
            return false;
        element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        setFocusedId(id);
        return true;
    }, [disabled, orderedIds, isItemDisabled, getItemElement]);
    const getItemProps = (id) => ({
        tabIndex: !disabled && id === activeId ? 0 : -1,
        onFocus: () => setFocusedId(id),
        onKeyDown: (event) => {
            if (disabled ||
                event.defaultPrevented ||
                event.target !== event.currentTarget ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey)
                return;
            let next = nextItemId({
                orderedIds: eligible,
                currentId: id,
                key: event.key,
                orientation,
                columns: typeof columns === 'function' ? columns() : columns,
            });
            if (next === undefined && getItemLabel && event.key.length === 1 && event.key.trim()) {
                const now = Date.now();
                const char = event.key.toLocaleLowerCase();
                const text = now - typed.current.time > 700 ? char : typed.current.text + char;
                typed.current = { text, time: now };
                const prefix = [...text].every((letter) => letter === char) ? char : text;
                const start = eligible.indexOf(id);
                const search = [...eligible.slice(start + 1), ...eligible.slice(0, start + 1)];
                next = search.find((item) => getItemLabel(item).toLocaleLowerCase().startsWith(prefix));
                if (!next)
                    return;
            }
            if (next === undefined)
                return;
            event.preventDefault();
            event.stopPropagation();
            if (next !== id && focus(next))
                onNavigate?.(next, { shift: event.shiftKey });
        },
    });
    return { activeId, focus, getItemProps };
}
