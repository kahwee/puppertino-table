import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ResettableExample } from '../.storybook/resettable-example.js';
import { tableRecipes } from '../.storybook/table-sources.js';
import { SplitViewExample } from '../demo/split-view-example.js';

const meta = {
  title: 'Puppertino/Split view',
  component: SplitViewExample,
  args: {
    orientation: 'horizontal',
    resizable: true,
    disabled: false,
    container: 'fluid',
    activePaneId: 'sidebar',
    sidebarHidden: false,
    onActivePaneChange: fn(),
    onSidebarHiddenChange: fn(),
    onSizesCommit: fn(),
  },
  render: function Playground(args) {
    const [, updateArgs, resetArgs] = useArgs<typeof args>();
    return (
      <ResettableExample onReset={resetArgs}>
        <div style={{ width: args.container === 'compact' ? 390 : '100%', maxWidth: '100%' }}>
          <SplitViewExample
            {...args}
            onActivePaneChange={(activePaneId) => {
              args.onActivePaneChange?.(activePaneId);
              updateArgs({ activePaneId });
            }}
            onSidebarHiddenChange={(sidebarHidden) => {
              args.onSidebarHiddenChange?.(sidebarHidden);
              updateArgs({ sidebarHidden });
            }}
          />
        </div>
      </ResettableExample>
    );
  },
  argTypes: {
    container: {
      type: { name: 'enum', value: ['fluid', 'compact'] },
      control: 'inline-radio',
      options: ['fluid', 'compact'],
      description: 'Constrain the host to 390px to explore compact navigation.',
      table: { category: 'Layout' },
    },
    activePaneId: {
      type: { name: 'enum', value: ['sidebar', 'content', 'detail'] },
      control: 'inline-radio',
      options: ['sidebar', 'content', 'detail'],
      description: 'Active compact pane, synchronized with the app navigation.',
      table: { category: 'Example state' },
    },
    sidebarHidden: {
      type: 'boolean',
      control: 'boolean',
      description: 'Hide or restore the sidebar without discarding completed widths.',
      table: { category: 'Example state' },
    },
    onActivePaneChange: { control: false, table: { category: 'Events' } },
    onSidebarHiddenChange: { control: false, table: { category: 'Events' } },
    onSizesCommit: { control: false, table: { category: 'Events' } },
    orientation: {
      type: { name: 'enum', value: ['horizontal', 'vertical'] },
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'Layout', defaultValue: { summary: 'horizontal' } },
    },
    resizable: {
      type: 'boolean',
      control: 'boolean',
      table: { category: 'Sizing', defaultValue: { summary: 'true' } },
    },
    disabled: {
      type: 'boolean',
      control: 'boolean',
      if: { arg: 'resizable' },
      table: { category: 'Sizing', defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    docs: {
      source: { language: 'tsx', type: 'code', code: tableRecipes.split },
      description: {
        component:
          'Adjacent panes with thin dividers, clamped sizes, pointer/keyboard resizing, completion-only persistence, hidden panes and compact navigation. App toolbar buttons restore panes and choose the active compact pane.',
      },
    },
  },
} satisfies Meta<Parameters<typeof SplitViewExample>[0] & { container: 'fluid' | 'compact' }>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default = { name: 'Playground' } satisfies Story;

export const Vertical = {
  tags: ['!dev', '!autodocs'],
  args: { orientation: 'vertical' },
  play: async ({ canvas, args, step }) => {
    await step('Commit a keyboard resize on the vertical axis', async () => {
      await userEvent.click(canvas.getByRole('separator', { name: 'Resize Sidebar pane' }));
      await userEvent.keyboard('{ArrowDown}');
      await expect(canvas.getByLabelText('Committed pane sizes')).toHaveTextContent('216');
      await expect(args.onSizesCommit).toHaveBeenLastCalledWith(
        expect.objectContaining({ sidebar: 216 }),
      );
    });
    await step('Hide and restore the same pane', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Hide sidebar' }));
      await expect(canvas.queryByRole('region', { name: 'Sidebar' })).toBeNull();
      await expect(args.onSidebarHiddenChange).toHaveBeenLastCalledWith(true);
      await userEvent.click(canvas.getByRole('button', { name: 'Sidebar' }));
      await expect(canvas.getByRole('region', { name: 'Sidebar' })).toBeInTheDocument();
    });
  },
} satisfies Story;

export const Compact = {
  tags: ['!dev', '!autodocs'],
  args: { container: 'compact' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Sidebar' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Detail' }));
    await expect(canvas.getByRole('region', { name: 'Detail' })).toBeVisible();
    await expect(canvas.queryByRole('region', { name: 'Sidebar' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Sidebar' }));
  },
} satisfies Story;
