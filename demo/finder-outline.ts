import type { FileItem } from './finder-files.js';

export interface FinderGroup {
  id: string;
  name: string;
  kind: 'Folder';
  size: string;
  modified: undefined;
  children: readonly FinderOutlineItem[];
}
export type FinderOutlineItem = FileItem | FinderGroup;
export function isFinderGroup(item: FinderOutlineItem): item is FinderGroup {
  return 'children' in item;
}
/** App-owned hierarchy over the current collection. File IDs stay shared across views. */
export function finderOutlineItems(files: readonly FileItem[], scope: string): FinderOutlineItem[] {
  const group = (
    key: string,
    name: string,
    children: readonly FinderOutlineItem[],
  ): FinderGroup => ({
    id: `finder-group:${encodeURIComponent(scope)}:${key}`,
    name,
    kind: 'Folder',
    modified: undefined,
    size: `${children.length} ${children.length === 1 ? 'item' : 'items'}`,
    children,
  });
  const pdfs = files.filter((file) => file.kind === 'PDF document');
  const notes = files.filter((file) => file.kind === 'Text document');
  const sheets = files.filter((file) => file.kind === 'Spreadsheet');
  const images = files.filter((file) => file.kind === 'PNG image');
  const others = files.filter(
    (file) => !['PDF document', 'Text document', 'Spreadsheet', 'PNG image'].includes(file.kind),
  );
  const documents = [
    pdfs.length ? group('pdfs', 'PDFs', pdfs) : null,
    notes.length ? group('notes', 'Notes', notes) : null,
  ].filter((item) => item !== null);
  return [
    documents.length ? group('documents', 'Documents', documents) : null,
    sheets.length ? group('sheets', 'Spreadsheets', sheets) : null,
    images.length ? group('images', 'Artwork', images) : null,
    others.length ? group('other', 'Other', others) : null,
  ].filter((item) => item !== null);
}
export function finderGroupIds(items: readonly FinderOutlineItem[]): string[] {
  return items.flatMap((item) =>
    isFinderGroup(item) ? [item.id, ...finderGroupIds(item.children)] : [],
  );
}

export function finderVisibleFiles(
  items: readonly FinderOutlineItem[],
  expanded: Readonly<Record<string, boolean>>,
): FileItem[] {
  return items.flatMap((item) =>
    isFinderGroup(item)
      ? expanded[item.id]
        ? finderVisibleFiles(item.children, expanded)
        : []
      : [item],
  );
}
export function finderAncestors(items: readonly FinderOutlineItem[], id: string): string[] {
  for (const item of items) {
    if (!isFinderGroup(item)) continue;
    if (item.children.some((child) => child.id === id)) return [item.id];
    const path = finderAncestors(item.children, id);
    if (path.length) return [item.id, ...path];
  }
  return [];
}
