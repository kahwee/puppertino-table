import { type ReactNode, useState } from 'react';
import {
  type ContextMenuItem,
  FinderActions,
  FinderHistory,
  FinderSearch,
  FinderTitle,
  FinderToolbar,
  FinderToolbarGroup,
  FinderToolbarItems,
  type FinderView,
  finderViews,
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
  const [tools, setTools] = useState<string[]>([...finderViews, 'quick-look']);
  return (
    <FinderToolbar keyboardNavigation>
      <FinderHistory
        onBack={canBack ? () => onTravel(-1) : undefined}
        onForward={canForward ? () => onTravel(1) : undefined}
        backIcon={<ViewGlyph view="back" />}
        forwardIcon={<ViewGlyph view="forward" />}
      />
      <FinderTitle>{folder}</FinderTitle>
      <FinderToolbarItems
        items={[
          ...finderViews.map((item) => ({
            id: item,
            group: 'View',
            label: item[0].toUpperCase() + item.slice(1),
            icon: <ViewGlyph view={item} selected={view === item} />,
            pressed: view === item,
            onSelect: () => onView(item),
          })),
          {
            id: 'quick-look',
            group: 'Preview',
            label: 'Quick Look',
            icon: <ViewGlyph view="preview" />,
            disabled: !canPreview,
            onSelect: onPreview,
          },
        ]}
        selectedIds={tools}
        onSelectedIdsChange={setTools}
        overflowIcon={<ViewGlyph view="overflow" />}
      />
      <FinderToolbarGroup aria-label="File commands">
        {tags}
        <FinderActions actions={actions} icon={<ViewGlyph view="actions" />} />
      </FinderToolbarGroup>
      <FinderSearch value={query} onValueChange={onQuery} icon={<ViewGlyph view="search" />} />
    </FinderToolbar>
  );
}
