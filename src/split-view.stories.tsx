import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tableRecipes } from '../.storybook/table-sources.js';
import { SplitViewExample } from '../demo/split-view-example.js';

const meta = {
  title: 'Puppertino/Split view',
  component: SplitViewExample,
  args: { orientation: 'horizontal' },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  parameters: {
    docs: {
      source: { language: 'tsx', type: 'code', code: tableRecipes.split },
      description: {
        component:
          'Adjacent panes with thin dividers, clamped sizes, pointer/keyboard resizing, completion-only persistence, hidden panes and compact navigation. App toolbar buttons restore panes and choose the active compact pane.',
      },
    },
  },
} satisfies Meta<typeof SplitViewExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const divider = canvas.getByRole('separator', { name: 'Resize Sidebar pane' });
    await userEvent.click(divider);
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByLabelText('Committed pane sizes')).toHaveTextContent('216');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide sidebar' }));
    await expect(canvas.queryByRole('region', { name: 'Sidebar' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Sidebar' }));
    await expect(canvas.getByRole('region', { name: 'Sidebar' })).toBeInTheDocument();
  },
} satisfies Story;
export const Vertical = { args: { orientation: 'vertical' } } satisfies Story;

export const Compact = {
  decorators: [
    (Story) => (
      <div style={{ width: 390, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Sidebar' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Detail' }));
    await expect(canvas.getByRole('region', { name: 'Detail' })).toBeVisible();
    await expect(canvas.queryByRole('region', { name: 'Sidebar' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Sidebar' }));
  },
} satisfies Story;
