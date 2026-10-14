import type { ReactNode } from 'react';
import {
  type ContextMenuItem,
  FinderActions,
  FinderHistory,
  FinderSearch,
  FinderTitle,
  FinderToolbar,
  FinderToolbarButton,
  FinderToolbarGroup,
  type FinderView,
  FinderViewSwitcher,
} from '../src/index.js';
import { ViewGlyph } from './finder-artwork.js';

interface DemoToolbarProps {
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

/** Only application wiring remains here; every rendered part is public. */
export function DemoToolbar({
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
}: DemoToolbarProps) {
  return (
    <FinderToolbar keyboardNavigation>
      <FinderHistory
        onBack={canBack ? () => onTravel(-1) : undefined}
        onForward={canForward ? () => onTravel(1) : undefined}
        backIcon={<ViewGlyph view="back" />}
        forwardIcon={<ViewGlyph view="forward" />}
      />
      <FinderTitle>{folder}</FinderTitle>
      <FinderViewSwitcher
        value={view}
        onValueChange={onView}
        icons={{
          icons: <ViewGlyph view="icons" selected={view === 'icons'} />,
          list: <ViewGlyph view="list" selected={view === 'list'} />,
          columns: <ViewGlyph view="columns" selected={view === 'columns'} />,
          gallery: <ViewGlyph view="gallery" selected={view === 'gallery'} />,
          outline: <ViewGlyph view="outline" selected={view === 'outline'} />,
        }}
      />
      <FinderToolbarGroup aria-label="File commands">
        {tags}
        <FinderToolbarButton
          aria-label="Quick Look"
          title="Quick Look"
          disabled={!canPreview}
          onClick={onPreview}
        >
          <ViewGlyph view="preview" />
        </FinderToolbarButton>
        <FinderActions actions={actions} icon={<ViewGlyph view="actions" />} />
      </FinderToolbarGroup>
      <FinderSearch value={query} onValueChange={onQuery} icon={<ViewGlyph view="search" />} />
    </FinderToolbar>
  );
}
