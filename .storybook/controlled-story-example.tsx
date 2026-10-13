import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent } from 'storybook/test';
import { TagPicker } from '../src/index.js';

const meta = {
  title: 'App/Document tags',
  component: TagPicker,
  args: {
    options: [{ id: 'review', label: 'Review' }],
    value: [],
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    value: { control: 'object', table: { category: 'State' } },
    disabled: { control: 'boolean', table: { category: 'Behavior' } },
    onValueChange: { control: false, table: { category: 'Events' } },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <TagPicker
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value); // Keep the callback visible in Actions.
          updateArgs({ value }); // Keep the canvas and Controls synchronized.
        }}
      />
    );
  },
} satisfies Meta<typeof TagPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground = {} satisfies Story;

// A fixed regression scenario uses the same render function and typed args.
export const Assignment = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, args, step }) => {
    await step('Assign an existing tag', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
      await userEvent.click(canvas.getByRole('option', { name: 'Review' }));
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['review']);
      await expect(canvas.getByRole('button', { name: 'Remove tag Review' })).toBeVisible();
    });
  },
} satisfies Story;
