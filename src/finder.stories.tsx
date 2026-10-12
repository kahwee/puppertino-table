import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DragEvent } from 'react';
import { useState } from 'react';
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
function Glyph({ folder = false }: { folder?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      {folder ? (
        <path d="M2 6h8l2 3h10v12H2Z" fill="currentColor" fillOpacity=".25" />
      ) : (
        <>
          <path d="M5 2h9l5 5v15H5Z" />
          <path d="M14 2v5h5M8 12h8M8 16h6" />
        </>
      )}
    </svg>
  );
}
const columns = helper.columns([
  helper.accessor('name', {
    header: 'Name',
    size: 300,
    minSize: 200,
    maxSize: 440,
    cell: (cell) => (
      <span className="finder-demo-filename">
        <span className="pt-icon">
          <Glyph />
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
}: {
  initialView?: 'list' | 'columns';
  initialDark?: boolean;
  initialDensity?: 'compact' | 'comfortable';
}) {
  const [files, setFiles] = useState(initialFiles);
  const [folder, setFolder] = useState('Projects');
  const [view, setView] = useState(initialView);
  const [dark, setDark] = useState(initialDark);
  const [density, setDensity] = useState<TableDensity>(initialDensity);
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState('6 items · Fictional workspace');
  const menu = useContextMenu<string>();
  const visible = files.filter((file) => file.folder === folder);
  const active = files.find((file) => file.id === detail);
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
      onClick={() => setFolder(name)}
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
          <span className="finder-demo-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="finder-demo-title">
            <h1>{folder}</h1>
            <span>Workspace / {folder}</span>
          </div>
          <fieldset className="finder-demo-views" aria-label="View">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
            <button
              type="button"
              aria-pressed={view === 'columns'}
              onClick={() => setView('columns')}
            >
              Columns
            </button>
          </fieldset>
          <select
            aria-label="Row density"
            value={density}
            onChange={(event) => setDensity(event.target.value as TableDensity)}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </select>
          <button
            type="button"
            aria-label={`Toggle ${dark ? 'light' : 'dark'} theme`}
            onClick={() => setDark(!dark)}
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </header>
        <DensityScope density={density} className="finder-demo-workspace">
          <nav className="finder-demo-sidebar" aria-label="Favorites">
            <h2>Favorites</h2>
            {['Projects', 'Archive'].map(folderButton)}
            <h2>Workspace</h2>
            <p>Design studio</p>
            <p>Local demo</p>
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
                emptyContent="Drop a file here from Projects."
              />
            ) : (
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
                        icon={<Glyph />}
                        {...menu.getTriggerProps(file.id)}
                        {...dragProps(file)}
                        onClick={() => setDetail(file.id)}
                      >
                        {file.name}
                      </ColumnBrowserItem>
                    )),
                  },
                  {
                    id: 'preview',
                    label: 'Preview',
                    content: (
                      <div className="finder-demo-preview">
                        <div className="finder-demo-paper">
                          <Glyph />
                          <strong>{active?.name ?? 'Select a file'}</strong>
                          <span>PROJECT / ALPINE</span>
                          <hr />
                          <hr />
                          <hr />
                        </div>
                        <p>{active?.kind ?? 'Click an item to preview it'}</p>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
          {active && view === 'list' && (
            <aside className="finder-demo-details" aria-label="File details">
              <span className="finder-demo-detail-icon">
                <Glyph />
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
              <button type="button" onClick={() => setDetail(null)}>
                Close details
              </button>
            </aside>
          )}
        </DensityScope>
        <footer className="finder-demo-status">
          <span role="status">{message}</span>
          <button
            type="button"
            onClick={() => {
              menu.close();
              setFiles(initialFiles);
              setFolder('Projects');
              setDetail(null);
              setDragging(null);
              setOver(null);
              setMessage('6 items · Fictional workspace');
              setRevision((value) => value + 1);
            }}
          >
            Reset demo
          </button>
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
                    onSelect: () => setDetail(context.id),
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
    </main>
  );
}

const meta = {
  title: 'Examples/Finder',
  component: FinderDemo,
  tags: ['!autodocs'],
  args: { initialView: 'list', initialDark: false, initialDensity: 'compact' },
  render: (args) => (
    <FinderDemo key={`${args.initialView}-${args.initialDark}-${args.initialDensity}`} {...args} />
  ),
  argTypes: {
    initialView: {
      control: 'inline-radio',
      options: ['list', 'columns'],
      description: 'Starting view. Changing a starting control restarts the fictional workspace.',
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
