import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type RowSelectionState, type SortingState } from '@tanstack/react-table';
import { PuppertinoTable, usePuppertinoTable, ColumnResizeHandle, TableHeader, TableBody, RowSelectionCheckbox, type PuppertinoTableProps, type PuppertinoColumnDef } from './index.js';
import { people, personColumns, products, productColumns, type Person } from '../demo/fixtures.js';
import { expect, userEvent, within } from 'storybook/test';

function Example(args: Partial<PuppertinoTableProps<Person>>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selection, setSelection] = useState<RowSelectionState>({});
  return <><PuppertinoTable data={people.slice(0, 12)} columns={personColumns} getRowId={row => row.id} getRowLabel={row => row.name} ariaLabel="People" selectable sorting={sorting} onSortingChange={setSorting} rowSelection={selection} onRowSelectionChange={setSelection} manualSorting={false} {...args} /><output aria-label="Checked rows">{Object.keys(selection).length} selected</output></>;
}
const meta = { title: 'Puppertino/Table', component: Example, parameters: { docs: { description: { component: 'Generic typed rows, custom cells, optional selection and precise cancelable sizing. Host-owned ordering is the default; local sorting is opt-in.' } } }, argTypes: { disabled: { control: 'boolean' }, selectable: { control: 'boolean' }, resizable: { control: 'boolean' }, manualSorting: { control: 'boolean' } } } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Sort by Score' }));
  await expect(canvas.getAllByRole('row')[1].children[3]).toHaveTextContent('86');
  await userEvent.click(canvas.getByRole('button', { name: 'Sort by Score' }));
  await expect(canvas.getAllByRole('row')[1].children[3]).toHaveTextContent('0');
} };
export const Selection: Story = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); const boxes = canvas.getAllByRole('checkbox'); const user = userEvent.setup();
  await user.click(boxes[1]); await user.keyboard('{Shift>}'); await user.click(boxes[4]); await user.keyboard('{/Shift}');
  await expect(canvas.getByLabelText('Checked rows')).toHaveTextContent('4 selected');
} };
export const KeyboardResize: Story = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); const edge = canvas.getByRole('separator', { name: 'Resize Name column' });
  edge.focus(); await userEvent.keyboard('{ArrowRight}'); await expect(edge).toHaveAttribute('aria-valuenow', '256');
  await userEvent.keyboard('{Enter}'); await expect(edge).toHaveAttribute('aria-valuenow', '240');
} };
export const Dark: Story = { decorators: [Story => <div className="demo-shell p-dark-mode" style={{ minHeight: 0, padding: 20 }}><Story /></div>] };
export const Narrow: Story = { decorators: [Story => <div style={{ width: 320 }}><Story /></div>] };
export const Empty: Story = { args: { data: [], emptyContent: 'No people match this view.' } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { selectable: false, resizable: false } };
export const ServerOwnedOrder: Story = { args: { manualSorting: true }, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); const first = canvas.getAllByRole('row')[1].textContent;
  await userEvent.click(canvas.getByRole('button', { name: 'Sort by Score' }));
  await expect(canvas.getAllByRole('row')[1]).toHaveTextContent(first!);
} };
export const DifferentSchema: Story = { render: () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  return <PuppertinoTable data={products} columns={productColumns} getRowId={row => row.id} ariaLabel="Inventory" sorting={sorting} onSortingChange={setSorting} manualSorting={false} />;
} };

export const GroupedHeaders: Story = { args: { columns: [{ id: 'identity', header: 'Identity', columns: personColumns.slice(0, 2) }, ...personColumns.slice(2)] } };

