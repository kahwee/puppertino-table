import { type ReactNode, useRef, useState } from 'react';
import { ContextMenu, type ContextMenuItem, type ContextMenuState } from '../src/index.js';
import { type FinderView, ViewGlyph } from './finder-artwork.js';

interface FinderToolbarProps {
  tags: ReactNode;
  folder: string;
  view: FinderView;
  onView(view: FinderView): void;
  canBack: boolean;
  canForward: boolean;
  onTravel(direction: number): void;
  query: string;
  onQuery(query: string): void;
  actions: readonly ContextMenuItem[];
  canPreview: boolean;
  onPreview(): void;
}

/** Finder chrome uses Puppertino's native-size window and toolbar primitives. */
export function FinderToolbar({
  tags,
  folder,
  view,
  onView,
  canBack,
  canForward,
  onTravel,
  query,
  onQuery,
  actions,
  canPreview,
  onPreview,
}: FinderToolbarProps) {
  const [menu, setMenu] = useState<ContextMenuState<null> | null>(null);
  const [searching, setSearching] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  return (
    <>
      <header className="finder-demo-toolbar">
        <div className="finder-demo-titlebar">
          <span className="p-traffic-lights" aria-hidden="true">
            <span className="p-traffic-light p-traffic-light-close" />
            <span className="p-traffic-light p-traffic-light-min" />
            <span className="p-traffic-light p-traffic-light-zoom" />
          </span>
        </div>
        <div className="finder-demo-toolbar-content">
          <div className="p-toolbar-group finder-demo-history">
            <button
              type="button"
              className="p-toolbar-btn"
              aria-label="Back"
              title="Back"
              disabled={!canBack}
              onClick={() => onTravel(-1)}
            >
              <ViewGlyph view="back" />
            </button>
            <span className="p-toolbar-divider" aria-hidden="true" />
            <button
              type="button"
              className="p-toolbar-btn"
              aria-label="Forward"
              title="Forward"
              disabled={!canForward}
              onClick={() => onTravel(1)}
            >
              <ViewGlyph view="forward" />
            </button>
          </div>
          <h1 className="finder-demo-title">{folder}</h1>
          <fieldset className="p-toolbar-group finder-demo-views" aria-label="View">
            {(['icons', 'list', 'columns', 'gallery'] as const).map((next) => (
              <button
                key={next}
                type="button"
                className="p-toolbar-btn"
                aria-label={next === 'icons' ? 'Icons' : next[0].toUpperCase() + next.slice(1)}
                title={`${next === 'icons' ? 'Icon' : next[0].toUpperCase() + next.slice(1)} view`}
                aria-pressed={view === next}
                onClick={() => onView(next)}
              >
                <ViewGlyph view={next} />
              </button>
            ))}
          </fieldset>
          <div className="p-toolbar-group finder-demo-command-group">
            {tags}
            <button
              type="button"
              className="p-toolbar-btn"
              aria-label="Quick Look"
              title="Quick Look"
              disabled={!canPreview}
              onClick={onPreview}
            >
              <ViewGlyph view="preview" />
            </button>
            <button
              type="button"
              className="p-toolbar-btn"
              aria-label="Actions"
              title="Perform actions with the selected items"
              aria-haspopup="menu"
              aria-expanded={!!menu}
              onClick={(event) => {
                const target = event.currentTarget;
                const rect = target.getBoundingClientRect();
                setMenu(
                  menu
                    ? null
                    : {
                        context: null,
                        position: { x: rect.right - 220, y: rect.bottom + 6 },
                        returnFocus: target,
                      },
                );
              }}
            >
              <ViewGlyph view="actions" />
            </button>
          </div>
          {searching || query ? (
            <label className="p-search finder-demo-search">
              <ViewGlyph view="search" />
              <input
                ref={search}
                type="search"
                aria-label="Search files"
                placeholder="Search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onQuery('');
                    setSearching(false);
                  }
                }}
              />
            </label>
          ) : (
            <button
              type="button"
              className="p-toolbar-circle finder-demo-search-toggle"
              aria-label="Search"
              title="Search"
              onClick={() => {
                setSearching(true);
                requestAnimationFrame(() => search.current?.focus());
              }}
            >
              <ViewGlyph view="search" />
            </button>
          )}
        </div>
      </header>
      <ContextMenu
        ariaLabel="Finder actions"
        position={menu?.position ?? null}
        returnFocus={menu?.returnFocus}
        onClose={() => setMenu(null)}
        actions={actions}
      />
    </>
  );
}
