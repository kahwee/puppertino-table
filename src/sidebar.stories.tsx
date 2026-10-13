import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent } from 'storybook/test';
import { tableRecipes } from '../.storybook/table-sources.js';
import { SidebarExample, type SidebarExampleProps } from '../demo/sidebar-example.js';
import { Sidebar, SidebarGroup, SidebarItem } from './index.js';

const meta = {
  title: 'Puppertino/Sidebar',
  component: Sidebar,
  subcomponents: { SidebarGroup, SidebarItem },
  args: {
    size: 'large',
    section: 'Projects',
    onSectionChange: fn(),
    'aria-label': 'Workspace sections',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['small', 'medium', 'large', 'touch'],
      description: 'Puppertino row metrics.',
      table: { category: 'Appearance', defaultValue: { summary: 'large' } },
    },
    section: {
      control: 'select',
      options: ['Projects', 'Archive', 'Downloads', 'Tagged project'],
      description: 'Example app selection, synchronized with row clicks.',
      table: { category: 'Example state' },
    },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    onSectionChange: { control: false, table: { category: 'Example events' } },
  },
  render: function Playground(args) {
    const [, updateArgs] = useArgs<SidebarExampleProps>();
    return (
      <SidebarExample
        {...args}
        onSectionChange={(section) => {
          args.onSectionChange(section);
          updateArgs({ section });
        }}
      />
    );
  },
  parameters: {
    controls: { include: ['size', 'section', 'aria-label'] },
    docs: {
      controls: { include: ['size', 'section', 'aria-label', 'onSectionChange'] },
      source: { language: 'tsx', type: 'code', code: tableRecipes.sidebar },
      description: {
        component:
          'Portable Puppertino sidebar with grouped headings, native buttons or links, trailing details and app-owned selection. Use the shared Theme toolbar. FinderSidebar composes the same public primitives.',
      },
    },
  },
} satisfies Meta<SidebarExampleProps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default = { name: 'Playground' } satisfies Story;
export const Touch = {
  tags: ['!dev', '!autodocs'],
  args: { size: 'touch' },
  play: async ({ canvas, args, step }) => {
    await step('Navigate and emit the app selection', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^Archive$/ }));
      await expect(canvas.getByRole('button', { name: /^Archive$/ })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(args.onSectionChange).toHaveBeenLastCalledWith('Archive');
    });
    await step('Keep disabled commands and native destinations accessible', async () => {
      await expect(canvas.getByRole('button', { name: 'Shared with me' })).toBeDisabled();
      await expect(canvas.getByRole('link', { name: 'Puppertino documentation' })).toHaveAttribute(
        'href',
        'https://puppertino.com/docs/mobile/sidebars/',
      );
    });
  },
} satisfies Story;
