'use client';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { FinderActions, FinderToolbarButton, FinderToolbarGroup } from './finder-toolbar.js';

export interface FinderToolbarItem {
  id: string;
  label: string;
  icon: ReactNode;
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
  const selected = [...new Set(selectedIds ?? items.map((item) => item.id))].flatMap((id) => {
    const item = items.find((item) => item.id === id);
    return item ? [item] : [];
  });
  const group = useRef<HTMLFieldSetElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState(selected.length);
  const panelId = useId();
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const returnFocus = useRef<HTMLElement | null>(null);
  const preferredWidth = selected.length * 32 + 40;
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const measure = () =>
      setSlots(Math.max(0, Math.floor((node.getBoundingClientRect().width - 40) / 32)));
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    measure();
    return () => resize.disconnect();
  }, []);
  const customize = () => {
    const trigger = group.current?.querySelector<HTMLButtonElement>('[aria-label="More tools"]');
    if (!trigger) return;
    returnFocus.current = trigger;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(rect.right - 280, window.innerWidth - 288)),
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 340)),
    });
    requestAnimationFrame(() => panel.current?.showPopover());
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
  return (
    <FinderToolbarGroup
      ref={group}
      aria-label={label}
      className="pt-finder-toolbar-items"
      style={{ width: preferredWidth, flexBasis: preferredWidth }}
    >
      {selected.slice(0, slots).map((item) => (
        <FinderToolbarButton
          key={item.id}
          label={item.label}
          disabled={item.disabled}
          aria-pressed={item.pressed}
          onClick={item.onSelect}
        >
          {item.icon}
        </FinderToolbarButton>
      ))}
      <FinderActions
        label="More tools"
        menuLabel="More toolbar tools"
        icon={overflowIcon}
        actions={[
          ...selected.slice(slots).map((item) => ({ ...item, checked: item.pressed })),
          ...(onSelectedIdsChange
            ? [{ id: 'customize-toolbar', label: 'Customize Toolbar…', onSelect: customize }]
            : []),
        ]}
        disabled={!onSelectedIdsChange && selected.length <= slots}
      />
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
            panel.current?.hidePopover();
            returnFocus.current?.focus();
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
        <button
          type="button"
          className="p-button"
          onClick={() => change(items.map((item) => item.id))}
        >
          Restore default tools
        </button>
      </div>
    </FinderToolbarGroup>
  );
}
