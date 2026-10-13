import { TagIcon } from '@phosphor-icons/react';
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ViewGlyph } from './finder-artwork.js';
import type { FileItem } from './finder-files.js';

interface FinderTagsProps {
  files: FileItem[];
  available: string[];
  disabled: boolean;
  onTag(tag: string, remove?: boolean): void;
}

/** Application-owned tags, presented as Finder's token field and suggestions. */
export function FinderTags({ files, available, disabled, onTag }: FinderTagsProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const assigned = available.filter(
    (tag) => files.length && files.every((file) => file.tags?.includes(tag)),
  );
  const close = () => {
    setOpen(false);
    setQuery('');
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    if (disabled || !files.length) {
      setOpen(false);
      setQuery('');
      return;
    }
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, disabled, files.length]);
  useLayoutEffect(() => {
    if (!open || disabled || !files.length) return;
    const fit = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      const width = panel.current?.getBoundingClientRect().width;
      if (!anchor || !width) return;
      const left = anchor.right + 30 - width;
      setOffset(Math.max(8 - left, Math.min(0, window.innerWidth - 8 - (left + width))));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open, disabled, files.length]);
  const apply = (tag: string) => {
    const clean = tag.trim();
    if (!clean || disabled) return;
    onTag(clean);
    setQuery('');
    input.current?.focus();
  };
  return (
    <fieldset
      aria-label="File tags"
      ref={root}
      className="finder-demo-tag-anchor"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="p-toolbar-btn"
        aria-label="Tags"
        title="Edit tags"
        aria-haspopup="dialog"
        aria-expanded={open && !disabled && files.length > 0}
        disabled={disabled || !files.length}
        onClick={() => setOpen(!open)}
      >
        <TagIcon size={20} aria-hidden="true" />
      </button>
      {open && !disabled && files.length > 0 && (
        <div
          ref={panel}
          style={
            {
              transform: `translateX(${offset}px)`,
              '--p-popover-arrow-x': `calc(100% - ${46 + offset}px)`,
            } as CSSProperties
          }
          role="dialog"
          aria-label="Assign tags"
          className="p-popover finder-demo-tags"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <span className="finder-demo-tags-title">
            Assign tags to {files.length === 1 ? `“${files[0].name}”` : `${files.length} items`}
          </span>
          <div className="finder-demo-tag-input">
            {assigned.map((tag) => (
              <button
                key={tag}
                type="button"
                className="finder-demo-tag-token"
                aria-label={`Remove tag ${tag}`}
                title={`Remove ${tag}`}
                onClick={() => {
                  onTag(tag, true);
                  input.current?.focus();
                }}
              >
                {tag}
              </button>
            ))}
            <input
              ref={input}
              aria-label="Tag name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  apply(query);
                }
                if (event.key === 'Backspace' && !query && assigned.length)
                  onTag(assigned[assigned.length - 1], true);
              }}
            />
          </div>
          <div className="finder-demo-tag-options">
            {available
              .filter(
                (tag) => !assigned.includes(tag) && tag.toLowerCase().includes(query.toLowerCase()),
              )
              .map((tag) => (
                <button type="button" key={tag} onClick={() => apply(tag)}>
                  <ViewGlyph view="tag" />
                  {tag}
                </button>
              ))}
            {query.trim() && !available.includes(query.trim()) && (
              <button type="button" onClick={() => apply(query)}>
                Create tag “{query.trim()}”
              </button>
            )}
          </div>
        </div>
      )}
    </fieldset>
  );
}
