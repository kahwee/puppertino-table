import type { Meta, StoryObj } from '@storybook/react-vite';
import type { RowSelectionState } from '@tanstack/react-table';
import type { DragEvent, MouseEvent } from 'react';
import { useReducer, useRef, useState } from 'react';
import {
  FileArtwork,
  FilePreview,
  type FinderView,
  Glyph,
  ViewGlyph,
} from '../demo/finder-artwork.js';
import { type FileItem, finderFilesReducer, initialFinderFiles } from '../demo/finder-files.js';
import {
  applySelectionGesture,
  ColumnBrowser,
  ColumnBrowserItem,
  ContextMenu,
  createPuppertinoColumnHelper,
  DensityScope,
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
  initialDark = false,
  initialDensity = 'compact',
  initialPreview = true,
  selectable = true,
  resizable = true,
  disabled = false,
  manualSorting = false,
}: {
  initialView?: FinderView;
  initialDark?: boolean;
  initialDensity?: 'compact' | 'comfortable';
  initialPreview?: boolean;
  selectable?: boolean;
  resizable?: boolean;
  disabled?: boolean;
  manualSorting?: boolean;
}) {
  const [fileState, dispatchFiles] = useReducer(finderFilesReducer, initialFinderFiles);
  const { files, trash, lastDeletedIds } = fileState;
  const [selection, setSelection] = useState<RowSelectionState>({});
  const selectionAnchor = useRef<string | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const selectionSummary = useRef<HTMLOutputElement>(null);
  const [folder, setFolder] = useState('Projects');
  const [view, setView] = useState(initialView);
  const [dark, setDark] = useState(initialDark);
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
  const inTrash = folder === 'Trash';
  const folderFiles = inTrash ? trash : files.filter((file) => file.folder === folder);
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
  const deleteFiles = (targets: FileItem[]) => {
    if (!canAct || inTrash || !targets.length) return;
    dispatchFiles({ type: 'delete', ids: targets.map((file) => file.id) });
    finishAction(`Moved ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to Trash.`);
    requestAnimationFrame(() => undoButton.current?.focus());
  };
  const restoreFiles = (targets: FileItem[]) => {
    if (!canAct || !targets.length) return;
    dispatchFiles({ type: 'restore', ids: targets.map((file) => file.id) });
    finishAction(
      `Restored ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to their original folders.`,
    );
    requestAnimationFrame(() => selectionSummary.current?.focus());
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
  const folderButton = (name: string) => (
    <ColumnBrowserItem
      key={name}
      icon={name === 'Trash' ? <ViewGlyph view="trash" /> : <Glyph folder />}
      pathSelected={folder === name}
      trailing={
        <span aria-hidden="true">
          {name === 'Trash' ? trash.length : files.filter((file) => file.folder === name).length}
        </span>
      }
      onClick={() => navigate(name)}
      {...dropProps(name)}
      className={over === name ? 'finder-demo-drop' : ''}
    >
      {name}
    </ColumnBrowserItem>
  );
  return (
    <main className={`finder-demo-stage ${dark ? 'p-dark-mode' : ''}`}>
      <section className="finder-demo-window" aria-label="Finder-style demo">
        <header className="finder-demo-toolbar">
          <div className="finder-demo-titlebar">
            <span className="finder-demo-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="finder-demo-toolbar-content">
            <div className="finder-demo-history">
              <button
                type="button"
                aria-label="Back"
                title="Back"
                disabled={history.index === 0}
                onClick={() => travel(-1)}
              >
                <ViewGlyph view="back" />
              </button>
              <button
                type="button"
                aria-label="Forward"
                title="Forward"
                disabled={history.index === history.folders.length - 1}
                onClick={() => travel(1)}
              >
                <ViewGlyph view="forward" />
              </button>
            </div>
            <div className="finder-demo-title">
              <h1>{folder}</h1>
            </div>
            <fieldset className="finder-demo-views" aria-label="View">
              {(['icons', 'list', 'columns', 'gallery'] as const).map((next) => (
                <button
                  key={next}
                  type="button"
                  aria-label={next === 'icons' ? 'Icons' : next[0].toUpperCase() + next.slice(1)}
                  title={
                    next === 'icons' ? 'Icon view' : `${next[0].toUpperCase() + next.slice(1)} view`
                  }
                  aria-pressed={view === next}
                  onClick={() => {
                    setView(next);
                    if ((next === 'columns' || next === 'gallery') && !detail)
                      setDetail(visible[0]?.id ?? null);
                  }}
                >
                  <ViewGlyph view={next} />
                </button>
              ))}
            </fieldset>
            <label className="finder-demo-search">
              <ViewGlyph view="search" />
              <input
                type="search"
                aria-label="Search files"
                placeholder="Search"
                value={query}
                onChange={(event) => {
                  clearSelection();
                  setDetail(null);
                  setInfoOpen(false);
                  setQuery(event.target.value);
                }}
              />
            </label>
          </div>
        </header>
        <fieldset className="finder-demo-actions" aria-label="File selection actions">
          <output ref={selectionSummary} tabIndex={-1} aria-label="Selection summary">
            <strong>
              {selectedFiles.length
                ? `${selectedFiles.length} selected`
                : `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`}
            </strong>
            <span>
              {inTrash
                ? 'Restore files to their original folders'
                : selectedFiles.length
                  ? 'Move the selection or send it to Trash'
                  : 'Select files to organize your workspace'}
            </span>
          </output>
          <div className="finder-demo-action-buttons">
            {view !== 'list' && (
              <button
                type="button"
                disabled={!canAct || !visible.length}
                onClick={() => {
                  setSelection(Object.fromEntries(visible.map((file) => [file.id, true])));
                  selectionAnchor.current = null;
                }}
              >
                Select all
              </button>
            )}
            <button type="button" disabled={!selectedFiles.length} onClick={clearSelection}>
              Clear selection
            </button>
            {inTrash ? (
              <button
                type="button"
                disabled={!canAct || !selectedFiles.length}
                onClick={() => restoreFiles(selectedFiles)}
              >
                <ViewGlyph view="restore" />
                Restore selected
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!canAct || !selectedFiles.length}
                  onClick={() =>
                    moveFiles(selectedFiles, folder === 'Archive' ? 'Projects' : 'Archive')
                  }
                >
                  <Glyph folder />
                  Move to {folder === 'Archive' ? 'Projects' : 'Archive'}
                </button>
                <button
                  type="button"
                  className="finder-demo-delete"
                  disabled={!canAct || !selectedFiles.length}
                  onClick={() => deleteFiles(selectedFiles)}
                >
                  <ViewGlyph view="trash" />
                  Move to Trash
                </button>
              </>
            )}
          </div>
        </fieldset>
        <DensityScope density={density} className="finder-demo-workspace">
          <nav className="finder-demo-sidebar" aria-label="Favorites">
            <h2>Favorites</h2>
            {['Projects', 'Archive', 'Trash'].map(folderButton)}
            <h2>Locations</h2>
            <p>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M3 4h18v13H3ZM8 21h8M12 17v4" />
              </svg>
              Design studio
            </p>
            <h2>Tags</h2>
            <p>
              <span className="finder-demo-tag" />
              Project Alpine
            </p>
            <span className="finder-demo-sidebar-note">Fictional workspace</span>
          </nav>
          <div className="finder-demo-content">
            {view === 'list' ? (
              <PuppertinoTable
                key={revision}
                data={visible}
                columns={columns}
                getRowId={(file) => file.id}
                getRowLabel={(file) => file.name}
                ariaLabel="Project files"
                rowSelection={selection}
                onRowSelectionChange={setSelection}
                selectable={selectable}
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
                    label: folder,
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
              <section className="finder-demo-icon-grid" aria-label="Project file icons">
                {visible.map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    aria-pressed={!!selection[file.id]}
                    disabled={disabled}
                    className="finder-demo-icon-item"
                    {...menu.getTriggerProps(file.id)}
                    {...dragProps(file)}
                    onClick={(event) => selectFile(file.id, event)}
                  >
                    <FileArtwork file={file} />
                    <span>{file.name}</span>
                    <small>{file.kind}</small>
                  </button>
                ))}
                {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
              </section>
            ) : (
              <section className="finder-demo-gallery" aria-label="Project file gallery">
                <FilePreview file={active ?? visible[0]} />
                <section className="finder-demo-filmstrip" aria-label="Gallery files">
                  {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
                  {visible.map((file) => (
                    <button
                      type="button"
                      key={file.id}
                      aria-label={file.name}
                      disabled={disabled}
                      aria-pressed={!!selection[file.id]}
                      {...menu.getTriggerProps(file.id)}
                      {...dragProps(file)}
                      onClick={(event) => selectFile(file.id, event)}
                    >
                      <FileArtwork file={file} />
                    </button>
                  ))}
                </section>
              </section>
            )}
          </div>
          {active && infoOpen && (
            <aside className="finder-demo-details" aria-label="File details">
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
            </aside>
          )}
        </DensityScope>
        <nav className="finder-demo-path" aria-label="Current location">
          <Glyph folder />
          <span>Design studio</span>
          <span aria-hidden="true">›</span>
          <span>Workspace</span>
          <span aria-hidden="true">›</span>
          <strong>{folder}</strong>
          {active && (
            <>
              <span aria-hidden="true">›</span>
              <span className="finder-demo-path-file">{active.name}</span>
            </>
          )}
        </nav>
        <footer className="finder-demo-status">
          <span role="status">{message}</span>
          {lastDeletedIds.length > 0 && (
            <button
              ref={undoButton}
              type="button"
              disabled={disabled}
              onClick={() => {
                dispatchFiles({ type: 'undo' });
                finishAction('Deletion undone. Files restored to their original folders.');
                requestAnimationFrame(() => selectionSummary.current?.focus());
              }}
            >
              Undo delete
            </button>
          )}
          <span className="finder-demo-selection-hint">
            ⌘/Ctrl-click to add · Shift-click for a range
          </span>
        </footer>
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
                    icon: <Glyph />,
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
                              ? `Restore ${contextTargets.length} files`
                              : 'Restore file',
                          disabled: !canAct,
                          onSelect: () => restoreFiles(contextTargets),
                        },
                      ]
                    : [
                        {
                          id: 'move',
                          label: `Move to ${context.folder === 'Archive' ? 'Projects' : 'Archive'}`,
                          icon: <Glyph folder />,
                          disabled: !canAct,
                          onSelect: () =>
                            moveFiles(
                              contextTargets,
                              context.folder === 'Archive' ? 'Projects' : 'Archive',
                            ),
                        },
                        {
                          id: 'delete',
                          label:
                            contextTargets.length > 1
                              ? `Move ${contextTargets.length} files to Trash`
                              : 'Move to Trash',
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
      </section>
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
          aria-label={`Toggle ${dark ? 'light' : 'dark'} theme`}
          onClick={() => setDark(!dark)}
        >
          {dark ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          onClick={() => {
            menu.close();
            dispatchFiles({ type: 'reset' });
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
    initialDark: false,
    initialDensity: 'compact',
    initialPreview: true,
    selectable: true,
    resizable: true,
    disabled: false,
    manualSorting: false,
  },
  render: (args) => (
    <FinderDemo
      key={`${args.initialView}-${args.initialDark}-${args.initialDensity}-${args.initialPreview}`}
      {...args}
    />
  ),
  argTypes: {
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
    initialDark: {
      name: 'Start in dark mode',
      control: 'boolean',
      table: { category: 'Workspace setup' },
      description: 'Start with the Puppertino dark theme. Changing this restarts the workspace.',
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
      description: 'Show row checkboxes. Updates without resetting the workspace.',
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
  </DensityScope>;
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
  args: { initialDark: true },
  parameters: {
    docs: {
      description: {
        story:
          'The same semantic table using Puppertino dark tokens. Use the density selector and Light button to compare geometry and contrast.',
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
  args: { initialView: 'columns', initialDark: true },
  parameters: { docs: { source: ColumnWorkspace.parameters?.docs?.source } },
};
export const NarrowColumns: Story = {
  args: { initialView: 'columns', initialPreview: false },
  render: (args) => (
    <div className="finder-demo-frame">
      <FinderDemo
        key={`${args.initialView}-${args.initialDark}-${args.initialDensity}-${args.initialPreview}`}
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
