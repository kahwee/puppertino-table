'use client';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { type ItemNavigationOrientation, nextItemId } from './item-navigation.js';
import type { SelectionModifiers } from './selection-gestures.js';
import { findTypeaheadMatch } from './typeahead.js';

export interface ItemNavigationHookOptions {
  orderedIds: readonly string[];
  getItemElement(id: string): HTMLElement | null | undefined;
  orientation?: ItemNavigationOrientation;
  /** Supply a function to measure responsive grid columns when a key is pressed. */
  columns?: number | (() => number);
  disabled?: boolean;
  isItemDisabled?(id: string): boolean;
  /** Called after navigation; connect it to app selection when desired. */
  onNavigate?(id: string, modifiers: SelectionModifiers): void;
  /** Enables prefix matching; repeated characters cycle through matching items. */
  getItemLabel?(id: string): string;
}

/** Roving focus for native rows, buttons and links. Activation and commands remain app-owned. */
export function useItemNavigation({
  orderedIds,
  getItemElement,
  orientation = 'vertical',
  columns = 1,
  disabled = false,
  isItemDisabled,
  onNavigate,
  getItemLabel,
}: ItemNavigationHookOptions) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const typed = useRef({ text: '', time: 0 });
  const eligible = isItemDisabled ? orderedIds.filter((id) => !isItemDisabled(id)) : orderedIds;
  const activeId = focusedId !== null && eligible.includes(focusedId) ? focusedId : eligible[0];
  const focus = useCallback(
    (id: string) => {
      if (disabled || !orderedIds.includes(id) || isItemDisabled?.(id)) return false;
      const element = getItemElement(id);
      if (!element) return false;
      element.focus();
      if (element.ownerDocument.activeElement !== element) return false;
      element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      setFocusedId(id);
      return true;
    },
    [disabled, orderedIds, isItemDisabled, getItemElement],
  );
  const getItemProps = (id: string) => ({
    tabIndex: !disabled && id === activeId ? 0 : -1,
    onFocus: () => setFocusedId(id),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (
        disabled ||
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
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
        next = findTypeaheadMatch(eligible, id, prefix, getItemLabel);
        if (next === undefined) return;
      }
      if (next === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      if (next !== id && focus(next)) onNavigate?.(next, { shift: event.shiftKey });
    },
  });
  return { activeId, focus, getItemProps };
}
