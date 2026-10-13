import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCreateAtom } from '@tanstack/react-store';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { tableRecipes } from '../.storybook/table-sources.js';
import { DateTableExample } from '../demo/date-table-example.js';
import { type Person, people, personColumns, productColumns, products } from '../demo/fixtures.js';
import { KeyboardNavigationExample } from '../demo/keyboard-navigation-example.js';
import {
  AtomOwnershipExample,
  ControlledSizingExample,
  ReadOnlyStateExample,
  ResizeEventsExample,
} from '../demo/table-state-examples.js';
import { TableStatusExample } from '../demo/table-status-example.js';
import {
  ColumnResizeHandle,
  type PuppertinoColumnDef,
  PuppertinoTable,
  type PuppertinoTableProps,
  RowSelectionCheckbox,
  TableBody,
  TableHeader,
  TableView,
  usePuppertinoTable,
  useRowSelectionGestures,
} from './index.js';
import { tableDefaults } from './table-behavior.js';

function Example(args: Partial<Omit<PuppertinoTableProps<Person>, 'atoms'>>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selection, setSelection] = useState<RowSelectionState>({});
  return (
    <>
      <PuppertinoTable
        data={people.slice(0, 12)}
        columns={personColumns}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        ariaLabel="People"
        selectable
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        manualSorting={false}
        {...args}
      />
      <output aria-label="Checked rows">{Object.keys(selection).length} selected</output>
    </>
  );
}
// Bind the row model once so Storybook checks the real public component props.
const PeopleTable = TableView<Person>;
const meta = {
  title: 'Puppertino/Table',
  component: PeopleTable,
  render: (args) => <Example {...args} />,
  parameters: {
    controls: {
      include: [
        'disabled',
        'selectable',
        'selectionCheckboxes',
        'resizable',
        'manualSorting',
        'density',
        'ariaLabel',
      ],
    },
    docs: {
      source: { language: 'tsx', type: 'code' },
      description: {
        component:
          'Playground is the typed public TableView<Person> component with internally managed state. Selection shows React-controlled sorting and selection; External Atoms shares app-owned state. Automatic sorting is the default. Set manualSorting for server pages or app-owned ordering. The visible stories cover the main integration paths; advanced interaction and state cases remain tested by direct story URL. Each Show code panel includes public imports, typed columns and sample data.',
      },
    },
  },
  args: {
    gestureOwnership: 'controlled',
    ...tableDefaults,
    data: people.slice(0, 12),
    columns: personColumns,
    getRowId: (row) => row.id,
    getRowLabel: (row) => row.name,
    selectable: true,
    density: 'native',
    ariaLabel: 'People',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable sorting, selection and resizing.',
      table: { defaultValue: { summary: String(tableDefaults.disabled) } },
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection. This story enables it; the library defaults to false.',
      table: { defaultValue: { summary: String(tableDefaults.selectable) } },
    },
    selectionCheckboxes: {
      control: 'boolean',
      description: 'Show the selection column when selectable; hide for row-only gestures.',
      table: { defaultValue: { summary: String(tableDefaults.selectionCheckboxes) } },
    },
    resizable: {
      control: 'boolean',
      description: 'Enable pointer and keyboard column resizing.',
      table: { defaultValue: { summary: String(tableDefaults.resizable) } },
    },
    manualSorting: {
      control: 'boolean',
      description:
        'Default false: sort supplied rows automatically. Enable for server pages or app-owned order.',
      table: { defaultValue: { summary: String(tableDefaults.manualSorting) } },
    },
    density: {
      control: 'inline-radio',
      options: ['native', 'compact', 'comfortable'],
      description:
        'Omitting density inherits the surrounding scope. This story starts with native spacing.',
      table: { defaultValue: { summary: 'inherit' } },
    },
    ariaLabel: { control: 'text', description: 'Accessible name for the table.' },
    data: { control: false },
    columns: { control: false },
  },
} satisfies Meta<
  PuppertinoTableProps<Person> & { gestureOwnership?: 'controlled' | 'local' | 'atom' }
