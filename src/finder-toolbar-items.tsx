'use client';
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FinderActions, FinderToolbarButton, FinderToolbarGroup } from './finder-toolbar.js';

export interface FinderToolbarItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Consecutive tools with the same group share a capsule. */
  group?: string;
  disabled?: boolean;
  pressed?: boolean;
  onSelect(): void;
}
export interface FinderToolbarItemsProps {
  items: readonly FinderToolbarItem[];
  /** App-owned IDs, in display order. Omit to show all items. */
  selectedIds?: readonly string[];
  onSelectedIdsChange?(ids: string[]): void;
  overflowIcon: ReactNode;
  label?: string;
}
/** Optional center tools shrink into a menu; navigation and Search stay outside this group. */
export function FinderToolbarItems({
  items,
  selectedIds,
  onSelectedIdsChange,
  overflowIcon,
  label = 'Optional tools',
}: FinderToolbarItemsProps) {
  const selected = useMemo(
    () =>
      [...new Set(selectedIds ?? items.map((item) => item.id))].flatMap((id) => {
        const item = items.find((item) => item.id === id);
        return item ? [item] : [];
      }),
    [items, selectedIds],
  );
  const group = useRef<HTMLFieldSetElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState(selected.length);
  const panelId = useId();
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const returnFocus = useRef<HTMLElement | null>(null);
  const widthFor = useCallback(
    (count: number) => {
      const tools = selected.slice(0, count);
      const groups = tools.filter(
        (item, index) => index === 0 || item.group !== tools[index - 1].group,
      ).length;
      return count * 32 + groups * 4 + Math.max(0, groups - 1) * 8;
    },
    [selected],
  );
  const customizable = !!onSelectedIdsChange;
  const preferredWidth = widthFor(selected.length) + (customizable ? 44 : 0);
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const measure = () => {
      const available = node.getBoundingClientRect().width;
      let next = selected.length;
      if (customizable || widthFor(next) > available + 0.5) {
        while (next > 0 && widthFor(next) + (next ? 44 : 36) > available + 0.5) next--;
      }
      const focused = document.activeElement;
      const index = selected.findIndex(
        (item) => focused instanceof HTMLElement && focused.dataset.toolbarItem === item.id,
      );
      setSlots(next);
      if (index >= next && index >= 0)
        requestAnimationFrame(() => {
          if (document.activeElement === document.body || document.activeElement === focused)
            node.querySelector<HTMLButtonElement>('[aria-label="More tools"]')?.focus();
        });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    measure();
    return () => resize.disconnect();
  }, [selected, widthFor, customizable]);
  const positionPanel = useCallback(() => {
    const trigger = returnFocus.current;
    const dialog = panel.current;
    if (!trigger || !dialog) return;
    const rect = trigger.getBoundingClientRect();
    const bounds = dialog.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 8)),
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - bounds.height - 8)),
    });
  }, []);
  useEffect(() => {
    const reposition = () => {
      if (panel.current?.matches(':popover-open')) positionPanel();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    const resize = new ResizeObserver(reposition);
    if (group.current) resize.observe(group.current);
    if (panel.current) resize.observe(panel.current);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      resize.disconnect();
    };
  }, [positionPanel]);
  const close = () => {
    panel.current?.hidePopover();
    returnFocus.current?.focus();
  };
  const customize = () => {
    const trigger = group.current?.querySelector<HTMLButtonElement>('[aria-label="More tools"]');
    if (!trigger) return;
    returnFocus.current = trigger;
    requestAnimationFrame(() => {
      panel.current?.showPopover();
      positionPanel();
    });
  };
  const change = (ids: string[]) => onSelectedIdsChange?.(ids);
  const move = (id: string, direction: number) => {
    const focused = document.activeElement;
    const ids = selected.map((item) => item.id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    change(ids);
    requestAnimationFrame(() => {
      if (focused instanceof HTMLElement && focused.isConnected && !focused.matches(':disabled'))
        focused.focus();
      else
        Array.from(panel.current?.querySelectorAll<HTMLInputElement>('input') ?? [])
          .find((input) => input.dataset.toolbarId === id)
          ?.focus();
    });
  };
  if (!selected.length && !customizable) return null;
  const clusters: { label: string; items: FinderToolbarItem[] }[] = [];
  for (const item of selected.slice(0, slots)) {
    const previous = clusters.at(-1);
    if (previous && previous.label === (item.group ?? label)) previous.items.push(item);
    else clusters.push({ label: item.group ?? label, items: [item] });
  }
  return (
    <fieldset
      ref={group}
      aria-label={label}
      className="pt-finder-toolbar-items"
      style={{ width: preferredWidth, flexBasis: preferredWidth }}
    >
      {clusters.map((cluster) => (
        <FinderToolbarGroup key={cluster.items[0].id} aria-label={cluster.label}>
          {cluster.items.map((item) => (
            <FinderToolbarButton
              key={item.id}
              data-toolbar-item={item.id}
              label={item.label}
              disabled={item.disabled}
              aria-pressed={item.pressed}
              onClick={item.onSelect}
            >
              {item.icon}
            </FinderToolbarButton>
          ))}
        </FinderToolbarGroup>
      ))}
      {(customizable || selected.length > slots) && (
        <FinderActions
          label="More tools"
          menuLabel="More toolbar tools"
          buttonClassName="p-toolbar-circle"
          icon={overflowIcon}
          actions={[
            ...selected.slice(slots).map((item) => ({ ...item, checked: item.pressed })),
            ...(onSelectedIdsChange
              ? [{ id: 'customize-toolbar', label: 'Customize Toolbar…', onSelect: customize }]
              : []),
          ]}
        />
      )}
      <div
        ref={panel}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-label="Customize Toolbar"
        className="pt-toolbar-customize"
        style={position}
        onToggle={(event) => {
          if (event.newState === 'open')
            panel.current?.querySelector<HTMLInputElement>('input')?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <h2 className="pt-toolbar-customize-title">Customize Toolbar</h2>
        <p>Choose tools, then adjust their order.</p>
        {[
          ...selected,
          ...items.filter((item) => !selected.some((selected) => selected.id === item.id)),
        ].map((item) => {
          const index = selected.findIndex((selected) => selected.id === item.id);
          return (
            <div className="pt-toolbar-customize-row" key={item.id}>
              <label className="pt-toolbar-customize-label">
                <input
                  data-toolbar-id={item.id}
                  type="checkbox"
                  checked={index >= 0}
                  onChange={(event) =>
                    change(
                      event.target.checked
                        ? [...selected.map((item) => item.id), item.id]
                        : selected
                            .filter((selected) => selected.id !== item.id)
                            .map((item) => item.id),
                    )
                  }
                />
                <span className="pt-toolbar-customize-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </label>
              <span className="pt-toolbar-customize-order">
                <button
                  type="button"
                  aria-label={`Move ${item.label} earlier`}
                  disabled={index <= 0}
                  onClick={() => move(item.id, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.label} later`}
                  disabled={index < 0 || index === selected.length - 1}
                  onClick={() => move(item.id, 1)}
                >
                  ↓
                </button>
              </span>
            </div>
          );
        })}
        <div className="pt-toolbar-customize-footer">
          <button
            type="button"
            className="p-button"
            onClick={() => change(items.map((item) => item.id))}
          >
            Restore default tools
          </button>
          <button type="button" className="p-button p-button-primary" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </fieldset>
  );
}
