import { ArchiveIcon, DownloadSimpleIcon, FolderIcon, TagIcon } from '@phosphor-icons/react';
import { Sidebar, SidebarGroup, SidebarItem, type SidebarProps } from '../src/index.js';

export type SidebarSection = 'Projects' | 'Archive' | 'Downloads' | 'Tagged project';
export interface SidebarExampleProps extends SidebarProps {
  section: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}
export function SidebarExample({
  section: location,
  onSectionChange: setLocation,
  ...props
}: SidebarExampleProps) {
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
              onClick={() => setLocation('Tagged project')}
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