>;
export default meta;
export type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Playground',
  parameters: { docs: { source: { code: tableRecipes.uncontrolled } } },
  render: (args) => <PeopleTable {...args} />,
};

function ItemGestureExample({ ownership }: { ownership: 'controlled' | 'local' | 'atom' }) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const selectionAtom = useCreateAtom<RowSelectionState>({});
  const [disabled, setDisabled] = useState(false);
  const [gesturesDisabled, setGesturesDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [cards, setCards] = useState(false);
  const anchor = useRef<string | null>(null);
  const data = people.slice(0, 5);
  const table = usePuppertinoTable({
    data,
    columns: personColumns,
    getRowId: (row) => row.id,
    selectable: true,
    disabled,
    ...(ownership === 'controlled'
      ? { rowSelection: selection, onRowSelectionChange: readOnly ? undefined : setSelection }
      : ownership === 'atom'
        ? { atoms: { rowSelection: selectionAtom } }
        : {}),
  });
  const items = [{ id: 'folder', name: 'Example folder' }, ...data];
  const { select, clearSelection } = useRowSelectionGestures(table, {
    orderedIds: items.map((item) => item.id),
    anchor,
    disabled: gesturesDisabled,
  });
  return (
    <main className="demo-shell">
      <h1>Anchored item selection</h1>
      <p>Click an item. Command/Ctrl toggles; Shift extends or shrinks the original range.</p>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disable gestures
      </label>
      <label>
        <input
          type="checkbox"
          checked={gesturesDisabled}
          onChange={(event) => setGesturesDisabled(event.target.checked)}
        />
        Disable gesture hook
      </label>
      {ownership === 'controlled' && (
        <label>
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(event) => setReadOnly(event.target.checked)}
          />
          Read-only selection
        </label>
      )}
      <button type="button" className="p-button" onClick={() => setCards(!cards)}>
        Switch layout
      </button>
      <button
        type="button"
        className="p-button"
        aria-disabled={disabled || readOnly || gesturesDisabled}
        onClick={clearSelection}
      >
        Clear selection
      </button>
      <table.Subscribe source={table.atoms.rowSelection}>
        {(selected) => (
          <>
            <ul
              className="p-list demo-gesture-list"
              aria-label="Selectable items"
              style={
                cards
                  ? { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
                  : undefined
              }
            >
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`p-list-row demo-gesture-row ${selected[item.id] ? 'p-selected' : ''}`}
                    aria-pressed={!!selected[item.id]}
                    aria-disabled={disabled || readOnly || gesturesDisabled}
                    onClick={(event) =>
                      select(item.id, {
                        shift: event.shiftKey,
                        toggle: event.metaKey || event.ctrlKey,
                      })
                    }
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            <output aria-label="Gesture selection count">
              {Object.values(selected).filter(Boolean).length} selected
            </output>
          </>
        )}
      </table.Subscribe>
    </main>
  );
}

