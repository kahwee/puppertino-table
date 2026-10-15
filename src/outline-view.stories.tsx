import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { outlinePlaygroundSource } from '../.storybook/playground-source.js';
import { ResettableExample } from '../.storybook/resettable-example.js';
import { tableRecipes } from '../.storybook/table-sources.js';
import { OutlineViewExample, type OutlineViewExampleProps } from '../demo/outline-view-example.js';

/** Commit disclosure immediately; Storybook broadcasts the same args asynchronously. */
function OutlinePlayground(props: OutlineViewExampleProps) {
  const [expanded, setExpanded] = useState(props.expanded);
  useLayoutEffect(() => setExpanded(props.expanded), [props.expanded]);
  return (
    <OutlineViewExample
      {...props}
      expanded={expanded}
      onExpandedChange={(next) => {
        setExpanded(next);
        props.onExpandedChange?.(next);
      }}
    />
  );
}

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
    loadingDelay: 600,
    simulateError: true,
    foldersSelectable: true,
    expanded: {},
    rowSelection: {},
    onExpandedChange: fn(),
    onRowSelectionChange: fn(),
  },
  render: function Playground(args) {
    const [, updateArgs, resetArgs] = useArgs<typeof args>();
    return (
      <ResettableExample onReset={resetArgs}>
        <OutlinePlayground
          {...args}
          onExpandedChange={(expanded) => {
            args.onExpandedChange?.(expanded);
            updateArgs({ expanded });
          }}
          onRowSelectionChange={(updater) => {
            const rowSelection =
              typeof updater === 'function' ? updater(args.rowSelection ?? {}) : updater;
            args.onRowSelectionChange?.(rowSelection);
            updateArgs({ rowSelection });
          }}
        />
      </ResettableExample>
    );
  },
  argTypes: {
    loadingDelay: {
      type: 'number',
      control: { type: 'range', min: 0, max: 2000, step: 100 },
      description: 'Fictional API delay in milliseconds; change before expanding a new branch.',
      table: { category: 'Loading scenario' },
    },
    simulateError: {
      type: 'boolean',
      control: 'boolean',
      description: 'Archive fails its first request, then succeeds on retry.',
      table: { category: 'Loading scenario' },
    },
    foldersSelectable: {
      type: 'boolean',
      control: 'boolean',
      if: { arg: 'selectable' },
      description: 'Allow groups to select, or keep selection to document leaves.',
      table: { category: 'Selection' },
    },
    expanded: {
      type: { name: 'object', value: {} },
      control: 'object',
      description: 'Controlled disclosure keyed by stable IDs.',
      table: { category: 'Example state' },
    },
    rowSelection: {
      type: { name: 'object', value: {} },
      control: 'object',
      description: 'Controlled selected IDs; hidden selections remain stored.',
      if: { arg: 'selectable' },
      table: { category: 'Example state' },
    },
    onExpandedChange: { control: false, table: { category: 'Events' } },
    onRowSelectionChange: { control: false, table: { category: 'Events' } },
    disabled: { type: 'boolean', control: 'boolean', table: { category: 'Behavior' } },
    selectable: { type: 'boolean', control: 'boolean', table: { category: 'Selection' } },
    selectionCheckboxes: {
      type: 'boolean',
      control: 'boolean',
      if: { arg: 'selectable' },
      table: { category: 'Selection' },
    },
    density: {
      type: { name: 'enum', value: ['native', 'compact', 'comfortable'] },
      control: 'inline-radio',
      options: ['native', 'compact', 'comfortable'],
      table: { category: 'Appearance' },
    },
    resizable: { type: 'boolean', control: 'boolean', table: { category: 'Sizing' } },
    manualSorting: {
      type: 'boolean',
      control: 'boolean',
      description: 'Enable for server-owned sibling order.',
      table: { category: 'Sorting', defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    docs: {
      source: {
        language: 'tsx',
        type: 'dynamic',
        transform: (_code: string, context: { args: OutlineViewExampleProps }) =>
          outlinePlaygroundSource(tableRecipes.outline, context.args),
      },
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
  name: 'Lazy loading workflow',
  args: { loadingDelay: 600, simulateError: true },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Replay the named Interactions steps to inspect loading, one failed request and retry. Change the same loading scenario in Playground Controls.',
      },
    },
  },
  play: async ({ canvas, args, step }) => {
    await step('Load Projects and report controlled disclosure', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
      await expect(canvas.getByText('Loading…')).toHaveTextContent('Loading');
      await expect(
        canvas.findByRole('button', { name: 'Expand Source' }),
      ).resolves.toBeInTheDocument();
      await expect(args.onExpandedChange).toHaveBeenCalledWith(
        expect.objectContaining({ projects: true }),
      );
    });
    await step('Show an app-owned failure on Archive', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Expand Archive' }));
      await expect(
        canvas.findByRole('button', { name: 'Retry Archive' }),
      ).resolves.toBeInTheDocument();
    });
    await step('Retry the same branch successfully', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Retry Archive' }));
      await expect(
        canvas.findByRole('checkbox', { name: 'Select Meeting notes.txt' }),
      ).resolves.toBeInTheDocument();
    });
  },
} satisfies Story;

export const KeyboardAndSelection = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('treegrid', { name: 'Document hierarchy' });
    await step('Expand and navigate the hierarchy', async () => {
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
    });
    await step('Select every visible eligible row', async () => {
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all visible rows' }));
      await expect(
        within(grid)
          .getAllByRole('checkbox')
          .every((input) => (input as HTMLInputElement).checked),
      ).toBe(true);
    });
    await step('Sort siblings while preserving their hierarchy', async () => {
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
    });
  },
} satisfies Story;
export const Disabled = {
  tags: ['!dev', '!autodocs'],
  args: { disabled: true },
} satisfies Story;

export const CancellationAndCaching = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Cancel an unfinished request', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Collapse Projects' }));
      await expect(canvas.queryByRole('button', { name: 'Expand Source' })).toBeNull();
    });
    await step('Retry and cache the completed result', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
      await canvas.findByRole('button', { name: 'Expand Source' });
      await expect(canvas.getByLabelText('Child requests')).toHaveTextContent('2 requests');
    });
    await step('Reopen without another request', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Collapse Projects' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Expand Projects' }));
      await expect(canvas.getByRole('button', { name: 'Expand Source' })).toBeInTheDocument();
      await expect(canvas.getByLabelText('Child requests')).toHaveTextContent('2 requests');
    });
  },
} satisfies Story;
