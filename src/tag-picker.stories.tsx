import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TagPicker } from './index.js';

const meta = {
  title: 'Puppertino/Tag picker',
  component: TagPicker,
  parameters: { layout: 'centered' },
  args: {
    onValueChange: fn(),
    onCreate: fn(),
    options: [
      { id: 'review', label: 'Review' },
      { id: 'work', label: 'Work' },
      { id: 'alpine', label: 'Project Alpine' },
    ],
    value: ['review'],
    mixedValue: [],
    disabled: false,
    title: 'Assign tags',
  },
  argTypes: {
    options: {
      control: 'object',
      description: 'Stable IDs and display labels; disabled options cannot be changed.',
    },
    value: { control: 'object', description: 'Controlled IDs assigned to every selected item.' },
    mixedValue: {
      control: 'object',
      description: 'IDs assigned to some selected items. Choosing one assigns it to all.',
    },
    disabled: { control: 'boolean' },
    title: { control: 'text' },
    trigger: { control: false },
    triggerClassName: { control: 'text' },
    onValueChange: {
      control: false,
      description: 'Emits assigned IDs; the story synchronizes them with Controls.',
      table: { category: 'Events' },
    },
    onCreate: {
      control: false,
      description: 'Optional creation callback. Omit to restrict selection to existing tags.',
      table: { category: 'Events' },
    },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return (
      <TagPicker
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value);
          updateArgs({ value, mixedValue: args.mixedValue?.filter((id) => !value.includes(id)) });
        }}
        onCreate={
          args.onCreate
            ? (label) => {
                args.onCreate?.(label);
                updateArgs({
                  options: [...args.options, { id: label, label }],
                  value: [...args.value, label],
                });
              }
            : undefined
        }
      />
    );
  },
} satisfies Meta<typeof TagPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Assigned: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('dialog')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    const input = canvas.getByRole('combobox', { name: 'Tag name' });
    await userEvent.type(input, 'review');
    await expect(canvas.queryByRole('option', { name: /Create tag/ })).toBeNull();
    await userEvent.clear(input);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByRole('button', { name: 'Remove tag Work' })).toBeVisible();
    await userEvent.keyboard('{Backspace}');
    await expect(canvas.getByRole('button', { name: 'Remove tag Work' })).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    await expect(canvas.queryByRole('button', { name: 'Remove tag Work' })).toBeNull();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Tags' })).toHaveFocus();
  },
};
export const MixedSelection: Story = {
  args: { value: [], mixedValue: ['work'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Work Some items' }));
    await expect(canvas.getByRole('button', { name: 'Remove tag Work' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove tag Work' }));
    await expect(canvas.getByRole('option', { name: /^Work$/ })).toBeVisible();
    await expect(canvas.queryByText('Some items')).toBeNull();
    await userEvent.keyboard('{Escape}');
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const LongLabels: Story = {
  args: {
    options: [
      { id: 'long', label: 'A very long project name that wraps without widening the popover' },
      ...meta.args.options,
    ],
    value: ['long'],
  },
};

export const DisabledTags: Story = {
  args: {
    options: [
      { id: 'locked', label: 'Locked', disabled: true },
      { id: 'unavailable', label: 'Unavailable', disabled: true },
      { id: 'work', label: 'Work' },
    ],
    value: ['locked'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    await expect(canvas.getByRole('button', { name: 'Remove tag Locked' })).toBeDisabled();
    await expect(canvas.getByRole('option', { name: 'Unavailable' })).toBeDisabled();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByRole('button', { name: 'Remove tag Work' })).toBeVisible();
  },
};

export const ClippedContainer: Story = {
  args: {
    options: Array.from({ length: 30 }, (_, index) => ({
      id: String(index),
      label: `Project ${index + 1}`,
    })),
    value: [],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 8,
          width: 80,
          height: 34,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    const dialog = canvas.getByRole('dialog', { name: 'Assign tags' });
    await expect(dialog).toBeVisible();
    await expect(dialog.matches(':popover-open')).toBe(true);
    const bounds = dialog.getBoundingClientRect();
    await expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(bounds.top).toBeGreaterThanOrEqual(0);
    await expect(dialog.getAttribute('data-p-popover-place')).toBe('top');
  },
};

export const ExistingTagsOnly: Story = {
  args: { value: [], onCreate: undefined },
  parameters: {
    docs: {
      description: { story: 'Omit onCreate to offer only your application’s existing tags.' },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    const input = canvas.getByRole('combobox', { name: 'Tag name' });
    await userEvent.type(input, 'Client');
    await expect(canvas.queryByRole('option', { name: /Create tag/ })).toBeNull();
    await expect(canvas.getByText('No matching tags')).toBeVisible();
    await userEvent.clear(input);
    await userEvent.click(canvas.getByRole('option', { name: 'Work' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['work']);
    await userEvent.keyboard('{Escape}');
  },
};

export const CreateTag: Story = {
  args: { value: [] },
  parameters: {
    docs: {
      description: {
        story:
          'The application creates the option and assigns it. Watch options and value update in Controls, and the callback in Actions.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    await userEvent.type(canvas.getByRole('combobox', { name: 'Tag name' }), 'Client');
    await userEvent.click(canvas.getByRole('option', { name: 'Create tag “Client”' }));
    await expect(args.onCreate).toHaveBeenLastCalledWith('Client');
    await expect(canvas.getByRole('button', { name: 'Remove tag Client' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};
