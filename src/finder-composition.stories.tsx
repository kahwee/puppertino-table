import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Columns3,
  Ellipsis,
  FileText,
  Folder,
  GalleryThumbnails,
  Grid2X2,
  List,
  Search,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import { useArgs } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  ColumnBrowser,
  ColumnBrowserItem,
  createPuppertinoColumnHelper,
  FinderActions,
  FinderBody,
  FinderContent,
  FinderFilmstrip,
  FinderGallery,
  FinderGalleryItem,
  FinderIconGrid,
  FinderIconItem,
  FinderPathBar,
  FinderPreview,
  FinderSearch,
  FinderSidebar,
  FinderSidebarGroup,
  FinderSidebarItem,
  FinderStatusBar,
  FinderTitle,
  FinderToolbar,
  FinderToolbarGroup,
  type FinderView,
  FinderViewSwitcher,
  FinderWindow,
  PuppertinoTable,
  TagPicker,
} from './index.js';

interface Document {
  id: string;
  name: string;
}
const helper = createPuppertinoColumnHelper<Document>();
const columns = helper.columns([helper.accessor('name', { header: 'Name', size: 340 })]);
interface CompositionProps {
  view: FinderView;
  query: string;
  onViewChange(value: FinderView): void;
  onQueryChange(value: string): void;
}
/** Consumer-owned data and behavior, using only public library imports. */
function Composition({ view, query, onViewChange, onQueryChange }: CompositionProps) {
  const [documents, setDocuments] = useState<Document[]>([
    { id: 'brief', name: 'Brief.pdf' },
    { id: 'notes', name: 'Notes.md' },
  ]);
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const visible = documents.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const chosen = visible.filter((item) => selected[item.id]);
  const active = chosen[0];
  const choose = (id: string) => setSelected({ [id]: true });
  const preview = (
    <FinderPreview
      artwork={<FileText size={72} strokeWidth={1} aria-hidden="true" />}
      heading={active?.name ?? 'Select a document'}
      description="Your application supplies previews."
    />
  );
  return (
    <FinderWindow aria-label="Composed document browser">
      <FinderToolbar>
        <FinderTitle>Documents</FinderTitle>
        <FinderViewSwitcher
          value={view}
          onValueChange={onViewChange}
          icons={{
            icons: <Grid2X2 strokeWidth={1.5} aria-hidden="true" />,
            list: <List strokeWidth={1.5} aria-hidden="true" />,
            columns: <Columns3 strokeWidth={1.5} aria-hidden="true" />,
            gallery: <GalleryThumbnails strokeWidth={1.5} aria-hidden="true" />,
          }}
        />
        <FinderToolbarGroup aria-label="Document commands">
          <TagPicker
            options={[
              { id: 'review', label: 'Review' },
              { id: 'work', label: 'Work' },
            ]}
            value={active ? (tags[active.id] ?? []) : []}
            onValueChange={(value) => {
              if (active) setTags((previous) => ({ ...previous, [active.id]: value }));
            }}
            disabled={chosen.length !== 1}
            trigger={<Tag strokeWidth={1.5} aria-hidden="true" />}
            triggerClassName="p-toolbar-btn"
          />
          <FinderActions
            icon={<Ellipsis strokeWidth={1.5} aria-hidden="true" />}
            actions={[
              {
                id: 'trash',
                label: 'Move to Trash',
                disabled: !active,
                onSelect: () => {
                  setDocuments((items) =>
                    items.filter((item) => !chosen.some((target) => target.id === item.id)),
                  );
                  setSelected({});
                },
              },
            ]}
          />
        </FinderToolbarGroup>
        <FinderSearch
          value={query}
          onValueChange={(value) => {
            setSelected({});
            onQueryChange(value);
          }}
          icon={<Search strokeWidth={1.5} aria-hidden="true" />}
        />
      </FinderToolbar>
      <FinderBody density="comfortable">
        <FinderSidebar aria-label="Document locations">
          <FinderSidebarGroup label="Favorites">
            <FinderSidebarItem
              selected
              icon={<Folder strokeWidth={1.5} aria-hidden="true" />}
              onClick={() => onQueryChange('')}
            >
              Documents
            </FinderSidebarItem>
          </FinderSidebarGroup>
        </FinderSidebar>
        <FinderContent>
          {view === 'list' ? (
            <PuppertinoTable
              data={visible}
              columns={columns}
              getRowId={(item) => item.id}
              ariaLabel="Documents"
              selectable
              selectionCheckboxes={false}
              rowSelection={selected}
              onRowSelectionChange={setSelected}
              getRowProps={(row) => ({ onClick: () => choose(row.id) })}
            />
          ) : view === 'icons' ? (
            <FinderIconGrid aria-label="Document icons">
              {visible.map((item) => (
                <FinderIconItem
                  key={item.id}
                  selected={selected[item.id]}
                  artwork={<FileText strokeWidth={1} />}
                  onClick={() => choose(item.id)}
                >
                  {item.name}
                </FinderIconItem>
              ))}
            </FinderIconGrid>
          ) : view === 'columns' ? (
            <ColumnBrowser
              ariaLabel="Document columns"
              panels={[
                {
                  id: 'files',
                  label: 'Documents',
                  content: visible.map((item) => (
                    <ColumnBrowserItem
                      key={item.id}
                      selected={selected[item.id]}
                      onClick={() => choose(item.id)}
                    >
                      {item.name}
                    </ColumnBrowserItem>
                  )),
                },
                { id: 'preview', label: 'Preview', content: preview },
              ]}
            />
          ) : (
            <FinderGallery aria-label="Document gallery">
              {preview}
              <FinderFilmstrip aria-label="Documents">
                {visible.map((item) => (
                  <FinderGalleryItem
                    key={item.id}
                    aria-label={item.name}
                    selected={selected[item.id]}
                    onClick={() => choose(item.id)}
                  >
                    <FileText aria-hidden="true" />
                  </FinderGalleryItem>
                ))}
              </FinderFilmstrip>
            </FinderGallery>
          )}
        </FinderContent>
      </FinderBody>
      <FinderPathBar>
        <Folder size={14} aria-hidden="true" />
        <span>Documents</span>
      </FinderPathBar>
      <FinderStatusBar>
        <output aria-label="Document count">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </output>
      </FinderStatusBar>
    </FinderWindow>
  );
}
const meta = {
  title: 'Puppertino/Finder composition',
  component: Composition,
  args: { view: 'list', query: '' },
  argTypes: {
    view: { control: 'inline-radio', options: ['icons', 'list', 'columns', 'gallery'] },
    query: { control: 'text' },
    onViewChange: { control: false },
    onQueryChange: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Build your own Finder from exported primitives. All data, selection and commands belong to the consuming application; icons and previews are slots. The complete Finder example uses these same primitives.',
      },
    },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return (
      <Composition
        {...args}
        onViewChange={(view) => updateArgs({ view })}
        onQueryChange={(query) => updateArgs({ query })}
      />
    );
  },
} satisfies Meta<typeof Composition>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Composed: Story = {
  args: { onViewChange: () => {}, onQueryChange: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /Brief.pdf/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Review' }));
    await expect(canvas.getByRole('button', { name: 'Remove tag Review' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Icons' }));
    await expect(canvas.getByRole('button', { name: 'Brief.pdf' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Move to Trash' }));
    await expect(canvas.queryByRole('button', { name: 'Brief.pdf' })).toBeNull();
    await expect(canvas.getByLabelText('Document count')).toHaveTextContent('1 item');
  },
};
export const DarkGallery: Story = {
  globals: { theme: 'dark' },
  args: { view: 'gallery', onViewChange: () => {}, onQueryChange: () => {} },
};

export const CustomArtwork: Story = {
  args: { onViewChange: () => {}, onQueryChange: () => {} },
  render: () => (
    <FinderWindow aria-label="Image browser">
      <FinderToolbar>
        <FinderTitle>Images</FinderTitle>
      </FinderToolbar>
      <FinderBody>
        <FinderContent>
          <FinderIconGrid aria-label="Images">
            <FinderIconItem
              artwork={<img src="./media/icons-light.png" width={1080} height={640} alt="" />}
              description="PNG image"
            >
              Finder screenshot.png
            </FinderIconItem>
          </FinderIconGrid>
        </FinderContent>
      </FinderBody>
      <FinderStatusBar>1 item</FinderStatusBar>
    </FinderWindow>
  ),
  play: async ({ canvasElement }) => {
    const image = canvasElement.querySelector('img');
    await expect(image).not.toBeNull();
    await waitFor(() => expect(image?.naturalWidth).toBeGreaterThan(0));
    const bounds = image?.getBoundingClientRect();
    await expect(bounds?.width).toBeLessThanOrEqual(68);
    await expect(bounds?.height).toBeLessThanOrEqual(80);
  },
};
