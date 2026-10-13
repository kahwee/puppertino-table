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
  icons: `'use client';
import { useState } from 'react';
import { FinderIconGrid, FinderIconItem } from 'puppertino-table';

type FileItem = { id: string; name: string; kind: string };
const files: FileItem[] = [{ id: 'brief', name: 'Project brief.pdf', kind: 'PDF document' }];
export function IconCollection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <FinderIconGrid aria-label="Documents">{files.map(file =>
    <FinderIconItem key={file.id} selected={selectedId === file.id}
      description={file.kind} artwork={<span aria-hidden="true">📄</span>}
      onClick={() => setSelectedId(file.id)}>{file.name}</FinderIconItem>
  )}</FinderIconGrid>;
}`,
  gallery: `'use client';
import { useState } from 'react';
import { FinderGallery, FinderFilmstrip, FinderGalleryItem } from 'puppertino-table';

type FileItem = { id: string; name: string; preview: string };
const files: FileItem[] = [{ id: 'brief', name: 'Project brief.pdf', preview: 'App-owned document preview' }];
export function GalleryCollection() {
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? '');
  const selected = files.find(file => file.id === selectedId);
  return <FinderGallery aria-label="Documents">
    <article aria-label="Preview"><h2>{selected?.name}</h2><p>{selected?.preview}</p></article>
    <FinderFilmstrip aria-label="Choose a document">{files.map(file =>
      <FinderGalleryItem key={file.id} selected={selectedId === file.id}
        aria-label={file.name} onClick={() => setSelectedId(file.id)}>{file.name}</FinderGalleryItem>
    )}</FinderFilmstrip>
  </FinderGallery>;
}`,
};
