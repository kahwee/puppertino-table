import type { Meta, StoryObj } from '@storybook/react-vite';
import type { RowSelectionState } from '@tanstack/react-table';
import type { DragEvent, MouseEvent } from 'react';
import { useReducer, useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { FileArtwork, FilePreview, Glyph, ViewGlyph } from '../demo/finder-artwork.js';
import { DemoToolbar } from '../demo/finder-chrome.js';
import { type FileItem, finderFilesReducer, initialFinderFiles } from '../demo/finder-files.js';
import { FinderTags } from '../demo/finder-tags.js';
import {
  applySelectionGesture,
  ColumnBrowser,
  ColumnBrowserItem,
  ContextMenu,
  createPuppertinoColumnHelper,
  FinderBody,
  FinderContent,
  FinderDetails,
  FinderFilmstrip,
  FinderGallery,
  FinderGalleryItem,
  FinderIconGrid,
  FinderIconItem,
  FinderPathBar,
  FinderSidebar,
  FinderSidebarGroup,
  FinderSidebarItem,
  FinderStatusBar,
  type FinderView,
  FinderWindow,
  PuppertinoTable,
  type TableDensity,
  useContextMenu,
} from './index.js';
import './finder-demo.css';

const helper = createPuppertinoColumnHelper<FileItem>();
const columns = helper.columns([
  helper.accessor('name', {
    header: 'Name',
    size: 300,
    minSize: 200,
    maxSize: 440,
    cell: (cell) => (
      <span className="finder-demo-filename">
        <span className="pt-icon">
          <Glyph kind={cell.row.original.kind} />
        </span>
        {cell.getValue()}
      </span>
    ),
  }),
  helper.accessor('modified', { header: 'Date modified', size: 170, minSize: 140 }),
  helper.accessor('size', { header: 'Size', size: 90, minSize: 70 }),
  helper.accessor('kind', { header: 'Kind', size: 160, minSize: 120 }),
]);

function FinderDemo({
  initialView = 'list',
  initialDensity = 'compact',
  initialPreview = true,
  selectable = true,
  selectionCheckboxes = false,
  resizable = true,
  disabled = false,
  manualSorting = false,
}: {
  initialView?: FinderView;
  initialDensity?: 'compact' | 'comfortable';
  initialPreview?: boolean;
  selectable?: boolean;
  selectionCheckboxes?: boolean;
  resizable?: boolean;
  disabled?: boolean;
  manualSorting?: boolean;
}) {
  const [fileState, dispatchFiles] = useReducer(finderFilesReducer, initialFinderFiles);
  const { files, trash, lastDeletedIds } = fileState;
  const [selection, setSelection] = useState<RowSelectionState>({});
  const selectionAnchor = useRef<string | null>(null);
  const selectionSummary = useRef<HTMLOutputElement>(null);
  const [tagNames, setTagNames] = useState(['Project Alpine', 'Work', 'Review']);
  const [folder, setFolder] = useState('Projects');
  const [view, setView] = useState(initialView);
  const [density, setDensity] = useState<TableDensity>(initialDensity);
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<string | null>(
    initialPreview && (initialView === 'columns' || initialView === 'gallery') ? 'brief' : null,
  );
  const [query, setQuery] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [history, setHistory] = useState({ folders: ['Projects'], index: 0 });
  const [dragging, setDragging] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState('All changes stay in this demo');
  const menu = useContextMenu<string>();
  const availableTags = tagNames;
  const activeTag = folder.startsWith('tag:') ? folder.slice(4) : null;
  const folderTitle = activeTag ?? folder;
  const inTrash = folder === 'Trash';
  const folderFiles = activeTag
    ? files.filter((file) => file.tags?.includes(activeTag))
    : inTrash
      ? trash
      : files.filter((file) => file.folder === folder);
  const visible = folderFiles.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selectedFiles = visible.filter((file) => selection[file.id]);
  const canAct = selectable && !disabled;
  const active = visible.find((file) => file.id === detail);
  const clearSelection = () => {
    setSelection({});
    selectionAnchor.current = null;
  };
  const selectFile = (
    id: string,
    event: Pick<MouseEvent, 'shiftKey' | 'metaKey' | 'ctrlKey'>,
    ids = visible.map((file) => file.id),
  ) => {
    if (disabled) return;
    setDetail(id);
    if (!selectable) return;
    const anchor = selectionAnchor.current;
    const modifiers = { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey };
    selectionAnchor.current = applySelectionGesture(ids, {}, anchor, id, modifiers).anchor;
    setSelection(
      (previous) => applySelectionGesture(ids, previous, anchor, id, modifiers).selection,
    );
  };
  const finishAction = (text: string) => {
    clearSelection();
    setDetail(null);
    setInfoOpen(false);
    setMessage(text);
  };
  const focusAfterMutation = () => {
    const previousFocus = document.activeElement;
    requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (
        focused === previousFocus ||
        focused === document.body ||
        focused?.getAttribute('aria-haspopup') === 'menu'
      )
        selectionSummary.current?.focus();
    });
  };
  const deleteFiles = (targets: FileItem[]) => {
    if (!canAct || inTrash || !targets.length) return;
    dispatchFiles({ type: 'delete', ids: targets.map((file) => file.id) });
    finishAction(`Moved ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to Trash.`);
    focusAfterMutation();
  };
  const restoreFiles = (targets: FileItem[]) => {
    if (!canAct || !targets.length) return;
    dispatchFiles({ type: 'restore', ids: targets.map((file) => file.id) });
    finishAction(
      `Restored ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to their original folders.`,
    );
    focusAfterMutation();
  };
  const moveFiles = (targets: FileItem[], target: 'Projects' | 'Archive') => {
    if (!canAct || inTrash || !targets.length) return;
    dispatchFiles({ type: 'move', ids: targets.map((file) => file.id), folder: target });
    finishAction(
      `Moved ${targets.length === 1 ? targets[0].name : `${targets.length} files`} to ${target}`,
    );
  };
  const emptyMessage = query
    ? `No files match “${query}”.`
    : activeTag
      ? `No files tagged “${activeTag}”.`
      : inTrash
        ? 'Trash is empty. Deleted files will appear here.'
        : folder === 'Archive'
          ? 'Archive is empty. Move files here from Projects.'
          : 'No files in Projects. Restore files from Trash or reset the demo.';
  const navigate = (name: string) => {
    if (name !== folder)
      setHistory((previous) => ({
        folders: [...previous.folders.slice(0, previous.index + 1), name],
        index: previous.index + 1,
      }));
    clearSelection();
    setFolder(name);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const travel = (delta: number) => {
    const index = history.index + delta;
    if (index < 0 || index >= history.folders.length) return;
    setHistory({ ...history, index });
    clearSelection();
    setFolder(history.folders[index]);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const context = visible.find((file) => file.id === menu.state?.context);
  const contextTargets = context ? (selection[context.id] ? selectedFiles : [context]) : [];
  const dragProps = (file: FileItem) => ({
    draggable: canAct && !inTrash,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (!canAct || inTrash) {
        event.preventDefault();
        return;
      }
      const targets = selection[file.id] ? selectedFiles : [file];
      event.dataTransfer.setData('text/plain', file.id);
      event.dataTransfer.effectAllowed = 'move';
      setDragging(targets.map((item) => item.id));
      setMessage(
        `Dragging ${targets.length} ${targets.length === 1 ? 'file' : 'files'} — drop on a folder or Trash`,
      );
    },
    onDragEnd: () => {
      setDragging([]);
      setOver(null);
    },
  });
  const dropProps = (target: string) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!canAct || !dragging.length) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setOver(target);
    },
    onDragLeave: () => setOver(null),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain');
      if (!canAct || !dragging.includes(id)) return;
      const targets = visible.filter((file) => dragging.includes(file.id));
      if (target === 'Trash') deleteFiles(targets);
      else if (target === 'Archive' || target === 'Projects') moveFiles(targets, target);
      setDragging([]);
      setOver(null);
    },
  });
  const selectAll = () => {
    if (!canAct) return;
    setSelection(Object.fromEntries(visible.map((file) => [file.id, true])));
    selectionAnchor.current = null;
  };
  const undoDelete = () => {
    if (disabled || !lastDeletedIds.length) return;
    dispatchFiles({ type: 'undo' });
    finishAction('Deletion undone. Files restored to their original folders.');
    focusAfterMutation();
  };
  const toolbarActions = [
    {
      id: 'select-all',
      label: 'Select All',
      shortcut: '⌘A',
      disabled: !canAct || !visible.length,
      onSelect: selectAll,
    },
    {
      id: 'clear',
      label: 'Deselect All',
      disabled: !selectedFiles.length,
      onSelect: clearSelection,
    },
    { id: 'selection-separator', type: 'separator' as const },
    ...(inTrash
      ? [
          {
            id: 'restore',
            label: 'Put Back',
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => restoreFiles(selectedFiles),
          },
        ]
      : [
          {
            id: 'move',
            label: `Move to ${folder === 'Archive' ? 'Projects' : 'Archive'}`,
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => moveFiles(selectedFiles, folder === 'Archive' ? 'Projects' : 'Archive'),
          },
          {
            id: 'trash',
            label: 'Move to Trash',
            icon: <ViewGlyph view="trash" />,
            shortcut: '⌘⌫',
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => deleteFiles(selectedFiles),
          },
        ]),
    { id: 'undo-separator', type: 'separator' as const },
    {
      id: 'undo',
      label: 'Undo Move to Trash',
      shortcut: '⌘Z',
      disabled: disabled || !lastDeletedIds.length,
      onSelect: undoDelete,
    },
  ];
  const folderButton = (name: string) => (
    <FinderSidebarItem
      key={name}
      data-folder={name}
      className={over === name ? 'finder-demo-drop' : ''}
      selected={folder === name}
      iconTone={name === 'Trash' ? 'secondary' : 'accent'}
      icon={
        <ViewGlyph view={name === 'Trash' ? 'trash' : name === 'Archive' ? 'archive' : 'folder'} />
      }
      onClick={() => navigate(name)}
      {...dropProps(name)}
    >
      {name}
    </FinderSidebarItem>
  );
  return (
    <main className="finder-demo-stage">
      <FinderWindow
        aria-label="Finder-style demo"
        onKeyDown={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest('input,textarea,select,[role="menu"]')
          )
            return;
          if (!(event.metaKey || event.ctrlKey)) return;
          if (event.key.toLowerCase() === 'a') {
            event.preventDefault();
            selectAll();
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            deleteFiles(selectedFiles);
          }
          if (event.key.toLowerCase() === 'z') {
            event.preventDefault();
            undoDelete();
          }
        }}
      >
        <DemoToolbar
          folder={folderTitle}
          tags={
            <FinderTags
              files={selectedFiles}
              available={availableTags}
              disabled={!canAct}
              onTag={(tag, remove) => {
                if (!canAct) return;
                if (!remove)
                  setTagNames((previous) =>
                    previous.includes(tag) ? previous : [...previous, tag],
                  );
                dispatchFiles({
                  type: 'tag',
                  ids: selectedFiles.map((file) => file.id),
                  tag,
                  remove,
                });
                setMessage(`${remove ? 'Removed' : 'Assigned'} tag ${tag}.`);
              }}
            />
          }
          view={view}
          canBack={history.index > 0}
          canForward={history.index < history.folders.length - 1}
          onTravel={travel}
          onView={(next) => {
            setView(next);
            if ((next === 'columns' || next === 'gallery') && !detail)
              setDetail(visible[0]?.id ?? null);
          }}
          query={query}
          onQuery={(value) => {
            clearSelection();
            setDetail(null);
            setInfoOpen(false);
            setQuery(value);
          }}
          actions={toolbarActions}
          canPreview={!disabled && selectedFiles.length === 1}
          onPreview={() => {
            setDetail(selectedFiles[0].id);
            setInfoOpen(true);
          }}
        />
        <FinderBody density={density}>
          <FinderSidebar aria-label="Favorites">
            <FinderSidebarGroup label="Favorites">
              {['Projects', 'Archive'].map(folderButton)}
            </FinderSidebarGroup>
            <FinderSidebarGroup label="Locations">
              <div className="p-sidebar-row">
                <span className="p-sidebar-icon finder-demo-location">
                  <ViewGlyph view="desktop" />
                </span>
                Design studio
              </div>
              {folderButton('Trash')}
            </FinderSidebarGroup>
            <FinderSidebarGroup label="Tags">
              {availableTags.map((tag) => (
                <FinderSidebarItem
                  key={tag}
                  selected={activeTag === tag}
                  icon={<ViewGlyph view="tag" />}
                  iconTone="secondary"
                  onClick={() => navigate(`tag:${tag}`)}
                >
                  {tag}
                </FinderSidebarItem>
              ))}
            </FinderSidebarGroup>
          </FinderSidebar>
          <FinderContent>
            {view === 'list' ? (
              <PuppertinoTable
                key={revision}
                data={visible}
                columns={columns}
                getRowId={(file) => file.id}
                getRowLabel={(file) => file.name}
                ariaLabel="Project files"
                selectionAnchor={selectionAnchor}
                rowSelection={selection}
                onRowSelectionChange={setSelection}
                selectable={selectable}
                selectionCheckboxes={selectionCheckboxes}
                resizable={resizable}
                disabled={disabled}
                manualSorting={manualSorting}
                getRowProps={(row) => ({
                  tabIndex: 0,
                  ...menu.getTriggerProps(row.id),
                  ...dragProps(row.original),
                  onClick: (event) =>
                    selectFile(
                      row.id,
                      event,
                      row.table.getRowModel().rows.map((item) => item.id),
                    ),
                  onKeyDown: (event) => {
                    menu.getTriggerProps(row.id).onKeyDown(event);
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      selectFile(
                        row.id,
                        event,
                        row.table.getRowModel().rows.map((item) => item.id),
                      );
                    }
                  },
                })}
                emptyContent={emptyMessage}
              />
            ) : view === 'columns' ? (
              <ColumnBrowser
                key={revision}
                ariaLabel="Workspace columns"
                panels={[
                  {
                    id: 'workspace',
                    label: 'Workspace',
                    width: 170,
                    content: (
                      <>
                        {folderButton('Projects')}
                        {folderButton('Archive')}
                        {folderButton('Trash')}
                      </>
                    ),
                  },
                  {
                    id: 'files',
                    label: folderTitle,
                    width: 280,
                    content: visible.length ? (
                      visible.map((file) => (
                        <ColumnBrowserItem
                          disabled={disabled}
                          key={file.id}
                          selected={!!selection[file.id]}
                          icon={<Glyph kind={file.kind} />}
                          {...menu.getTriggerProps(file.id)}
                          {...dragProps(file)}
                          onClick={(event) => selectFile(file.id, event)}
                        >
                          {file.name}
                        </ColumnBrowserItem>
                      ))
                    ) : (
                      <p className="finder-demo-no-results">{emptyMessage}</p>
                    ),
                  },
                  ...(active
                    ? [
                        {
                          id: 'preview',
                          label: 'Preview',
                          content: <FilePreview file={active} />,
                        },
                      ]
                    : []),
                ]}
              />
            ) : view === 'icons' ? (
              <FinderIconGrid aria-label="Project file icons">
                {visible.map((file) => (
                  <FinderIconItem
                    key={file.id}
                    selected={!!selection[file.id]}
                    disabled={disabled}
                    artwork={<FileArtwork file={file} />}
                    description={file.kind}
                    {...menu.getTriggerProps(file.id)}
                    {...dragProps(file)}
                    onClick={(event) => selectFile(file.id, event)}
                  >
                    {file.name}
                  </FinderIconItem>
                ))}
                {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
              </FinderIconGrid>
            ) : (
              <FinderGallery aria-label="Project file gallery">
                <FilePreview file={active ?? visible[0]} />
                <FinderFilmstrip aria-label="Gallery files">
                  {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
                  {visible.map((file) => (
                    <FinderGalleryItem
                      key={file.id}
                      aria-label={file.name}
                      disabled={disabled}
                      selected={!!selection[file.id]}
                      {...menu.getTriggerProps(file.id)}
                      {...dragProps(file)}
                      onClick={(event) => selectFile(file.id, event)}
                    >
                      <FileArtwork file={file} />
                    </FinderGalleryItem>
                  ))}
                </FinderFilmstrip>
              </FinderGallery>
            )}
          </FinderContent>
          {active && infoOpen && (
            <FinderDetails aria-label="File details">
              <span className="finder-demo-detail-icon">
                <Glyph kind={active.kind} />
              </span>
              <h2>{active.name}</h2>
              <p>{active.kind}</p>
              <dl>
                <dt>Size</dt>
                <dd>{active.size}</dd>
                <dt>Modified</dt>
                <dd>{active.modified}</dd>
                <dt>{inTrash ? 'Original folder' : 'Folder'}</dt>
                <dd>{active.folder}</dd>
              </dl>
              <button type="button" onClick={() => setInfoOpen(false)}>
                Close details
              </button>
            </FinderDetails>
          )}
        </FinderBody>
        <FinderPathBar>
          <Glyph folder />
          <span>Design studio</span>
          <span aria-hidden="true">›</span>
          <span>Workspace</span>
          <span aria-hidden="true">›</span>
          <strong>{folderTitle}</strong>
          {active && (
            <>
              <span aria-hidden="true">›</span>
              <span>{active.name}</span>
            </>
          )}
        </FinderPathBar>
        <FinderStatusBar>
          <output ref={selectionSummary} tabIndex={-1} aria-label="Selection summary">
            {selectedFiles.length
              ? `${selectedFiles.length} of ${visible.length} selected`
              : `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`}
          </output>
        </FinderStatusBar>
        <span className="pt-sr-only" role="status">
          {message}
        </span>
        <ContextMenu
          ariaLabel="File actions"
          position={menu.state?.position ?? null}
          returnFocus={menu.state?.returnFocus}
          onClose={menu.close}
          actions={
            context
              ? [
                  {
                    id: 'info',
                    label: 'Get Info',
                    icon: <ViewGlyph view="info" />,
                    shortcut: '⌘I',
                    onSelect: () => {
                      setDetail(context.id);
                      setInfoOpen(true);
                    },
                  },
                  { id: 'separator', type: 'separator' },
                  ...(inTrash
                    ? [
                        {
                          id: 'restore',
                          label:
                            contextTargets.length > 1
                              ? `Put Back ${contextTargets.length} Items`
                              : 'Put Back',
                          disabled: !canAct,
                          onSelect: () => restoreFiles(contextTargets),
                        },
                      ]
                    : [
                        {
                          id: 'move',
                          label: `Move to ${context.folder === 'Archive' ? 'Projects' : 'Archive'}`,
                          disabled: !canAct,
                          onSelect: () =>
                            moveFiles(
                              contextTargets,
                              context.folder === 'Archive' ? 'Projects' : 'Archive',
                            ),
                        },
                        {
                          id: 'delete',
                          label: 'Move to Trash',
                          icon: <ViewGlyph view="trash" />,
                          disabled: !canAct,
                          onSelect: () => deleteFiles(contextTargets),
                        },
                      ]),
                  {
                    id: 'download',
                    label: 'Download sample',
                    href: 'data:text/plain,Fictional%20project%20brief',
                    download: 'sample.txt',
                  },
                  { id: 'rename', label: 'Rename', disabled: true, onSelect: () => {} },
                ]
              : []
          }
        />
      </FinderWindow>
      <fieldset className="finder-demo-controls" aria-label="Demo settings">
        <span>Try the shared components</span>
        <label>
          Density{' '}
          <select
            aria-label="Row density"
            value={density}
            onChange={(event) => setDensity(event.target.value as TableDensity)}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            menu.close();
            dispatchFiles({ type: 'reset' });
            setTagNames(['Project Alpine', 'Work', 'Review']);
            clearSelection();
            setInfoOpen(false);
            setFolder('Projects');
            setDetail(view === 'columns' || view === 'gallery' ? 'brief' : null);
            setDragging([]);
            setOver(null);
            setQuery('');
            setHistory({ folders: ['Projects'], index: 0 });
            setMessage('All changes stay in this demo');
            setRevision((value) => value + 1);
          }}
        >
          Reset demo
        </button>
      </fieldset>
    </main>
  );
}

