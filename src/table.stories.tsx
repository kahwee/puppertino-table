import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTable, type RowSelectionState, type SortingState } from '@tanstack/react-table';
import { PuppertinoTable, ColumnResizeHandle, puppertinoTableFeatures, type PuppertinoTableProps, type PuppertinoColumnDef } from './index.js';
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
  const table = useTable({ features: puppertinoTableFeatures, columns: standaloneColumns, data: people.slice(0, 2), getRowId: row => row.id,
    state: { sorting: [] as SortingState, rowSelection: {} as RowSelectionState },
  }, state => ({ sorting: state.sorting, rowSelection: state.rowSelection }));
  return <>
    <button type="button" onClick={() => setControls(!controls)}>{controls ? 'Remove' : 'Mount'} resize controls</button>
    <table.Subscribe source={table.atoms.columnSizing}>{() => <>
      <output aria-label="Standalone name width">{table.getColumn('name')!.getSize()}</output>
      <table className="p-table pt-table" aria-label="Standalone resize table"><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => <th key={header.id} colSpan={header.colSpan}>
        {!header.isPlaceholder && <table.FlexRender header={header} />}
        {controls && <ColumnResizeHandle table={table} header={header} label={header.column.id} />}
      </th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{row.getAllCells().map(cell => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody></table>
    </>}</table.Subscribe>
  </>;
}
export const StandaloneResize: Story = { render: () => <StandaloneResizeExample /> };
