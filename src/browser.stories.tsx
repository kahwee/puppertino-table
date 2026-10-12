import type { Meta, StoryObj } from '@storybook/react-vite';
import type { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import {
  ColumnBrowser,
  ColumnBrowserItem,
  type ColumnBrowserPanel,
  type ColumnBrowserWidths,
  ContextMenu,
  createPuppertinoColumnHelper,
  PuppertinoTable,
  type TableDensity,
  useContextMenu,
  usePuppertinoTable,
  useRowSelectionGestures,
} from './index.js';

const resources = Array.from({ length: 28 }, (_, index) => ({
  id: `resource-${index}`,
  name:
    index === 0
      ? 'Project brief.pdf'
      : index === 1
        ? 'Consolidated project research and planning notes.txt'
        : `Review note ${String(index + 1).padStart(2, '0')}.txt`,
  kind: index === 0 ? 'PDF' : 'Text',
  owner: ['Design', 'Engineering', 'Operations'][index % 3],
}));
const helper = createPuppertinoColumnHelper<(typeof resources)[number]>();
function ResourceIcon({ folder = false }: { folder?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      {folder ? (
        <path d="M2 6h8l2 3h10v12H2Z" fill="currentColor" fillOpacity=".2" />
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
    size: 400,
    minSize: 180,
    cell: (cell) => (
      <span className="demo-resource-label">
        <span className="pt-icon">
          <ResourceIcon />
        </span>
        {cell.getValue()}
      </span>
    ),
  }),
  helper.accessor('kind', { header: 'Kind', size: 100 }),
  helper.accessor('owner', { header: 'Owner', size: 160 }),
]);

function ResourceBrowser({
  tableView = false,
  controlled = false,
  readOnly = false,
}: {
  tableView?: boolean;
  controlled?: boolean;
  readOnly?: boolean;
}) {
  const [density, setDensity] = useState<TableDensity>('compact');
  const [dark, setDark] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [inspect, setInspect] = useState<string | null>(null);
  const [selection, setSelection] = useState<RowSelectionState>({ 'resource-0': true });
  const [widths, setWidths] = useState<ColumnBrowserWidths>({ workspace: 224, projects: 224 });
  const [commits, setCommits] = useState(0);
  const [committedWidths, setCommittedWidths] = useState<ColumnBrowserWidths>({});
  const [resizeDisabled, setResizeDisabled] = useState(false);
  const [project, setProject] = useState('Alpine');
  const [rootOnly, setRootOnly] = useState(false);
  const menu = useContextMenu<string>();
  const table = usePuppertinoTable({
    data: resources,
    columns,
    getRowId: (item) => item.id,
    selectable: true,
    rowSelection: selection,
    onRowSelectionChange: setSelection,
  });
  const { select, clearSelection } = useRowSelectionGestures(table);
  const panels: ColumnBrowserPanel[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      content: (
        <>
          <ColumnBrowserItem
            icon={<ResourceIcon folder />}
            pathSelected
            trailing="›"
            onClick={() => setRootOnly(!rootOnly)}
          >
            Projects
          </ColumnBrowserItem>
          <ColumnBrowserItem
            href="#workspace-guide"
            target="_blank"
            rel="noopener noreferrer"
            icon={<ResourceIcon />}
          >
            Workspace guide
          </ColumnBrowserItem>
          <ColumnBrowserItem href="#unavailable-guide" disabled>
            Unavailable guide
          </ColumnBrowserItem>
        </>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      content: ['Alpine', 'Brook', 'Cedar'].map((name) => (
        <ColumnBrowserItem
          key={name}
          icon={<ResourceIcon folder />}
          pathSelected={name === project}
          trailing="›"
          onClick={() => {
            setProject(name);
            clearSelection();
          }}
        >
          {name}
        </ColumnBrowserItem>
      )),
    },
    {
      id: 'resources',
      label: project,
      content: resources.map((resource) => (
        <ColumnBrowserItem
          key={resource.id}
          icon={<ResourceIcon />}
          title={resource.name}
          selected={selection[resource.id]}
          {...menu.getTriggerProps(resource.id)}
          onClick={(event) =>
            select(resource.id, { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey })
          }
        >
          {resource.name}
        </ColumnBrowserItem>
      )),
    },
  ];
  const active = resources.find((resource) => resource.id === inspect);
  const context = resources.find((resource) => resource.id === menu.state?.context);
  return (
    <main className={`demo-shell ${dark ? 'p-dark-mode' : ''}`}>
      <header>
        <div>
          <p className="demo-eyebrow">Shared density · caller-owned items · context commands</p>
          <h1>{tableView ? 'Resource table' : 'Project column browser'}</h1>
          <p>Fictional project items. Right-click a resource, or focus it and press Shift+F10.</p>
        </div>
        <button type="button" className="p-button" onClick={() => setDark(!dark)}>
          Toggle dark theme
        </button>
      </header>
      <section
        className="demo-panel demo-browser-example"
        style={{ maxWidth: narrow ? 520 : 1120 }}
        aria-label="Resource workspace"
      >
        <div className="demo-toolbar">
          <label>
            Density{' '}
            <select
              className="demo-density-select"
              aria-label="Density"
              value={density}
              onChange={(event) => setDensity(event.target.value as TableDensity)}
            >
              <option value="native">Native</option>
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </label>
          <button type="button" className="p-button" onClick={() => setNarrow(!narrow)}>
            Toggle narrow layout
          </button>
          <button type="button" className="p-button" onClick={() => setRootOnly(!rootOnly)}>
            Toggle root view
          </button>
          <label>
            <input
              type="checkbox"
              checked={resizeDisabled}
              onChange={(event) => setResizeDisabled(event.target.checked)}
            />
            Disable resizing
          </label>
          <button
            type="button"
            className="p-button"
            onClick={() => setInspect(inspect ? null : 'resource-0')}
          >
            Toggle inspector
          </button>
        </div>
        <div className={`demo-browser-workspace ${inspect ? 'has-inspector' : ''}`}>
          {tableView ? (
            <PuppertinoTable
              data={resources.slice(0, 8)}
              columns={columns}
              getRowId={(item) => item.id}
              ariaLabel="Project resources"
              density={density}
              selectable
              rowSelection={selection}
              onRowSelectionChange={setSelection}
              resizable={!resizeDisabled}
              getRowProps={(row) => ({ tabIndex: 0, ...menu.getTriggerProps(row.id) })}
            />
          ) : (
            <ColumnBrowser
              panels={rootOnly ? panels.slice(0, 1) : panels}
              ariaLabel="Project folders"
              density={density}
              resizeDisabled={resizeDisabled}
              onWidthsCommit={(next) => {
                setCommittedWidths(next);
                setCommits((count) => count + 1);
              }}
              {...(controlled
                ? {
                    widths,
                    onWidthsChange: readOnly ? undefined : setWidths,
                  }
                : {})}
            />
          )}
          {active && (
            <aside className="demo-resource-inspector" aria-label="Resource details">
              <span className="demo-preview-art">
                <ResourceIcon />
              </span>
              <h2>{active.name}</h2>
              <dl>
                <dt>Kind</dt>
                <dd>{active.kind}</dd>
                <dt>Owner</dt>
                <dd>{active.owner}</dd>
                <dt>Project</dt>
                <dd>{project}</dd>
              </dl>
              <p>Sample content for the shared layout demo.</p>
            </aside>
          )}
        </div>
        <footer>
          <span>Workspace › Projects › {project}</span>
          <span className="demo-spacer" />
          {!tableView && (
            <>
              <output aria-label="Panel resize commits">{commits}</output>
              <output aria-label="Committed panel widths">{JSON.stringify(committedWidths)}</output>
            </>
          )}
          <output aria-label="Resource selection count">
            {Object.keys(selection).length} selected
          </output>
        </footer>
      </section>
      <ContextMenu
        ariaLabel="Resource commands"
        position={menu.state?.position ?? null}
        returnFocus={menu.state?.returnFocus}
        onClose={menu.close}
        actions={
          context
            ? [
                {
                  id: 'inspect',
                  label: 'Show details',
                  icon: <ResourceIcon />,
                  shortcut: '⌘I',
                  onSelect: () => setInspect(context.id),
                },
                {
                  id: 'select',
                  label: 'Select only this item',
                  onSelect: () => select(context.id),
                },
                { id: 'commands-divider', type: 'separator' },
                {
                  id: 'clear',
                  label: 'Clear selection',
                  disabled: !Object.keys(selection).length,
                  onSelect: clearSelection,
                },
                {
                  id: 'download',
                  label: 'Download sample',
                  href: 'data:text/plain,Sample%20resource',
                  download: 'sample-resource.txt',
                },
                {
                  id: 'resource-link',
                  label: 'Open resource link',
                  href: `#${context.id}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  icon: <ResourceIcon />,
                },
                {
                  id: 'unavailable-link',
                  label: 'Unavailable resource link',
                  href: '#unavailable',
                  disabled: true,
                },
              ]
            : []
        }
      />
    </main>
  );
}
const meta = {
  title: 'Puppertino/Resource browser',
  component: ResourceBrowser,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Density shared by semantic tables and independently resizable column panels. Navigation, data and menu commands are supplied by the example application.',
      },
    },
  },
} satisfies Meta<typeof ResourceBrowser>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ColumnWorkspace: Story = {};
export const DensityTable: Story = { args: { tableView: true } };
export const ControlledPanels: Story = { args: { controlled: true } };
export const ReadOnlyPanels: Story = { args: { controlled: true, readOnly: true } };