const meta = {
  title: 'Examples/Finder',
  component: FinderDemo,
  tags: ['!autodocs'],
  args: {
    initialView: 'list',
    initialDensity: 'compact',
    initialPreview: true,
    selectable: true,
    selectionCheckboxes: false,
    resizable: true,
    disabled: false,
    manualSorting: false,
  },
  render: (args) => (
    <FinderDemo
      key={`${args.initialView}-${args.initialDensity}-${args.initialPreview}`}
      {...args}
    />
  ),
  argTypes: {
    selectionCheckboxes: {
      control: 'boolean',
      description: 'Show optional table checkboxes. Finder uses row selection by default.',
      if: { arg: 'initialView', eq: 'list' },
    },
    initialView: {
      name: 'Starting view',
      table: { category: 'Workspace setup' },
      control: 'inline-radio',
      options: ['icons', 'list', 'columns', 'gallery'],
      description: 'Starting view. Changing a starting control restarts the fictional workspace.',
    },
    initialPreview: {
      name: 'Select first preview',
      table: { category: 'Workspace setup' },
      if: { arg: 'initialView', eq: 'columns' },
      control: 'boolean',
      description:
        'Start column view with the first file preview selected. Gallery always shows a preview.',
    },
    initialDensity: {
      name: 'Starting density',
      table: { category: 'Workspace setup' },
      control: 'inline-radio',
      options: ['compact', 'comfortable'],
      description:
        'Starting CSS density. The in-app selector changes density without resetting files.',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable file selection and commands. Updates without resetting the workspace.',
      if: { arg: 'initialView', eq: 'list' },
      table: { category: 'Table behavior' },
    },
    resizable: {
      control: 'boolean',
      description: 'Enable pointer and keyboard column resizing.',
      if: { arg: 'initialView', eq: 'list' },
      table: { category: 'Table behavior' },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable table sorting, selection and resizing.',
      if: { arg: 'initialView', eq: 'list' },
      table: { category: 'Table behavior' },
    },
    manualSorting: {
      control: 'boolean',
      description: 'Keep app-owned row order when sorting changes; disable for local sorting.',
      if: { arg: 'initialView', eq: 'list' },
      table: { category: 'Table behavior' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: {
        language: 'tsx',
        type: 'code',
        code: `import { PuppertinoTable, createPuppertinoColumnHelper } from 'puppertino-table';

type FileItem = { id: string; name: string; kind: string };
const helper = createPuppertinoColumnHelper<FileItem>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 280, minSize: 160 }),
  helper.accessor('kind', { header: 'Kind', size: 160 }),
]);
const files: FileItem[] = [{ id: 'brief', name: 'Project brief.pdf', kind: 'PDF' }];

export function FileTable() {
  return <PuppertinoTable data={files} columns={columns}
    getRowId={file => file.id} getRowLabel={file => file.name}
    ariaLabel="Files" selectable density="compact" manualSorting={false} />;
}`,
      },
      description: {
        component:
          'Fictional Finder-style workspace with shared selection across four views, bulk moves, Trash, restore and undo. File operations and native HTML drag/drop are owned by this example. The Move menu command is the keyboard alternative. No filesystem access.',
      },
    },
  },
} satisfies Meta<typeof FinderDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FileTable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sort Name, check rows (Shift-click for ranges), drag a header divider, or right-click a file. Drag a row to Archive; Reset demo restores files, selection and widths.',
      },
    },
  },
};
export const CheckboxSelection: Story = {
  args: { selectionCheckboxes: true },
  parameters: {
    docs: {
      description: {
        story:
          'Optional library checkbox controls, including visible-row select-all. Native Finder-style stories use row selection.',
      },
    },
  },
};
export const ColumnWorkspace: Story = {
  args: { initialView: 'columns' },
  parameters: {
    docs: {
      source: {
        language: 'tsx',
        type: 'code',
        code: `import { ColumnBrowser, ColumnBrowserItem, DensityScope } from 'puppertino-table';

export function Workspace() {
  return <DensityScope density="compact" style={{ height: 390 }}>
    <ColumnBrowser ariaLabel="Workspace" panels={[
      { id: 'folders', label: 'Folders', content: <ColumnBrowserItem href="#projects" pathSelected>Projects</ColumnBrowserItem> },
      { id: 'files', label: 'Files', content: <ColumnBrowserItem href="#brief">Project brief.pdf</ColumnBrowserItem> },
      { id: 'preview', label: 'Preview', content: <p>Your app-owned preview</p> },
    ]} />
  </FinderBody>;
}`,
      },
      description: {
        story:
          'Click a file for the app-owned preview. Resize either ancestor divider; each panel keeps its own width. Right-click items for the same menu as the table.',
      },
    },
  },
};
export const DarkTable: Story = {
  globals: { theme: 'dark' },
  parameters: {
    docs: {
      description: {
        story:
          'The same semantic table using Puppertino dark tokens. This story pins the dark theme. Use the Theme toolbar in File table to compare light and dark without resetting the workspace.',
      },
    },
  },
};
export const ComfortableTable: Story = {
  args: { initialDensity: 'comfortable' },
  parameters: {
    docs: {
      source: {
        code: meta.parameters.docs.source.code.replace(
          'density="compact"',
          'density="comfortable"',
        ),
      },
    },
  },
};