export const ItemSelectionGestures: Story = {
  args: { gestureOwnership: 'controlled' },
  argTypes: {
    gestureOwnership: {
      control: 'inline-radio',
      options: ['controlled', 'local', 'atom'],
      description:
        'Changing the state owner restarts this selection example; layout changes preserve its anchor.',
    },
  },
  parameters: {
    controls: { include: ['gestureOwnership'] },
    docs: {
      source: {
        code: tableRecipes.controlledGestures,
        transform: (_code: string, context: { args: { gestureOwnership?: string } }) =>
          context.args.gestureOwnership === 'local'
            ? tableRecipes.localGestures
            : context.args.gestureOwnership === 'atom'
              ? tableRecipes.atomGestures
              : tableRecipes.controlledGestures,
      },
    },
  },
  render: (args) => (
    <ItemGestureExample
      key={args.gestureOwnership}
      ownership={args.gestureOwnership ?? 'controlled'}
    />
  ),
};
export const Selection: Story = {
  parameters: { docs: { source: { code: tableRecipes.controlled } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boxes = canvas.getAllByRole('checkbox', { name: /^Select Person/ });
    const user = userEvent.setup();
    await user.click(boxes[1]);
    await user.keyboard('{Shift>}');
    await user.click(boxes[4]);
    await user.keyboard('{/Shift}');
    await expect(canvas.getByLabelText('Checked rows')).toHaveTextContent('4 selected');
  },
};
export const KeyboardResize: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { docs: { source: { code: tableRecipes.controlled } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edge = canvas.getByRole('separator', { name: 'Resize Name column' });
    edge.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(edge).toHaveAttribute('aria-valuenow', '256');
    await userEvent.keyboard('{Enter}');
    await expect(edge).toHaveAttribute('aria-valuenow', '240');
  },
};
export const Narrow: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { docs: { source: { code: tableRecipes.controlled } } },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export const Empty: Story = {
  tags: ['!dev', '!autodocs'],
  args: { data: [], emptyContent: 'No people match this view.' },
  parameters: { docs: { source: { code: tableRecipes.empty } } },
};
export const ReadOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.readOnly },
      description: {
        story:
          'Controlled sorting, selection and widths without change callbacks are read-only. Selected rows and sort direction remain visible; resizing and sorting controls are omitted.',
      },
    },
  },
  render: () => <ReadOnlyStateExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: /^Sort by/ })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('separator')).not.toBeInTheDocument();
    await expect(canvas.getByRole('checkbox', { name: 'Select Person 001' })).toBeChecked();
    for (const checkbox of canvas.getAllByRole('checkbox')) {
      await expect(checkbox).toBeDisabled();
    }
    await expect(canvas.getByRole('columnheader', { name: 'Score' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  },
};
export const ServerOwnedOrder: Story = {
  args: { manualSorting: true },
  parameters: {
    docs: {
      source: { code: tableRecipes.server },
      description: {
        story:
          'Sort callbacks request a new order from the app. The current page stays in the supplied order; the table never sorts a server page locally.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getAllByRole('row')[1].textContent;
    if (first === null) throw new Error('Missing server-owned first row');
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Score' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent(first);
  },
};
export const DifferentSchema: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.products } } },
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    return (
      <PuppertinoTable
        data={products}
        columns={productColumns}
        getRowId={(row) => row.id}
        ariaLabel="Inventory"
        sorting={sorting}
        onSortingChange={setSorting}
        manualSorting={false}
      />
    );
  },
};

export const GroupedHeaders: Story = {
  parameters: { docs: { source: { code: tableRecipes.grouped } } },
  args: {
    columns: [
      { id: 'identity', header: 'Identity', columns: personColumns.slice(0, 2) },
      ...personColumns.slice(2),
    ],
  },
};

const standaloneColumns: readonly PuppertinoColumnDef<Person>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [{ accessorKey: 'name', header: 'Name', size: 240, minSize: 160, maxSize: 700 }],
  },
  { accessorKey: 'score', header: 'Score', size: 120, minSize: 80, maxSize: 240 },
];
function StandaloneResizeExample() {
  const [controls, setControls] = useState(true);
  const [nameHandle, setNameHandle] = useState(true);
  const table = usePuppertinoTable({
    columns: standaloneColumns,
    data: people.slice(0, 2),
    getRowId: (row) => row.id,
  });
  return (
    <>
      <button type="button" onClick={() => setNameHandle(!nameHandle)}>
        {nameHandle ? 'Remove' : 'Mount'} name handle
      </button>
      <button type="button" onClick={() => setControls(!controls)}>
        {controls ? 'Remove' : 'Mount'} resize controls
      </button>
      <table.Subscribe source={table.atoms.columnSizing}>
        {() => (
          <>
            <output aria-label="Standalone name width">{table.getColumn('name')?.getSize()}</output>
            <table className="p-table pt-table" aria-label="Standalone resize table">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) =>
                      header.isPlaceholder ? (
                        <td key={header.id} colSpan={header.colSpan} />
                      ) : (
                        <th key={header.id} colSpan={header.colSpan}>
                          <table.FlexRender header={header} />
                          {controls && (nameHandle || header.column.id !== 'name') && (
                            <ColumnResizeHandle
                              table={table}
                              header={header}
                              label={header.column.id}
                            />
                          )}
                        </th>
                      ),
                    )}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </table.Subscribe>
    </>
  );
}
export const StandaloneResize: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.standalone } } },
  render: () => <StandaloneResizeExample />,
};

