import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DragEvent } from 'react';
import { useState } from 'react';
import {
  FileArtwork,
  FilePreview,
  type FinderView,
  Glyph,
  ViewGlyph,
} from '../demo/finder-artwork.js';
import {
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

const initialFiles = [
  {
    id: 'brief',
    name: 'Project brief.pdf',
    kind: 'PDF document',
    size: '248 KB',
    modified: 'Today, 10:42',
    folder: 'Projects',
  },
  {
    id: 'research',
    name: 'Research notes.txt',
    kind: 'Text document',
    size: '18 KB',
    modified: 'Today, 09:15',
    folder: 'Projects',
  },
  {
    id: 'budget',
    name: 'Budget.xlsx',
    kind: 'Spreadsheet',
    size: '96 KB',
    modified: 'Yesterday',
    folder: 'Projects',
  },
  {
    id: 'cover',
    name: 'Cover artwork.png',
    kind: 'PNG image',
    size: '1.2 MB',
    modified: 'Yesterday',
    folder: 'Projects',
  },
  {
    id: 'meeting',
    name: 'Meeting notes.txt',
    kind: 'Text document',
    size: '12 KB',
    modified: 'Oct 10, 2026',
    folder: 'Projects',
  },
  {
    id: 'timeline',
    name: 'Launch timeline.pdf',
    kind: 'PDF document',
    size: '384 KB',
    modified: 'Oct 9, 2026',
    folder: 'Projects',
  },
];
type FileItem = (typeof initialFiles)[number];
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
}: {
  initialView?: FinderView;
  initialDark?: boolean;
  initialDensity?: 'compact' | 'comfortable';
  initialPreview?: boolean;
}) {
  const [files, setFiles] = useState(initialFiles);
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
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState('6 items · Fictional workspace');
  const menu = useContextMenu<string>();
  const visible = files.filter(
    (file) => file.folder === folder && file.name.toLowerCase().includes(query.toLowerCase()),
  );
  const active = visible.find((file) => file.id === detail);
  const navigate = (name: string) => {
    if (name !== folder)
      setHistory((previous) => ({
        folders: [...previous.folders.slice(0, previous.index + 1), name],
        index: previous.index + 1,
      }));
    setFolder(name);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const travel = (delta: number) => {
    const index = history.index + delta;
    if (index < 0 || index >= history.folders.length) return;
    setHistory({ ...history, index });
    setFolder(history.folders[index]);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const context = files.find((file) => file.id === menu.state?.context);
  const dragProps = (file: FileItem) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.setData('text/plain', file.id);
      event.dataTransfer.effectAllowed = 'move';
      setDragging(file.id);
      setMessage(`Dragging ${file.name} — drop on Archive`);
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
  });
  const dropProps = (target: string) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setOver(target);
    },
    onDragLeave: () => setOver(null),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain');
      const file = files.find((item) => item.id === id);
      if (!file || id !== dragging) return;
      setFiles((previous) =>
        previous.map((item) => (item.id === id ? { ...item, folder: target } : item)),
      );
      setMessage(`Moved ${file.name} to ${target}`);
      setDragging(null);
      setOver(null);
    },
  });
  const folderButton = (name: string) => (
    <ColumnBrowserItem
      key={name}
      icon={<Glyph folder />}
      pathSelected={folder === name}
      trailing="›"
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
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
        </header>
        <DensityScope density={density} className="finder-demo-workspace">
          <nav className="finder-demo-sidebar" aria-label="Favorites">
            <h2>Favorites</h2>
            {['Projects', 'Archive'].map(folderButton)}
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
                selectable
                manualSorting={false}
                getRowProps={(row) => ({
                  tabIndex: 0,
                  ...menu.getTriggerProps(row.id),
                  ...dragProps(row.original),
                })}
                emptyContent={
                  query ? `No files match “${query}”.` : 'Drop a file here from Projects.'
                }
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
                      </>
                    ),
                  },
                  {
                    id: 'files',
                    label: folder,
                    width: 280,
                    content: visible.map((file) => (
                      <ColumnBrowserItem
                        key={file.id}
                        selected={detail === file.id}
                        icon={<Glyph kind={file.kind} />}
                        {...menu.getTriggerProps(file.id)}
                        {...dragProps(file)}
                        onClick={() => setDetail(file.id)}
                      >
                        {file.name}
                      </ColumnBrowserItem>
                    )),
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
                    aria-pressed={detail === file.id}
                    className="finder-demo-icon-item"
                    {...menu.getTriggerProps(file.id)}
                    {...dragProps(file)}
                    onClick={() => setDetail(file.id)}
                  >
                    <FileArtwork file={file} />
                    <span>{file.name}</span>
                    <small>{file.kind}</small>
                  </button>
                ))}
                {!visible.length && (
                  <p className="finder-demo-no-results">
                    {query ? `No files match “${query}”.` : 'No files in this folder.'}
                  </p>
                )}
              </section>
            ) : (
              <section className="finder-demo-gallery" aria-label="Project file gallery">
                <FilePreview file={active ?? visible[0]} />
                <section className="finder-demo-filmstrip" aria-label="Gallery files">
                  {visible.map((file) => (
                    <button
                      type="button"
                      key={file.id}
                      aria-label={file.name}
                      aria-pressed={(active ?? visible[0])?.id === file.id}
                      {...menu.getTriggerProps(file.id)}
                      {...dragProps(file)}
                      onClick={() => setDetail(file.id)}
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
                <dt>Folder</dt>
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
          <span role="status">
            {message.startsWith('6 items')
              ? `${visible.length} ${visible.length === 1 ? 'item' : 'items'} · Fictional workspace`
              : message}
          </span>
          <span>{query ? `Search in ${folder}` : 'All changes stay in this demo'}</span>
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
                  {
                    id: 'move',
                    label: `Move to ${context.folder === 'Archive' ? 'Projects' : 'Archive'}`,
                    icon: <Glyph folder />,
                    onSelect: () => {
                      const target = context.folder === 'Archive' ? 'Projects' : 'Archive';
                      setFiles((previous) =>
                        previous.map((file) =>
                          file.id === context.id ? { ...file, folder: target } : file,
                        ),
                      );
                      setMessage(`Moved ${context.name} to ${target}`);
                    },
                  },
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
            setFiles(initialFiles);
            setFolder('Projects');
            setDetail(view === 'columns' || view === 'gallery' ? 'brief' : null);
            setDragging(null);
            setOver(null);
            setQuery('');
            setHistory({ folders: ['Projects'], index: 0 });
            setMessage('6 items · Fictional workspace');
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
  },
  render: (args) => (
    <FinderDemo
      key={`${args.initialView}-${args.initialDark}-${args.initialDensity}-${args.initialPreview}`}
      {...args}
    />
  ),
  argTypes: {
    initialView: {
      control: 'inline-radio',
      options: ['icons', 'list', 'columns', 'gallery'],
      description: 'Starting view. Changing a starting control restarts the fictional workspace.',
    },
    initialPreview: {
      control: 'boolean',
      description: 'Start column/gallery views with the first file preview selected.',
    },
    initialDark: { control: 'boolean', description: 'Start with the Puppertino dark theme.' },
    initialDensity: {
      control: 'inline-radio',
      options: ['compact', 'comfortable'],
      description:
        'Starting CSS density. The in-app selector changes density without resetting files.',
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
          'Small fictional Finder-style apps. Shared table, column browser, density and menus; native HTML drag/drop and in-memory moves are owned by this example. The Move menu command is the keyboard alternative. No filesystem access.',
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
      description: {
        story:
          'Start with the file column; click a file to reveal its preview. Narrow windows keep ancestor columns accessible by horizontal scrolling. Use the canvas resize control to compare smaller widths.',
      },
    },
  },
};
