import { ArchiveIcon, DownloadSimpleIcon, FolderIcon, TagIcon } from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Sidebar, SidebarGroup, SidebarItem, type SidebarProps } from './index.js';

function Example(props: SidebarProps) {
  const [location, setLocation] = useState('Projects');
  return (
    <main style={{ maxWidth: 720, margin: '24px auto' }}>
      <h1 style={{ fontSize: 20 }}>Workspace</h1>
      <div style={{ display: 'flex', minWidth: 0, borderRadius: 14, overflow: 'hidden' }}>
        <Sidebar {...props} style={{ maxWidth: '55%', height: 340, ...props.style }}>
          <SidebarGroup label="Favorites">
            <SidebarItem
              selected={location === 'Projects'}
              detail={12}
              icon={<FolderIcon />}
              onClick={() => setLocation('Projects')}
            >
              Projects
            </SidebarItem>
            <SidebarItem
              selected={location === 'Archive'}
              icon={<ArchiveIcon />}
              onClick={() => setLocation('Archive')}
            >
              Archive
            </SidebarItem>
            <SidebarItem
              selected={location === 'Downloads'}
              icon={<DownloadSimpleIcon />}
              onClick={() => setLocation('Downloads')}
            >
              Downloads
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Tags">
            <SidebarItem
              icon={<TagIcon />}
              iconTone="secondary"
              onClick={() => setLocation('Long project label')}
            >
              A long project label that stays inside the sidebar
            </SidebarItem>
            <SidebarItem icon={<FolderIcon />} disabled>
              Shared with me
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Resources">
            <SidebarItem href="https://puppertino.com/docs/mobile/sidebars/">
              Puppertino documentation
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
        <section aria-label="Current section" style={{ flex: 1, minWidth: 0, padding: 20 }}>
          <h2 style={{ fontSize: 18, overflowWrap: 'anywhere' }}>{location}</h2>
          <p style={{ lineHeight: 1.6 }}>
            Your application owns the content, routes and selection.
          </p>
        </section>
      </div>
    </main>
  );
}
const meta = {
  title: 'Puppertino/Sidebar',
  component: Sidebar,
  args: { size: 'large', 'aria-label': 'Workspace sections' },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'medium', 'large', 'touch'] } },
  render: (args) => <Example {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'Portable Puppertino sidebar with grouped headings, native buttons or links, trailing details and app-owned selection. Use the shared Theme toolbar. FinderSidebar composes the same public primitives.',
      },
    },
  },
} satisfies Meta<SidebarProps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default = {
  name: 'Playground',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Archive$/ }));
    await expect(canvas.getByRole('button', { name: /^Archive$/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('button', { name: 'Shared with me' })).toBeDisabled();
    await expect(canvas.getByRole('link', { name: 'Puppertino documentation' })).toHaveAttribute(
      'href',
      'https://puppertino.com/docs/mobile/sidebars/',
    );
  },
} satisfies Story;
export const Touch = { args: { size: 'touch' } } satisfies Story;