function CustomizedRowsExample({ empty = false }: { empty?: boolean }) {
  const [active, setActive] = useState('');
  const [context, setContext] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  return (
    <>
      <PuppertinoTable
        data={empty ? [] : people.slice(0, 2)}
        columns={personColumns}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={setSorting}
        ariaLabel="Customized people"
        selectable
        getRowProps={(row) => ({
          className: active === row.id ? 'active-row' : undefined,
          'aria-current': active === row.id ? 'true' : undefined,
          onClick: () => setActive(row.id),
          onContextMenu: (event) => {
            event.preventDefault();
            setContext(row.original.name);
          },
        })}
        getCellProps={(cell) => ({
          title: `${cell.column.id}: ${cell.getValue()}`,
          onDoubleClick: () => setContext(cell.column.id),
        })}
        leadingRows={(_table, context) => (
          <tr>
            <td colSpan={context.columnCount}>
              <button type="button" onClick={() => setContext('Folder opened')}>
                Open folder
              </button>
            </td>
          </tr>
        )}
      />
      <output aria-label="Context action">{context}</output>
      <output aria-label="Active row">{active}</output>
    </>
  );
}
export const CustomizedRows: Story = {
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.customized } } },
  render: () => <CustomizedRowsExample />,
};
export const LeadingRowsWhenEmpty: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.leading } } },
  render: () => <CustomizedRowsExample empty />,
};

function HookLayoutExample() {
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [resizable, setResizable] = useState(true);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = usePuppertinoTable({
    data: people.slice(0, 3),
    columns: personColumns,
    getRowId: (row) => row.id,
    sorting,
    onSortingChange: setSorting,
    selectable: true,
    disabled,
    resizable,
    rowSelection: selection,
    onRowSelectionChange: readOnly ? undefined : setSelection,
  });
  return (
    <>
      <button type="button" onClick={() => setReadOnly(!readOnly)}>
        Toggle read-only selection
      </button>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disable table
      </label>
      <label>
        <input
          type="checkbox"
          checked={resizable}
          onChange={(event) => setResizable(event.target.checked)}
        />
        Enable resizing
      </label>
      <table.Subscribe source={table.atoms.columnSizing}>
        {() => (
          <table
            className="p-table pt-table"
            aria-label="Hook layout"
            style={{ width: table.getTotalSize() + 36 }}
          >
            <colgroup>
              <col style={{ width: 36 }} />
              {table.getAllLeafColumns().map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
            <TableHeader table={table} />
            <TableBody table={table} getRowLabel={(row) => row.name} />
          </table>
        )}
      </table.Subscribe>
    </>
  );
}
export const HookLayout: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.hook } } },
  render: () => <HookLayoutExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole('table', { name: 'Hook layout' }));
    await userEvent.click(table.getByRole('checkbox', { name: 'Select Person 001' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Disable table' }));
    for (const checkbox of table.getAllByRole('checkbox')) await expect(checkbox).toBeDisabled();
    await expect(table.queryByRole('separator')).not.toBeInTheDocument();
    await expect(table.queryByRole('button', { name: /^Sort by/ })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Disable table' }));
    await expect(table.getByRole('checkbox', { name: 'Select Person 001' })).toBeChecked();
    await expect(table.getByRole('checkbox', { name: 'Select Person 001' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Enable resizing' }));
    await expect(table.queryByRole('separator')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Enable resizing' }));
    await expect(table.getByRole('separator', { name: 'Resize Name column' })).toBeInTheDocument();
  },
};

export const IndependentTables: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.independent } } },
  render: () => (
    <>
      <Example ariaLabel="First table" />
      <Example ariaLabel="Second table" />
    </>
  ),
};

function UncontrolledStateExample() {
  const [sortingChanges, setSortingChanges] = useState(0);
  const [selectionChanges, setSelectionChanges] = useState(0);
  return (
    <>
      <PuppertinoTable
        data={people.slice(0, 3)}
        columns={personColumns}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        ariaLabel="Uncontrolled people"
        manualSorting={false}
        initialSorting={[{ id: 'score', desc: true }]}
        selectable
        initialRowSelection={{ [people[0].id]: true }}
        onSortingChange={() => setSortingChanges((count) => count + 1)}
        onRowSelectionChange={() => setSelectionChanges((count) => count + 1)}
        getRowProps={(row, context) => ({
          'data-column-count': context.columnCount,
          'data-row-id': row.id,
        })}
        getCellProps={(_cell, context) => ({ 'data-selectable': context.selectable })}
        leadingRows={(_table, context) => (
          <tr>
            <td colSpan={context.columnCount}>Folder with correct span</td>
          </tr>
        )}
      />
      <output aria-label="Sorting notifications">{sortingChanges}</output>
      <output aria-label="Selection notifications">{selectionChanges}</output>
    </>
  );
}
export const UncontrolledState: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.observed } } },
  render: () => <UncontrolledStateExample />,
};