const standaloneColumns: readonly PuppertinoColumnDef<Person>[] = [
  { id: 'identity', header: 'Identity', columns: [{ accessorKey: 'name', header: 'Name', size: 240, minSize: 160, maxSize: 700 }] },
  { accessorKey: 'score', header: 'Score', size: 120, minSize: 80, maxSize: 240 },
];
function StandaloneResizeExample() {
  const [controls, setControls] = useState(true);
  const [nameHandle, setNameHandle] = useState(true);
  const table = usePuppertinoTable({ columns: standaloneColumns, data: people.slice(0, 2), getRowId: row => row.id });
  return <>
    <button type="button" onClick={() => setNameHandle(!nameHandle)}>{nameHandle ? 'Remove' : 'Mount'} name handle</button>
    <button type="button" onClick={() => setControls(!controls)}>{controls ? 'Remove' : 'Mount'} resize controls</button>
    <table.Subscribe source={table.atoms.columnSizing}>{() => <>
      <output aria-label="Standalone name width">{table.getColumn('name')!.getSize()}</output>
      <table className="p-table pt-table" aria-label="Standalone resize table"><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => <th key={header.id} colSpan={header.colSpan}>
        {!header.isPlaceholder && <table.FlexRender header={header} />}
        {controls && (nameHandle || header.column.id !== 'name') && <ColumnResizeHandle table={table} header={header} label={header.column.id} />}
      </th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{row.getAllCells().map(cell => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody></table>
    </>}</table.Subscribe>
  </>;
}
export const StandaloneResize: Story = { render: () => <StandaloneResizeExample /> };

function CustomizedRowsExample({ empty = false }: { empty?: boolean }) {
  const [active, setActive] = useState('');
  const [context, setContext] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  return <>
    <PuppertinoTable data={empty ? [] : people.slice(0, 2)} columns={personColumns} getRowId={row => row.id}
      sorting={sorting} onSortingChange={setSorting} ariaLabel="Customized people" selectable
      getRowProps={row => ({ className: active === row.id ? 'active-row' : undefined,
        'aria-current': active === row.id ? 'true' : undefined,
        onClick: () => setActive(row.id), onContextMenu: event => { event.preventDefault(); setContext(row.original.name); } })}
      getCellProps={cell => ({ title: `${cell.column.id}: ${cell.getValue()}`, onDoubleClick: () => setContext(cell.column.id) })}
      leadingRows={table => <tr><td colSpan={table.getAllLeafColumns().length + 1}><button type="button" onClick={() => setContext('Folder opened')}>Open folder</button></td></tr>} />
    <output aria-label="Context action">{context}</output>
    <output aria-label="Active row">{active}</output>
  </>;
}
export const CustomizedRows: Story = { render: () => <CustomizedRowsExample /> };
export const LeadingRowsWhenEmpty: Story = { render: () => <CustomizedRowsExample empty /> };

function HookLayoutExample() {
  const [readOnly, setReadOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = usePuppertinoTable({ data: people.slice(0, 3), columns: personColumns, getRowId: row => row.id,
    sorting, onSortingChange: setSorting, selectable: true, manualSorting: false, rowSelection: readOnly ? {} : undefined });
  return <><button type="button" onClick={() => setReadOnly(!readOnly)}>Toggle read-only selection</button><table.Subscribe source={table.atoms.columnSizing}>{() => <table className="p-table pt-table" aria-label="Hook layout" style={{ width: table.getTotalSize() + 36 }}>
    <colgroup><col style={{ width: 36 }} />{table.getAllLeafColumns().map(column => <col key={column.id} style={{ width: column.getSize() }} />)}</colgroup>
    <TableHeader table={table} selectable />
    <TableBody table={table} selectable getRowLabel={row => row.name} />
  </table>}</table.Subscribe></>;
}
export const HookLayout: Story = { render: () => <HookLayoutExample /> };

export const IndependentTables: Story = { render: () => <><Example ariaLabel="First table" /><Example ariaLabel="Second table" /></> };

function UncontrolledStateExample() {
  const [sortingChanges, setSortingChanges] = useState(0);
  const [selectionChanges, setSelectionChanges] = useState(0);
  return <>
    <PuppertinoTable data={people.slice(0, 3)} columns={personColumns} getRowId={row => row.id} getRowLabel={row => row.name}
      ariaLabel="Uncontrolled people" manualSorting={false} initialSorting={[{ id: 'score', desc: true }]} selectable
      initialRowSelection={{ [people[0].id]: true }} onSortingChange={() => setSortingChanges(count => count + 1)}
      onRowSelectionChange={() => setSelectionChanges(count => count + 1)}
      getRowProps={(row, context) => ({ 'data-column-count': context.columnCount, 'data-row-id': row.id })}
      getCellProps={(_cell, context) => ({ 'data-selectable': context.selectable })}
      leadingRows={(_table, context) => <tr><td colSpan={context.columnCount}>Folder with correct span</td></tr>} />
    <output aria-label="Sorting notifications">{sortingChanges}</output>
    <output aria-label="Selection notifications">{selectionChanges}</output>
  </>;
}
export const UncontrolledState: Story = { render: () => <UncontrolledStateExample /> };

function CheckboxPrimitiveExample() {
  const table = usePuppertinoTable({ data: people.slice(0, 3), columns: personColumns, getRowId: row => row.id, selectable: true });
  return <table className="p-table" aria-label="Custom checkbox layout"><thead><tr><th scope="col">Person</th><th scope="col">Select</th></tr></thead>
    <tbody>{table.getRowModel().rows.map(row => <tr key={row.id}><td>{row.original.name}</td><td><RowSelectionCheckbox row={row} label={row.original.name} /></td></tr>)}</tbody>
  </table>;
}
export const CheckboxPrimitive: Story = { render: () => <CheckboxPrimitiveExample /> };
