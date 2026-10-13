export const finderViewRecipes = {
  list: `import { TableView, createPuppertinoColumnHelper } from 'puppertino-table';

type FileItem = { id: string; name: string; kind: string };
const helper = createPuppertinoColumnHelper<FileItem>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 280, minSize: 160 }),
  helper.accessor('kind', { header: 'Kind', size: 160 }),
]);
const files: FileItem[] = [{ id: 'brief', name: 'Project brief.pdf', kind: 'PDF' }];

export function FileTable() {
  return <TableView data={files} columns={columns}
    getRowId={file => file.id} getRowLabel={file => file.name}
    ariaLabel="Files" selectable density="compact" manualSorting={false} />;
}`,
  outline: `import { FinderWindow, FinderToolbar, FinderTitle, FinderBody, FinderContent, OutlineView, createPuppertinoColumnHelper } from 'puppertino-table';

type Item = { id: string; name: string; children?: readonly Item[] };
const helper = createPuppertinoColumnHelper<Item>();
const columns = helper.columns([helper.accessor('name', { header: 'Name', size: 300 })]);
const items: Item[] = [{ id: 'documents', name: 'Documents', children: [{ id: 'brief', name: 'Project brief.pdf' }] }];
export function FinderOutline() {
  return <FinderWindow aria-label="Document browser">
    <FinderToolbar><FinderTitle>Projects</FinderTitle></FinderToolbar>
    <FinderBody><FinderContent><OutlineView data={items} columns={columns}
      getRowId={item => item.id} getRowLabel={item => item.name}
      getChildren={item => item.children} isRowSelectable={item => !item.children}
      initialExpanded={{ documents: true }} ariaLabel="Document hierarchy" selectable />
    </FinderContent></FinderBody>
  </FinderWindow>;
}`,

  columns: `import { ColumnView, ColumnViewItem, DensityScope } from 'puppertino-table';

export function Workspace() {
  return <DensityScope density="compact" style={{ height: 390 }}>
    <ColumnView ariaLabel="Workspace" columns={[
      { id: 'folders', label: 'Folders', content: <ColumnViewItem href="#projects" pathSelected>Projects</ColumnViewItem> },
      { id: 'files', label: 'Files', content: <ColumnViewItem href="#brief">Project brief.pdf</ColumnViewItem> },
      { id: 'preview', label: 'Preview', content: <p>Your app-owned preview</p> },
    ]} />
  </DensityScope>;
}`,
  icons: `// Your app owns the icon grid and selected item.
const menu = useContextMenu<string>();
<div className="my-icon-grid">{files.map(file => <button key={file.id}
  type="button" aria-pressed={selectedId === file.id}
  onClick={() => setSelectedId(file.id)} {...menu.getTriggerProps(file.id)}>
  <FileArtwork file={file} /><span>{file.name}</span>
</button>)}</div>;`,
  gallery: `// Your app renders the preview and filmstrip.
<>
<Preview file={files.find(file => file.id === selectedId)} />
<section aria-label="Gallery files">{files.map(file => <button key={file.id}
  type="button" aria-label={file.name} aria-pressed={selectedId === file.id}
  onClick={() => setSelectedId(file.id)} {...menu.getTriggerProps(file.id)}>
  <FileArtwork file={file} />
</button>)}</section>
</>;`,
};