function CheckboxPrimitiveExample() {
  const table = usePuppertinoTable({
    data: people.slice(0, 3),
    columns: personColumns,
    getRowId: (row) => row.id,
    selectable: true,
  });
  return (
    <table className="p-table pt-table" aria-label="Custom checkbox layout">
      <colgroup>
        <col />
        <col style={{ width: 36 }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Person</th>
          <th className="pt-selection" scope="col">
            <span className="pt-sr-only">Select</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            <td>{row.original.name}</td>
            <td className="pt-selection">
              <RowSelectionCheckbox row={row} label={row.original.name} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export const CheckboxPrimitive: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.checkbox } } },
  render: () => <CheckboxPrimitiveExample />,
};

export const ControlledSizing: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.sizing } } },
  render: () => <ControlledSizingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edge = canvas.getByRole('separator', { name: 'Resize Name column' });
    edge.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByLabelText('Name width')).toHaveTextContent('296');
    await userEvent.click(canvas.getByRole('button', { name: 'Set name width to 200' }));
    await expect(edge).toHaveAttribute('aria-valuenow', '200');
  },
};

export const ExternalAtoms: Story = {
  parameters: { controls: { disable: true }, docs: { source: { code: tableRecipes.atoms } } },
  render: () => <AtomOwnershipExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edge = canvas.getByRole('separator', { name: 'Resize Name column' });
    edge.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByLabelText('Atom name width')).toHaveTextContent('296');
    await userEvent.click(canvas.getByRole('button', { name: 'Set atom width to 200' }));
    await expect(edge).toHaveAttribute('aria-valuenow', '200');
    const checkbox = canvas.getAllByRole('checkbox', { name: /^Select person-/ })[0];
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Score' }));
    await expect(canvas.getByRole('columnheader', { name: /Score/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  },
};

function PaginatedSelectionExample() {
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<RowSelectionState>({});
  return (
    <>
      <button type="button" onClick={() => setPage(page === 0 ? 1 : 0)}>
        Switch page
      </button>
      <PuppertinoTable
        data={people.slice(page * 2, page * 2 + 2)}
        columns={personColumns}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        ariaLabel="Paged people"
        manualSorting
        selectable
        rowSelection={selection}
        onRowSelectionChange={setSelection}
      />
      <output aria-label="Total selected">{Object.values(selection).filter(Boolean).length}</output>
    </>
  );
}
export const PaginatedSelection: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.paginated },
      description: {
        story:
          'The header checkbox selects only the current page. Switch pages to verify that selections on other pages survive selecting and clearing this page.',
      },
    },
  },
  render: () => <PaginatedSelectionExample />,
};

