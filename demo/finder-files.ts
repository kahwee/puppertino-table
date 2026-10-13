export const initialFiles = [
  {
    id: 'brief',
    name: 'Project brief.pdf',
    kind: 'PDF document',
    size: '248 KB',
    modified: 'Today, 10:42',
    folder: 'Projects',
  },
  {
    id: 'research',
    name: 'Research notes.txt',
    kind: 'Text document',
    size: '18 KB',
    modified: 'Today, 09:15',
    folder: 'Projects',
  },
  {
    id: 'budget',
    name: 'Budget.xlsx',
    kind: 'Spreadsheet',
    size: '96 KB',
    modified: 'Yesterday',
    folder: 'Projects',
  },
  {
    id: 'cover',
    name: 'Cover artwork.png',
    kind: 'PNG image',
    size: '1.2 MB',
    modified: 'Yesterday',
    folder: 'Projects',
  },
  {
    id: 'meeting',
    name: 'Meeting notes.txt',
    kind: 'Text document',
    size: '12 KB',
    modified: 'Oct 10, 2026',
    folder: 'Projects',
  },
  {
    id: 'timeline',
    name: 'Launch timeline.pdf',
    kind: 'PDF document',
    size: '384 KB',
    modified: 'Oct 9, 2026',
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
  | { type: 'reset' };

/** Fictional file operations belong to the demo, never the table library. */
export function finderFilesReducer(
  state: FinderFilesState,
  action: FinderFilesAction,
): FinderFilesState {
  if (action.type === 'reset') return initialFinderFiles;
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
