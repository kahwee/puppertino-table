export const initialFiles = [
  {
    id: 'brief',
    name: 'Project brief.pdf',
    kind: 'PDF document',
    size: '248 KB',
    modified: new Date('2026-10-12T17:42:00Z'),
    folder: 'Projects',
  },
  {
    id: 'research',
    name: 'Research notes.txt',
    kind: 'Text document',
    size: '18 KB',
    modified: new Date('2026-10-12T16:15:00Z'),
    folder: 'Projects',
  },
  {
    id: 'budget',
    name: 'Budget.xlsx',
    kind: 'Spreadsheet',
    size: '96 KB',
    modified: new Date('2026-10-11T22:20:00Z'),
    folder: 'Projects',
  },
  {
    id: 'cover',
    name: 'Cover artwork.png',
    kind: 'PNG image',
    size: '1.2 MB',
    modified: new Date('2026-10-11T18:05:00Z'),
    folder: 'Projects',
  },
  {
    id: 'meeting',
    name: 'Meeting notes.txt',
    kind: 'Text document',
    size: '12 KB',
    modified: new Date('2026-10-10T23:40:00Z'),
    folder: 'Projects',
  },
  {
    id: 'timeline',
    name: 'Launch timeline.pdf',
    kind: 'PDF document',
    size: '384 KB',
    modified: new Date('2026-10-09T21:10:00Z'),
    folder: 'Projects',
  },
];
export type FileItem = (typeof initialFiles)[number] & { tags?: string[] };

export interface FinderFilesState {
  files: FileItem[];
  trash: FileItem[];
  lastDeletedIds: string[];
}
export const initialFinderFiles: FinderFilesState = {
  files: initialFiles,
  trash: [],
  lastDeletedIds: [],
};
export type FinderFilesAction =
  | { type: 'delete'; ids: readonly string[] }
  | { type: 'restore'; ids: readonly string[] }
  | { type: 'move'; ids: readonly string[]; folder: 'Projects' | 'Archive' }
  | { type: 'tag'; ids: readonly string[]; tag: string; remove?: boolean }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'rename'; id: string; name: string };

/** Fictional file operations belong to the demo, never the table library. */
export function finderFilesReducer(
  state: FinderFilesState,
  action: FinderFilesAction,
): FinderFilesState {
  if (action.type === 'reset') return initialFinderFiles;
  if (action.type === 'rename') {
    const name = action.name.trim();
    const file = state.files.find((item) => item.id === action.id);
    if (
      !file ||
      !name ||
      name.includes('/') ||
      name === '.' ||
      name === '..' ||
      state.files.some(
        (item) =>
          item.id !== file.id &&
          item.folder === file.folder &&
          item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      return state;
    return {
      ...state,
      files: state.files.map((item) => (item.id === action.id ? { ...item, name } : item)),
    };
  }
  const ids = new Set(action.type === 'undo' ? state.lastDeletedIds : action.ids);
  if (action.type === 'tag') {
    const update = (file: FileItem): FileItem =>
      ids.has(file.id)
        ? {
            ...file,
            tags: action.remove
              ? (file.tags ?? []).filter((tag) => tag !== action.tag)
              : [...new Set([...(file.tags ?? []), action.tag])],
          }
        : file;
    return { ...state, files: state.files.map(update), trash: state.trash.map(update) };
  }
  if (action.type === 'move') {
    return {
      ...state,
      files: state.files.map((file) =>
        ids.has(file.id) ? { ...file, folder: action.folder } : file,
      ),
    };
  }
  if (action.type === 'delete') {
    const deleted = state.files.filter((file) => ids.has(file.id));
    if (!deleted.length) return state;
    return {
      files: state.files.filter((file) => !ids.has(file.id)),
      trash: [...state.trash, ...deleted],
      lastDeletedIds: deleted.map((file) => file.id),
    };
  }
  const restored = state.trash.filter((file) => ids.has(file.id));
  const byId = new Map([...state.files, ...restored].map((file) => [file.id, file]));
  return {
    files: initialFiles.flatMap((file) => {
      const restoredFile = byId.get(file.id);
      return restoredFile ? [restoredFile] : [];
    }),
    trash: state.trash.filter((file) => !ids.has(file.id)),
    lastDeletedIds: state.lastDeletedIds.filter((id) => !ids.has(id)),
  };
}