export const ResizeEvents: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.resize },
      description: {
        story:
          'Internal widths with an observer: change callbacks include previews and cancellation; onColumnSizingCommit receives completed pointer, keyboard and reset snapshots. Escape cancels a preview without committing.',
      },
    },
  },
  render: () => <ResizeEventsExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edge = canvas.getByRole('separator', { name: 'Resize Name column' });
    edge.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByLabelText('Preview name width')).toHaveTextContent('256');
    await expect(canvas.getByLabelText('Committed name width')).toHaveTextContent('256');
    await expect(canvas.getByLabelText('Resize commits')).toHaveTextContent('1');
  },
};

export const DateColumns: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.dates },
      description: {
        story:
          'Date Added keeps real Date values for chronological sorting and formats only the cell. Click once for newest first. Missing and invalid dates stay last in both directions. Compare display time zones and the repeated hour at daylight-saving time; timestamp order stays unchanged.',
      },
    },
  },
  render: () => <DateTableExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Oct 10, 2026 at 4:40 PM')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Date Added' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('November plan');
    await expect(canvas.getAllByRole('row').at(-2)).toHaveTextContent('Undated draft');
    await expect(canvas.getAllByRole('row').at(-1)).toHaveTextContent('Invalid imported timestamp');
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Date Added' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('September notes');
    await expect(canvas.getAllByRole('row')[2]).toHaveTextContent('Morning update');
    await expect(canvas.getAllByRole('row')[3]).toHaveTextContent('October brief');
    await expect(canvas.getAllByRole('row').at(-1)).toHaveTextContent('Invalid imported timestamp');
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Display time zone' }),
      'UTC',
    );
    await expect(canvas.getByText('Oct 10, 2026 at 11:40 PM')).toBeInTheDocument();
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('September notes');
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Display time zone' }),
      'America/Los_Angeles',
    );
  },
};

export const RequestStates: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.status },
      description: {
        story:
          'Loading, retryable errors, empty results and refreshes are app-owned. Previously loaded rows stay visible during refresh/error states. No network requests are made by the table.',
      },
    },
  },
  render: () => <TableStatusExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Request states' });
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading people');
    await expect(canvas.queryByText('No matching people.')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Load rows' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(4);
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh rows' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(5);
    await expect(canvas.getByText('Person 001')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Fail request' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Could not refresh people');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Show no results' }));
    await expect(canvas.getByText('No matching people.')).toBeInTheDocument();
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const KeyboardItems: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      source: { code: tableRecipes.keyboard },
      description: {
        story:
          'One reusable navigation hook handles native buttons in lists and grids. Selection stays in the table atom; focus is independent. Modified commands and native activation remain available to the app.',
      },
    },
  },
  render: () => <KeyboardNavigationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const files = within(canvas.getByRole('list', { name: 'Keyboard files' }));
    const first = files.getByRole('button', { name: 'Project brief.pdf' });
    const second = files.getByRole('button', { name: 'Research notes.txt' });
    await userEvent.click(first);
    await userEvent.keyboard('{ArrowDown}');
    await expect(second).toHaveFocus();
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect(files.getByRole('button', { name: 'Budget.xlsx' })).toHaveFocus();
    await expect(second).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Three-column grid' }));
    await userEvent.click(first);
    await userEvent.keyboard('{ArrowDown}');
    await expect(files.getByRole('button', { name: 'Cover artwork.png' })).toHaveFocus();
    await userEvent.keyboard('b');
    await expect(files.getByRole('button', { name: 'Budget.xlsx' })).toHaveFocus();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Disable navigation' }));
    await expect(first).toBeDisabled();
  },
};