export const IconWorkspace: Story = {
  args: { initialView: 'icons' },
  parameters: {
    docs: {
      source: {
        language: 'tsx',
        type: 'code',
        code: `// Your app owns the icon grid and selected item.
const menu = useContextMenu<string>();
<div className="my-icon-grid">{files.map(file => <button key={file.id}
  type="button" aria-pressed={selectedId === file.id}
  onClick={() => setSelectedId(file.id)} {...menu.getTriggerProps(file.id)}>
  <FileArtwork file={file} /><span>{file.name}</span>
</button>)}</div>;`,
      },
      description: {
        story:
          'App-owned icon layout using the same items, commands, search and drag/drop. File previews and layout belong to the application.',
      },
    },
  },
};
export const GalleryWorkspace: Story = {
  args: { initialView: 'gallery' },
  parameters: {
    docs: {
      source: {
        language: 'tsx',
        type: 'code',
        code: `// Your app renders the preview and filmstrip.
<>
<Preview file={files.find(file => file.id === selectedId)} />
<section aria-label="Gallery files">{files.map(file => <button key={file.id}
  type="button" aria-label={file.name} aria-pressed={selectedId === file.id}
  onClick={() => setSelectedId(file.id)} {...menu.getTriggerProps(file.id)}>
  <FileArtwork file={file} />
</button>)}</section>
</>;`,
      },
      description: {
        story:
          'A large app-owned preview and keyboard-focusable filmstrip. Select a thumbnail or right-click it for shared commands.',
      },
    },
  },
};
export const DarkColumns: Story = {
  args: { initialView: 'columns' },
  globals: { theme: 'dark' },
  parameters: { docs: { source: ColumnWorkspace.parameters?.docs?.source } },
};
export const NarrowColumns: Story = {
  args: { initialView: 'columns', initialPreview: false },
  render: (args) => (
    <div className="finder-demo-frame">
      <FinderDemo
        key={`${args.initialView}-${args.initialDensity}-${args.initialPreview}`}
        {...args}
      />
    </div>
  ),
  parameters: {
    docs: {
      source: ColumnWorkspace.parameters?.docs?.source,
      description: {
        story:
          'Start with the file column; click a file to reveal its preview. Narrow windows keep ancestor columns accessible by horizontal scrolling. Use the canvas resize control to compare smaller widths.',
      },
    },
  },
};

export const Tags: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Select a file and assign tags from the toolbar. Assigned tags become gray tokens; sidebar tags filter the workspace.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /Project brief.pdf/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    const popover = within(canvas.getByRole('dialog', { name: 'Assign tags' }));
    await userEvent.click(popover.getByRole('option', { name: 'Review' }));
    await expect(popover.getByRole('button', { name: 'Remove tag Review' })).toBeVisible();
    await expect(popover.queryByRole('option', { name: 'Review' })).toBeNull();
  },
};
