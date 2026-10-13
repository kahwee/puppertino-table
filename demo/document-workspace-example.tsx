import {
  ColumnsIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderIcon,
  ImagesIcon,
  ListIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
  TagIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import {
  ColumnView,
  ColumnViewItem,
  createPuppertinoColumnHelper,
  FinderActions,
  FinderBody,
  FinderContent,
  FinderEmptyState,
  FinderFilmstrip,
  FinderGallery,
  FinderGalleryItem,
  FinderIconGrid,
  FinderIconItem,
  FinderPathBar,
  FinderPreview,
  FinderSearch,
  FinderStatusBar,
  FinderTitle,
  FinderToolbar,
  FinderToolbarGroup,
  type FinderView,
  FinderViewSwitcher,
  FinderWindow,
  type OutlineExpandedState,
  OutlineView,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SplitView,
  type SplitViewProps,
  TableView,
  TagPicker,
} from '../src/index.js';

interface Document {
  location: 'Documents' | 'Archive';
  summary: string;
  id: string;
  name: string;
  children?: readonly Document[];
}
const helper = createPuppertinoColumnHelper<Document>();
const columns = helper.columns([helper.accessor('name', { header: 'Name', size: 340 })]);
export interface CompositionProps {
  section: 'Documents' | 'Archive';
  activePaneId: 'sidebar' | 'content' | 'detail';
  previewHidden: boolean;
  artwork: 'symbol' | 'thumbnail';
  onSizesCommit?: SplitViewProps['onSizesCommit'];
  onSectionChange(value: 'Documents' | 'Archive'): void;
  onActivePaneChange(value: 'sidebar' | 'content' | 'detail'): void;
  onPreviewHiddenChange(value: boolean): void;
  onDocumentAction(value: 'trash' | 'undo', ids: string[]): void;
  view: FinderView;
  query: string;
  onViewChange(value: FinderView): void;
  onQueryChange(value: string): void;
}
/** Consumer-owned data and behavior, using only public library imports. */
export function Composition({
  view,
  query,
  section,
  activePaneId,
  previewHidden,
  artwork,
  onViewChange,
  onQueryChange,
  onSectionChange,
  onActivePaneChange,
  onPreviewHiddenChange,
  onDocumentAction,
  onSizesCommit,
}: CompositionProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'brief',
      name: 'Brief.pdf',
      location: 'Documents',
      summary: 'A project brief for the Alpine launch. Scope, milestones and review owners.',
    },
    {
      id: 'notes',
      name: 'Notes.md',
      location: 'Documents',
      summary: 'Design review notes and follow-up tasks for the document workspace.',
    },
    {
      id: 'report',
      name: 'Launch report.pdf',
      location: 'Archive',
      summary: 'The completed launch report, retained in Archive.',
    },
  ]);
  const [trashed, setTrashed] = useState<Document[]>([]);
  const [expanded, setExpanded] = useState<OutlineExpandedState>({ 'collection:documents': true });
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const visible = documents.filter(
    (item) => item.location === section && item.name.toLowerCase().includes(query.toLowerCase()),
  );
  const chosen = visible.filter((item) => selected[item.id]);
  const active = chosen[0];
  const CollectionView = view === 'outline' ? OutlineView<Document> : TableView<Document>;
  const choose = (id: string) => setSelected({ [id]: true });
  const navigate = (location: 'Documents' | 'Archive') => {
    setSelected({});
    onQueryChange('');
    onSectionChange(location);
    onActivePaneChange('content');
  };
  const preview = (
    <FinderPreview
      artwork={
        artwork === 'thumbnail' ? (
          <img src="./media/icons-light.png" width={1080} height={640} alt="" />
        ) : (
          <FileTextIcon size={72} weight="light" aria-hidden="true" />
        )
      }
      heading={active?.name ?? 'Select a document'}
      description={active?.summary ?? 'Select an item to inspect its contents and assigned tags.'}
    />
  );
  return (
    <FinderWindow aria-label="Composed document browser">
      <FinderToolbar>
        <FinderTitle>Documents</FinderTitle>
        <FinderViewSwitcher
          value={view}
          onValueChange={onViewChange}
          icons={{
            outline: (
              <TreeStructureIcon
                weight={view === 'outline' ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            ),
            icons: (
              <SquaresFourIcon
                size={20}
                weight={view === 'icons' ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            ),
            list: (
              <ListIcon
                size={20}
                weight={view === 'list' ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            ),
            columns: (
              <ColumnsIcon
                size={20}
                weight={view === 'columns' ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            ),
            gallery: (
              <ImagesIcon
                size={20}
                weight={view === 'gallery' ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            ),
          }}
        />
        <FinderToolbarGroup aria-label="Document commands">
          <TagPicker
            options={[
              { id: 'review', label: 'Review' },
              { id: 'work', label: 'Work' },
            ]}
            value={active ? (tags[active.id] ?? []) : []}
            onValueChange={(value) => {
              if (active) setTags((previous) => ({ ...previous, [active.id]: value }));
            }}
            disabled={chosen.length !== 1}
            trigger={<TagIcon weight="regular" aria-hidden="true" />}
            triggerClassName="p-toolbar-btn"
          />
          <FinderActions
            icon={<DotsThreeIcon weight="regular" aria-hidden="true" />}
            actions={[
              {
                id: 'trash',
                label: 'Move to Trash',
                disabled: !active,
                onSelect: () => {
                  setTrashed(chosen);
                  onDocumentAction(
                    'trash',
                    chosen.map((item) => item.id),
                  );
                  setDocuments((items) =>
                    items.filter((item) => !chosen.some((target) => target.id === item.id)),
                  );
                  setSelected({});
                },
              },
            ]}
          />
        </FinderToolbarGroup>
        <FinderSearch
          value={query}
          onValueChange={(value) => {
            setSelected({});
            onQueryChange(value);
          }}
          icon={<MagnifyingGlassIcon weight="regular" aria-hidden="true" />}
        />
      </FinderToolbar>
      <nav
        aria-label="Workspace panes"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12 }}
      >
        {(['sidebar', 'content', 'detail'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="p-button"
            aria-pressed={activePaneId === id}
            onClick={() => {
              if (id === 'detail') onPreviewHiddenChange(false);
              onActivePaneChange(id);
            }}
          >
            {id === 'sidebar' ? 'Locations' : id === 'content' ? 'Documents' : 'Preview'}
          </button>
        ))}
        <button
          type="button"
          className="p-button"
          aria-pressed={previewHidden}
          onClick={() => onPreviewHiddenChange(!previewHidden)}
        >
          Hide preview
        </button>
        <button
          type="button"
          className="p-button"
          disabled={!trashed.length}
          onClick={() => {
            setDocuments((items) => [...items, ...trashed]);
            onDocumentAction(
              'undo',
              trashed.map((item) => item.id),
            );
            setTrashed([]);
          }}
        >
          Undo Trash
        </button>
      </nav>
      <FinderBody density="comfortable" style={{ height: 440 }}>
        <SplitView
          ariaLabel="Document workspace panes"
          activePaneId={activePaneId}
          style={{ height: '100%', width: '100%' }}
          onSizesCommit={onSizesCommit}
          panes={[
            {
              id: 'sidebar',
              label: 'Locations',
              size: 180,
              minSize: 140,
              maxSize: 260,
              content: (
                <Sidebar aria-label="Document locations" style={{ width: '100%', minWidth: 0 }}>
                  <SidebarGroup label="Favorites">
                    {(['Documents', 'Archive'] as const).map((location) => (
                      <SidebarItem
                        key={location}
                        selected={section === location}
                        icon={<FolderIcon weight="regular" aria-hidden="true" />}
                        detail={documents.filter((item) => item.location === location).length}
                        onClick={() => navigate(location)}
                      >
                        {location}
                      </SidebarItem>
                    ))}
                  </SidebarGroup>
                </Sidebar>
              ),
            },
            {
              id: 'content',
              label: 'Document collection',
              size: 420,
              minSize: 260,
              maxSize: 760,
              content: (
                <FinderContent>
                  {visible.length === 0 ? (
                    <FinderEmptyState role="status">
                      {query ? 'No matching documents' : 'No documents'}
                    </FinderEmptyState>
                  ) : view === 'list' || view === 'outline' ? (
                    <CollectionView
                      data={
                        view === 'outline'
                          ? [
                              {
                                id: 'collection:documents',
                                name: section,
                                location: section,
                                summary: '',
                                children: visible,
                              },
                            ]
                          : visible
                      }
                      {...(view === 'outline'
                        ? {
                            getChildren: (item: Document) => item.children,
                            expanded,
                            onExpandedChange: setExpanded,
                          }
                        : {})}
                      isRowSelectable={(item) => !item.children}
                      getRowLabel={(item) => item.name}
                      columns={columns}
                      getRowId={(item) => item.id}
                      ariaLabel="Documents"
                      selectable
                      selectionCheckboxes={false}
                      rowSelection={selected}
                      onRowSelectionChange={setSelected}
                      getRowProps={(row) =>
                        row.original.children
                          ? undefined
                          : {
                              onClick: (event) => {
                                event.preventDefault();
                                choose(row.id);
                              },
                            }
                      }
                    />
                  ) : view === 'icons' ? (
                    <FinderIconGrid aria-label="Document icons">
                      {visible.map((item) => (
                        <FinderIconItem
                          key={item.id}
                          selected={selected[item.id]}
                          artwork={
                            artwork === 'thumbnail' ? (
                              <img src="./media/icons-light.png" width={1080} height={640} alt="" />
                            ) : (
                              <FileTextIcon weight="light" aria-hidden="true" />
                            )
                          }
                          onClick={() => choose(item.id)}
                        >
                          {item.name}
                        </FinderIconItem>
                      ))}
                    </FinderIconGrid>
                  ) : view === 'columns' ? (
                    <ColumnView
                      ariaLabel="Document columns"
                      columns={[
                        {
                          id: 'files',
                          label: 'Documents',
                          content: visible.map((item) => (
                            <ColumnViewItem
                              key={item.id}
                              selected={selected[item.id]}
                              onClick={() => choose(item.id)}
                            >
                              {item.name}
                            </ColumnViewItem>
                          )),
                        },
                      ]}
                    />
                  ) : (
                    <FinderGallery aria-label="Document gallery">
                      {preview}
                      <FinderFilmstrip aria-label="Documents">
                        {visible.map((item) => (
                          <FinderGalleryItem
                            key={item.id}
                            aria-label={item.name}
                            selected={selected[item.id]}
                            onClick={() => choose(item.id)}
                          >
                            <FileTextIcon aria-hidden="true" />
                          </FinderGalleryItem>
                        ))}
                      </FinderFilmstrip>
                    </FinderGallery>
                  )}
                </FinderContent>
              ),
            },
            {
              id: 'detail',
              label: 'Document preview',
              minSize: 220,
              hidden: previewHidden,
              content: (
                <div style={{ padding: 16 }}>
                  {preview}
                  <output aria-label="Document tags">
                    {active
                      ? tags[active.id]?.join(', ') || 'No tags assigned'
                      : 'No document selected'}
                  </output>
                </div>
              ),
            },
          ]}
        />
      </FinderBody>
      <FinderPathBar>
        <FolderIcon size={14} aria-hidden="true" />
        <span>{section}</span>
      </FinderPathBar>
      <FinderStatusBar>
        <output aria-label="Document count">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </output>
      </FinderStatusBar>
    </FinderWindow>
  );
}
