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
import type { RowSelectionState } from '@tanstack/react-table';
import { useMemo, useRef, useState } from 'react';
import {
  applySelectionGesture,
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

export type WorkspaceDataPreset = 'standard' | 'empty' | 'longNames' | 'large' | 'readOnly';
interface Document {
  readOnly?: boolean;
  location: 'Documents' | 'Archive';
  summary: string;
  id: string;
  name: string;
  children?: readonly Document[];
}
export function workspaceDocuments(preset: WorkspaceDataPreset): Document[] {
  const initial: Document[] = [
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
  ];

  if (preset === 'empty') return [];
  if (preset === 'large')
    return Array.from({ length: 250 }, (_, index) => ({
      id: `document-${index}`,
      name: `Project review ${String(index + 1).padStart(3, '0')}.pdf`,
      location: index < 200 ? 'Documents' : 'Archive',
      summary: `Review ${index + 1}: milestones, decisions and owners.`,
    }));
  return initial.map((item) => ({
    ...item,
    readOnly: preset === 'readOnly' && item.id === 'brief',
    name:
      preset === 'longNames'
        ? `Alpine — final review notes and project decisions for the international launch — ${item.name}`
        : item.name,
  }));
}

const helper = createPuppertinoColumnHelper<Document>();
const columns = helper.columns([helper.accessor('name', { header: 'Name', size: 340 })]);
export interface CompositionProps {
  dataPreset: WorkspaceDataPreset;
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
  dataPreset,
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
  const [documents, setDocuments] = useState(() => workspaceDocuments(dataPreset));
  const collection = useRef<HTMLDivElement>(null);
  const anchor = useRef<string | null>(null);
  const [result, setResult] = useState('Select a document to preview it.');
  const focusCollection = () => {
    onActivePaneChange('content');
    requestAnimationFrame(() => collection.current?.focus());
  };
  const [trashed, setTrashed] = useState<Document[]>([]);
  const [expanded, setExpanded] = useState<OutlineExpandedState>({ 'collection:documents': true });
  const [selected, setSelected] = useState<RowSelectionState>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const visible = useMemo(
    () =>
      documents.filter(
        (item) =>
          item.location === section && item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [documents, section, query],
  );
  const chosen = visible.filter((item) => selected[item.id]);
  const active = chosen[0];
  const CollectionView = view === 'outline' ? OutlineView<Document> : TableView<Document>;
  const choose = (
    id: string,
    event: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {},
    ids = visible.map((item) => item.id),
  ) => {
    const previousAnchor = anchor.current;
    const modifiers = {
      shift: event.shiftKey ?? false,
      toggle: Boolean(event.metaKey || event.ctrlKey),
    };
    anchor.current = applySelectionGesture(ids, {}, previousAnchor, id, modifiers).anchor;
    setSelected(
      (previous) => applySelectionGesture(ids, previous, previousAnchor, id, modifiers).selection,
    );
    const item = visible.find((item) => item.id === id);
    const chosen = applySelectionGesture(ids, selected, previousAnchor, id, modifiers).selection[
      id
    ];
    setResult(
      item?.readOnly
        ? `${item.name} is read only.`
        : `${chosen ? 'Selected' : 'Deselected'} ${item?.name ?? 'document'}.`,
    );
  };
  const navigate = (location: 'Documents' | 'Archive') => {
    setSelected({});
    anchor.current = null;
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
      description={
        active
          ? `${active.summary}${active.readOnly ? ' Read only: tags and Trash are unavailable.' : ''}`
          : 'Select an item to inspect its contents and assigned tags.'
      }
    />
  );
  return (
    <FinderWindow appearance="tahoe" aria-label="Composed document browser">
      <FinderToolbar keyboardNavigation label="Document toolbar">
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
              if (active && !active.readOnly) {
                setResult(`Updated tags for ${active.name}.`);
                setTags((previous) => ({ ...previous, [active.id]: value }));
              }
            }}
            disabled={chosen.length !== 1 || Boolean(active?.readOnly)}
            trigger={<TagIcon weight="regular" aria-hidden="true" />}
            triggerClassName="p-toolbar-btn"
          />
          <FinderActions
            icon={<DotsThreeIcon weight="regular" aria-hidden="true" />}
            actions={[
              {
                id: 'trash',
                label: 'Move to Trash',
                disabled: !active || chosen.some((item) => item.readOnly),
                onSelect: () => {
                  if (!chosen.length || chosen.some((item) => item.readOnly)) return;
                  setResult(
                    `Moved ${chosen.length} ${chosen.length === 1 ? 'document' : 'documents'} to Trash. Undo is available.`,
                  );
                  setTrashed(chosen);
                  onDocumentAction(
                    'trash',
                    chosen.map((item) => item.id),
                  );
                  setDocuments((items) =>
                    items.filter((item) => !chosen.some((target) => target.id === item.id)),
                  );
                  setSelected({});
                  anchor.current = null;
                  focusCollection();
                },
              },
            ]}
          />
        </FinderToolbarGroup>
        <FinderSearch
          value={query}
          onValueChange={(value) => {
            setSelected({});
            anchor.current = null;
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
          onClick={() => {
            onPreviewHiddenChange(!previewHidden);
            if (!previewHidden) focusCollection();
          }}
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
            setSelected(Object.fromEntries(trashed.map((item) => [item.id, true])));
            setResult(
              `Restored ${trashed.length} ${trashed.length === 1 ? 'document' : 'documents'}.`,
            );
            setTrashed([]);
            focusCollection();
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
                <FinderContent
                  ref={collection}
                  tabIndex={-1}
                  role="region"
                  aria-label="Document list"
                >
                  {visible.length === 0 ? (
                    <FinderEmptyState role="status">
                      <h2>{query ? 'No matching documents' : 'No documents here'}</h2>
                      <p>
                        {query
                          ? 'Try a different filename or clear the search.'
                          : 'Choose another location or reset the example.'}
                      </p>
                      {query && (
                        <button
                          type="button"
                          className="p-button"
                          onClick={() => {
                            onQueryChange('');
                            focusCollection();
                          }}
                        >
                          Clear search
                        </button>
                      )}
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
                      getRowProps={(row, context) =>
                        row.original.children
                          ? undefined
                          : {
                              onClick: (event) => {
                                event.preventDefault();
                                event.currentTarget.focus();
                                choose(
                                  row.id,
                                  event,
                                  context.table
                                    .getRowModel()
                                    .rows.filter((item) => !item.original.children)
                                    .map((item) => item.id),
                                );
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
                          onClick={(event) => {
                            event.currentTarget.focus();
                            choose(item.id, event);
                          }}
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
                              onClick={(event) => {
                                event.currentTarget.focus();
                                choose(item.id, event);
                              }}
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
                            onClick={(event) => {
                              event.currentTarget.focus();
                              choose(item.id, event);
                            }}
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
      <FinderStatusBar
        style={{ height: 'auto', minHeight: 30, flexWrap: 'wrap', gap: 8, padding: '8px 12px' }}
      >
        <output aria-label="Workspace selection">
          {chosen.length} of {visible.length} selected
          {chosen.some((item) => item.readOnly) ? ' · Read only' : ''}
        </output>
        <span
          role="status"
          aria-live="polite"
          aria-label="Workspace activity"
          style={{ flex: 1, minWidth: 0, textAlign: 'left', overflowWrap: 'anywhere' }}
        >
          {result}
        </span>
        <output aria-label="Document count">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </output>
      </FinderStatusBar>
    </FinderWindow>
  );
}
