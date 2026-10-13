import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ResettableExample } from '../.storybook/resettable-example.js';
import { tagPickerRecipe } from '../.storybook/tag-picker-recipe.js';
import { type TagOption, TagPicker, type TagPickerProps } from './index.js';

const standardOptions: TagOption[] = [
  { id: 'review', label: 'Review' },
  { id: 'work', label: 'Work' },
  { id: 'alpine', label: 'Project Alpine' },
];
interface PickerExampleProps extends TagPickerProps {
  optionSet: 'standard' | 'longLabels' | 'disabledTags' | 'custom';
  allowCreation: boolean;
}
function PickerExample({
  optionSet,
  allowCreation,
  options,
  onCreate,
  ...props
}: PickerExampleProps) {
  const [created, setCreated] = useState<TagOption[]>([]);
  const base =
    optionSet === 'custom'
      ? options
      : optionSet === 'longLabels'
        ? standardOptions.map((option) =>
            option.id === 'review'
              ? {
                  ...option,
                  label: 'A very long project name that wraps without widening the popover',
                }
              : option,
          )
        : optionSet === 'disabledTags'
          ? standardOptions.map((option) => ({ ...option, disabled: option.id !== 'alpine' }))
          : standardOptions;
  return (
    <TagPicker
      {...props}
      options={[
        ...base,
        ...created.filter((option) => !base.some((item) => item.id === option.id)),
      ]}
      onCreate={
        allowCreation && onCreate
          ? (label) => {
              setCreated((previous) => [...previous, { id: label, label }]);
              onCreate(label);
            }
          : undefined
      }
    />
  );
}
const meta = {
  title: 'Puppertino/Tag picker',
  component: PickerExample,
  parameters: {
    layout: 'centered',
    docs: {
      source: { type: 'code', language: 'tsx', code: tagPickerRecipe },
      description: {
        component:
          'Controlled tag assignment with token navigation, mixed state, native popover placement and optional app-owned creation. Use optionSet and allowCreation for variants in this Playground.',
      },
    },
  },
  args: {
    optionSet: 'standard',
    allowCreation: true,
    onValueChange: fn(),
    onCreate: fn(),
    options: standardOptions,
    value: ['review'],
    mixedValue: [],
    disabled: false,
    title: 'Assign tags',
  },
  argTypes: {
    optionSet: {
      control: {
        type: 'select',
        labels: {
          standard: 'Standard',
          longLabels: 'Long labels',
          disabledTags: 'Disabled tags',
          custom: 'Custom',
        },
      },
      options: ['standard', 'longLabels', 'disabledTags', 'custom'],
      description: 'Compare option data in one playground. Stable IDs preserve current selections.',
      table: { category: 'Example data' },
    },
    allowCreation: {
      control: 'boolean',
      description: 'Offer new-tag creation or existing tags only.',
      table: { category: 'Behavior' },
    },
    options: {
      control: 'object',
      if: { arg: 'optionSet', eq: 'custom' },
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
    const [, updateArgs, resetArgs] = useArgs<typeof args>();
    return (
      <ResettableExample onReset={resetArgs}>
        <PickerExample
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
                    options: [...(args.options ?? standardOptions), { id: label, label }],
                    value: [...args.value, label],
                  });
                }
              : undefined
          }
        />
      </ResettableExample>
    );
  },
} satisfies Meta<typeof PickerExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Assigned: Story = { name: 'Playground' };
export const KeyboardWorkflow: Story = {
  tags: ['!dev', '!autodocs'],
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
export const ClippedContainer: Story = {
  tags: ['!dev', '!autodocs'],
  args: {
    optionSet: 'custom',
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

export const CreateTag: Story = {
  tags: ['!dev', '!autodocs'],
  args: { value: [] },
  parameters: {
    docs: {
      description: {
        story:
          'The application creates the option and assigns it. Watch options and value update in Controls, and the callback in Actions.',
      },
    },
  },
  play: async ({ canvas, args, step }) => {
    await step('Create an app-owned option and assign its ID', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
      await userEvent.type(canvas.getByRole('combobox', { name: 'Tag name' }), 'Client');
      await userEvent.click(canvas.getByRole('option', { name: 'Create tag “Client”' }));
      await expect(args.onCreate).toHaveBeenLastCalledWith('Client');
      await expect(await canvas.findByRole('button', { name: 'Remove tag Client' })).toBeVisible();
    });
    await step('Dismiss and restore the trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(canvas.getByRole('button', { name: 'Tags' })).toHaveFocus();
    });
  },
};
