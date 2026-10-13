import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tableRecipes } from '../.storybook/table-sources.js';
import { OutlineViewExample } from '../demo/outline-view-example.js';

const meta = {
  title: 'Puppertino/Outline view',
  component: OutlineViewExample,
  args: {
    disabled: false,
    density: 'comfortable',
    selectable: true,
    selectionCheckboxes: true,
    resizable: true,
    manualSorting: false,
  },
  argTypes: {
    disabled: { control: 'boolean', table: { category: 'Behavior' } },
    selectable: { control: 'boolean', table: { category: 'Selection' } },
    selectionCheckboxes: {
      control: 'boolean',
      if: { arg: 'selectable' },
      table: { category: 'Selection' },
    },
    density: {
      control: 'inline-radio',
      options: ['native', 'compact', 'comfortable'],
      table: { category: 'Appearance' },
    },
    resizable: { control: 'boolean', table: { category: 'Sizing' } },
    manualSorting: {
      control: 'boolean',
      description: 'Enable for server-owned sibling order.',
      table: { category: 'Sorting', defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    docs: {
      source: { language: 'tsx', type: 'code', code: tableRecipes.outline },
      description: {
        component:
          'Hierarchical rows with disclosure in the first column, sorting within each sibling group, keyboard navigation, selection and cancellable app-owned loadChildren. Option-click recursively expands or collapses a branch. Use the Theme toolbar for dark mode.',
      },
    },
  },
} satisfies Meta<typeof OutlineViewExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default = { name: 'Playground' } satisfies Story;
export const LoadingAndRetry = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading');
    await expect(
      canvas.findByRole('button', { name: 'Expand Source' }),
    ).resolves.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Archive' }));
    await expect(
      canvas.findByRole('button', { name: 'Retry Archive' }),
    ).resolves.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Retry Archive' }));
    await expect(
      canvas.findByRole('checkbox', { name: 'Select Meeting notes.txt' }),
    ).resolves.toBeInTheDocument();
  },
} satisfies Story;
export const KeyboardAndSelection = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('treegrid', { name: 'Document hierarchy' });
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
    await canvas.findByRole('button', { name: 'Expand Source' });
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('row', { name: /Source/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await canvas.findByRole('checkbox', { name: 'Select index.ts' });
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('row', { name: /index.ts/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('row', { name: /Source/ })).toHaveFocus();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all visible rows' }));
    await expect(
      within(grid)
        .getAllByRole('checkbox')
        .every((input) => (input as HTMLInputElement).checked),
    ).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Sort by Name' }));
    const names = within(grid)
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    await expect(names[0]).toContain('Archive');
    await expect(names[1]).toContain('Projects');
    await expect(names[2]).toContain('package.json');
    await expect(names[3]).toContain('Source');
    await expect(names[4]).toContain('cell.tsx');
  },
} satisfies Story;
export const Disabled = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
} satisfies Story;

export const CancellationAndCaching = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse Projects' }));
    await expect(canvas.queryByRole('button', { name: 'Expand Source' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
    await canvas.findByRole('button', { name: 'Expand Source' });
    await expect(canvas.getByLabelText('Child requests')).toHaveTextContent('2 requests');
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse Projects' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
    await expect(canvas.getByRole('button', { name: 'Expand Source' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Child requests')).toHaveTextContent('2 requests');
  },
} satisfies Story;
