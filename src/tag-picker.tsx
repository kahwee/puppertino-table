'use client';
import { type ReactNode, useId, useRef, useState } from 'react';
import { useTagPopover } from './use-tag-popover.js';

export interface TagOption {
  id: string;
  label: string;
  disabled?: boolean;
}
export interface TagPickerProps {
  options: readonly TagOption[];
  /** Assigned IDs. The application owns persistence. */
  value: readonly string[];
  onValueChange(value: string[]): void;
  /** IDs assigned to some, but not all, selected items. */
  mixedValue?: readonly string[];
  onCreate?(label: string): void;
  disabled?: boolean;
  trigger?: ReactNode;
  triggerClassName?: string;
  title?: string;
}

/** Controlled tags in a Finder-style token field. Import Puppertino popover CSS. */
export function TagPicker({
  options,
  value,
  onValueChange,
  mixedValue = [],
  onCreate,
  disabled = false,
  trigger = 'Tags',
  triggerClassName = 'p-button',
  title = 'Assign tags',
}: TagPickerProps) {
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const tokens = useRef(new Map<string, HTMLButtonElement>());
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const normalized = query.trim().toLowerCase();
  const exact = options.find((option) => option.label.trim().toLowerCase() === normalized);
  const candidates = options.filter(
    (option) => !value.includes(option.id) && option.label.toLowerCase().includes(normalized),
  );
  const canCreate = Boolean(onCreate && normalized && !exact);
  const choices = [
    ...candidates.filter((option) => !option.disabled),
    ...(canCreate ? [{ id: '', label: query.trim(), create: true }] : []),
  ];
  const optionId = (option: TagOption) =>
    `${id}-option-${options.indexOf(option) < 0 ? options.length : options.indexOf(option)}`;
  const close = (restore = false) => {
    setOpen(false);
    setQuery('');
    setActive(-1);
    if (restore) anchor.current?.focus();
  };
  useTagPopover(open && !disabled, anchor, panel, input);
  const apply = (option: TagOption & { create?: boolean }) => {
    if (disabled || option.disabled) return;
    if (option.create) onCreate?.(query.trim());
    else if (!value.includes(option.id)) onValueChange([...value, option.id]);
    setQuery('');
    setActive(-1);
    input.current?.focus();
  };
  const remove = (key: string) => {
    if (disabled || options.find((option) => option.id === key)?.disabled) return;
    onValueChange(value.filter((item) => item !== key));
    input.current?.focus();
  };
  return (
    <fieldset
      className="pt-tag-picker"
      aria-label="Tags"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          close();
      }}
    >
      <button
        ref={anchor}
        type="button"
        className={triggerClassName}
        aria-label="Tags"
        title="Tags"
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open && !disabled}
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {trigger}
      </button>
      <div
        id={id}
        ref={panel}
        popover="auto"
        role="dialog"
        aria-label="Assign tags"
        className="p-popover pt-tag-popover"
        data-state={open && !disabled ? 'open' : 'closed'}
        onToggle={(event) => {
          if (event.newState === 'closed') close();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }
        }}
      >
        <div className="pt-tag-content">
          <div className="pt-tag-title" title={title}>
            {title}
          </div>
          <div className="pt-tag-field">
            {value.map((key) => {
              const option = options.find((item) => item.id === key);
              return (
                <button
                  key={key}
                  type="button"
                  className="pt-tag-token"
                  disabled={option?.disabled}
                  ref={(node) => {
                    if (node) tokens.current.set(key, node);
                    else tokens.current.delete(key);
                  }}
                  aria-label={`Remove tag ${option?.label ?? key}`}
                  title={`Remove ${option?.label ?? key}`}
                  onClick={() => remove(key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' || event.key === 'Delete') {
                      event.preventDefault();
                      remove(key);
                    }
                  }}
                >
                  {option?.label ?? key}
                </button>
              );
            })}
            <input
              ref={input}
              role="combobox"
              aria-label="Tag name"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={`${id}-options`}
              aria-activedescendant={
                active >= 0 && choices[active] ? optionId(choices[active]) : undefined
              }
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const next = choices.length
                    ? (active +
                        (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) +
                        choices.length) %
                      choices.length
                    : -1;
                  setActive(next);
                  document
                    .getElementById(choices[next] ? optionId(choices[next]) : '')
                    ?.scrollIntoView({ block: 'nearest' });
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  const option =
                    choices[active] ??
                    exact ??
                    (canCreate ? { id: '', label: query.trim(), create: true } : undefined);
                  if (option) apply(option);
                }
                if (event.key === 'Backspace' && !query && value.length) {
                  event.preventDefault();
                  tokens.current.get(value[value.length - 1])?.focus();
                }
              }}
            />
          </div>
          <div
            id={`${id}-options`}
            role="listbox"
            aria-label="Available tags"
            className="pt-tag-options"
          >
            {candidates.map((option) => (
              <button
                key={option.id}
                id={optionId(option)}
                type="button"
                role="option"
                tabIndex={-1}
                disabled={option.disabled}
                aria-selected={choices[active] === option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply(option)}
              >
                <span className="pt-tag-dot" aria-hidden="true" />
                <span className="pt-tag-label">{option.label}</span>
                {mixedValue.includes(option.id) && <small>Some items</small>}
              </button>
            ))}
            {canCreate && (
              <button
                id={`${id}-option-${options.length}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={active === choices.length - 1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply({ id: '', label: query.trim(), create: true })}
              >
                Create tag “{query.trim()}”
              </button>
            )}
          </div>
          {!candidates.length && !canCreate && (
            <div className="pt-tag-empty">
              {normalized ? 'No matching tags' : 'All tags assigned'}
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
