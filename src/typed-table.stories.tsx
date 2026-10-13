import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tableRecipes } from '../.storybook/table-sources.js';
import { type Asset, assetTableProps } from '../demo/typed-table-example.js';
import { PuppertinoTable } from './index.js';

// Bind the generic row type before Storybook infers props and required args.
const AssetTable = PuppertinoTable<Asset>;
const meta = {
  title: 'Puppertino/Typed table',
  component: AssetTable,
  args: assetTableProps,
  parameters: {
    controls: { include: ['ariaLabel', 'selectable', 'disabled', 'resizable', 'density'] },
    docs: {
      description: {
        component:
          'A direct generic component story. Bind PuppertinoTable<Asset>, use satisfies Meta<typeof AssetTable>, then derive StoryObj<typeof meta>. Show code includes the row model, inferred numeric/Date cells and checked props. See Start here → TypeScript for a copyable Storybook file.',
      },
      source: { language: 'tsx', type: 'code', code: tableRecipes.typed },
    },
  },
  argTypes: {
    ariaLabel: { control: 'text' },
    selectable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    resizable: { control: 'boolean' },
    density: { control: 'inline-radio', options: ['native', 'compact', 'comfortable'] },
    data: { control: false },
    columns: { control: false },
  },
} satisfies Meta<typeof AssetTable>;
export default meta;
export type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Size' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Research notes.txt');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Research notes.txt' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveClass(/p-selected/);
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Date Added' }));
    await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Research notes.txt');
  },
} satisfies Story;

export const Compact = { args: { density: 'compact' } } satisfies Story;
export const Disabled = { args: { disabled: true } } satisfies Story;
