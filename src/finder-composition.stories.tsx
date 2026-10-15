import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ResettableExample } from '../.storybook/resettable-example.js';
import { shortWorkspaceRecipe } from '../.storybook/workspace-recipe.js';
import { Composition, type CompositionProps } from '../demo/document-workspace-example.js';
import { finderViews } from './index.js';

const meta = {
  title: 'Puppertino/Finder composition',
  component: Composition,
  args: {
    dataPreset: 'standard',
    view: 'list',
    query: '',
    section: 'Documents',
    activePaneId: 'content',
    previewHidden: false,
    artwork: 'symbol',
    onViewChange: fn(),
    onQueryChange: fn(),
    onSectionChange: fn(),
    onActivePaneChange: fn(),
    onPreviewHiddenChange: fn(),
    onDocumentAction: fn(),
    onSizesCommit: fn(),
  },
  argTypes: {
    dataPreset: {
      control: {
        type: 'select',
        labels: {
          standard: 'Standard',
          empty: 'Empty',
          longNames: 'Long filenames',
          large: '250 documents',
          readOnly: 'Read-only record',
        },
      },
      options: ['standard', 'empty', 'longNames', 'large', 'readOnly'],
      description: 'Changing data starts a fresh workspace. View and search remain configurable.',
      table: { category: 'Example data' },
    },
    section: {
      control: 'inline-radio',
      options: ['Documents', 'Archive'],
      table: { category: 'Example state' },
    },
    activePaneId: {
      control: 'inline-radio',
      options: ['sidebar', 'content', 'detail'],
      table: { category: 'Layout' },
    },
    previewHidden: { control: 'boolean', table: { category: 'Layout' } },
    artwork: {
      control: 'inline-radio',
      options: ['symbol', 'thumbnail'],
      description: 'App-owned artwork slot, shared by the collection and preview.',
      table: { category: 'Appearance' },
    },
    onSectionChange: { control: false },
    onActivePaneChange: { control: false },
    onPreviewHiddenChange: { control: false },
    onDocumentAction: { control: false, table: { category: 'Events' } },
    onSizesCommit: { control: false, table: { category: 'Events' } },
    view: {
      control: 'inline-radio',
      options: [...finderViews],
      description:
        'Live view, synchronized with the Finder toolbar. Preserves documents and selection.',
      table: { category: 'State' },
    },
    query: {
      control: 'text',
      description: 'Live filename filter, synchronized with Finder search.',
      table: { category: 'State' },
    },
    onViewChange: {
      control: false,
      description: 'Emits the view selected in the toolbar.',
      table: { category: 'Events' },
    },
    onQueryChange: {
      control: false,
      description: 'Emits search edits and folder navigation resets.',
      table: { category: 'Events' },
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      source: {
        language: 'tsx',
        type: 'dynamic',
        transform: (_code: string, context: { args: CompositionProps }) =>
          shortWorkspaceRecipe(context.args),
      },
      description: {
        component:
          'Build your own Finder from exported primitives. All data, selection and commands belong to the consuming application; icons and previews are slots. The complete Finder example uses these same primitives.',
      },
    },
  },
  render: function Controlled(args) {
    const [, updateArgs, resetArgs] = useArgs<typeof args>();
    return (
      <ResettableExample onReset={resetArgs}>
        <Composition
          key={args.dataPreset}
          {...args}
          onSectionChange={(section) => {
            args.onSectionChange(section);
            updateArgs({ section });
          }}
          onActivePaneChange={(activePaneId) => {
            args.onActivePaneChange(activePaneId);
            updateArgs({ activePaneId });
          }}
          onPreviewHiddenChange={(previewHidden) => {
            args.onPreviewHiddenChange(previewHidden);
            updateArgs({ previewHidden });
          }}
          onViewChange={(view) => {
            args.onViewChange(view);
            updateArgs({ view });
          }}
          onQueryChange={(query) => {
            args.onQueryChange(query);
            updateArgs({ query });
          }}
        />
      </ResettableExample>
    );
  },
} satisfies Meta<typeof Composition>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Composed: Story = { name: 'Playground' };

export const TagAndTrashWorkflow: Story = {
  name: 'Organize a document',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Select a document, assign a tag, change its view, move it to Trash and undo. Named Interactions steps show each expected result; Reset example restores the workspace.',
      },
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Select Brief.pdf and assign the Review tag', async () => {
      await userEvent.click(canvas.getByRole('row', { name: /Brief.pdf/ }));
      await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
      await userEvent.click(canvas.getByRole('option', { name: 'Review' }));
      await expect(canvas.getByRole('button', { name: 'Remove tag Review' })).toBeVisible();
      await userEvent.keyboard('{Escape}');
    });
    await step('Switch views while preserving the selected document', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Icons' }));
      await expect(canvas.getByRole('button', { name: 'Brief.pdf' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await waitFor(() => expect(args.onViewChange).toHaveBeenLastCalledWith('icons'));
    });
    await step('Move to Trash, then undo the same operation', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
      await userEvent.click(canvas.getByRole('menuitem', { name: 'Move to Trash' }));
      await expect(canvas.queryByRole('button', { name: 'Brief.pdf' })).toBeNull();
      await expect(canvas.getByLabelText('Document count')).toHaveTextContent('1 item');
      await expect(args.onDocumentAction).toHaveBeenLastCalledWith('trash', ['brief']);
      await userEvent.click(canvas.getByRole('button', { name: 'Undo Trash' }));
      await expect(canvas.findByRole('button', { name: 'Brief.pdf' })).resolves.toBeVisible();
      await expect(args.onDocumentAction).toHaveBeenLastCalledWith('undo', ['brief']);
    });
    await step('Reset data and Controls together', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset example' }));
      await expect(canvas.findByRole('row', { name: /Brief.pdf/ })).resolves.toBeVisible();
      await expect(canvas.getByLabelText('Document count')).toHaveTextContent('2 items');
      await expect(canvas.getByRole('button', { name: 'Undo Trash' })).toBeDisabled();
    });
  },
};
