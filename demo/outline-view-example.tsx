import { FileTextIcon, FolderIcon } from '@phosphor-icons/react';
import type { RowSelectionState } from '@tanstack/react-table';
import { useRef, useState } from 'react';
import {
  createPuppertinoColumnHelper,
  type OutlineExpandedState,
  OutlineView,
  type OutlineViewProps,
  SplitView,
} from '../src/index.js';

export interface OutlineItem {
  id: string;
  name: string;
  kind: 'Folder' | 'Document';
  size: number;
  children?: readonly OutlineItem[];
}
const roots: OutlineItem[] = [
  { id: 'projects', name: 'Projects', kind: 'Folder', size: 0 },
  { id: 'archive', name: 'Archive', kind: 'Folder', size: 0 },
  { id: 'readme', name: 'README.md', kind: 'Document', size: 1200 },
];
const children: Record<string, readonly OutlineItem[]> = {
  projects: [
    { id: 'source', name: 'Source', kind: 'Folder', size: 0 },
    { id: 'package', name: 'package.json', kind: 'Document', size: 340 },
  ],
  source: [
    { id: 'index', name: 'index.ts', kind: 'Document', size: 2048 },
    { id: 'cell', name: 'cell.tsx', kind: 'Document', size: 512 },
  ],
  archive: [{ id: 'notes', name: 'Meeting notes.txt', kind: 'Document', size: 820 }],
};
const byId = new Map([...roots, ...Object.values(children).flat()].map((item) => [item.id, item]));
const helper = createPuppertinoColumnHelper<OutlineItem>();
const columns = helper.columns([
  helper.accessor('name', {
    header: 'Name',
    size: 300,
    minSize: 180,
    cell: (cell) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {cell.row.original.kind === 'Folder' ? (
          <FolderIcon aria-hidden="true" weight="duotone" />
        ) : (
          <FileTextIcon aria-hidden="true" weight="duotone" />
        )}
        {cell.getValue()}
      </span>
    ),
  }),
  helper.accessor('kind', { header: 'Kind', size: 120, minSize: 90 }),
  helper.accessor('size', {
    header: 'Size',
    size: 110,
    minSize: 90,
    cell: (cell) =>
      cell.row.original.kind === 'Folder'
        ? '—'
        : `${cell.getValue().toLocaleString('en-US')} bytes`,
  }),
]);

export type OutlineViewExampleProps = Pick<
  OutlineViewProps<OutlineItem>,
  | 'disabled'
  | 'density'
  | 'selectable'
  | 'selectionCheckboxes'
  | 'resizable'
  | 'manualSorting'
  | 'expanded'
  | 'rowSelection'
  | 'onExpandedChange'
  | 'onRowSelectionChange'
> & { loadingDelay?: number; simulateError?: boolean; foldersSelectable?: boolean };
export function OutlineViewExample({
  disabled = false,
  density = 'comfortable',
  selectable = true,
  selectionCheckboxes = true,
  resizable = true,
  manualSorting = false,
  loadingDelay = 600,
  simulateError = true,
  foldersSelectable = true,
  expanded: controlledExpanded,
  rowSelection,
  onExpandedChange,
  onRowSelectionChange,
}: OutlineViewExampleProps) {
  const [localSelection, setSelection] = useState<RowSelectionState>({});
  const [localExpanded, setExpanded] = useState<OutlineExpandedState>({});
  const selection = rowSelection ?? localSelection;
  const expanded = controlledExpanded ?? localExpanded;
  const [activePane, setActivePane] = useState('outline');
  const [requests, setRequests] = useState(0);
  const [revision, setRevision] = useState(0);
  const attempts = useRef(new Map<string, number>());
  const selected = byId.get(Object.keys(selection).find((id) => selection[id]) ?? '');
  const loadChildren = async (item: OutlineItem, { signal }: { signal: AbortSignal }) => {
    setRequests((value) => value + 1);
    const attempt = (attempts.current.get(item.id) ?? 0) + 1;
    attempts.current.set(item.id, attempt);
    // Replace this delay with your application's fetch/API client, passing the AbortSignal.
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, loadingDelay);
      signal.addEventListener('abort', abort, { once: true });
    });
    if (simulateError && item.id === 'archive' && attempt === 1)
      throw new Error('Example unavailable response');
    return children[item.id] ?? [];
  };
  return (
    <main>
      <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>Documents</h1>
      <nav
        aria-label="Split view navigation"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}
      >
        <button
          type="button"
          className="p-button"
          aria-pressed={activePane === 'outline'}
          onClick={() => setActivePane('outline')}
        >
          Outline
        </button>
        <button
          type="button"
          className="p-button"
          aria-pressed={activePane === 'detail'}
          onClick={() => setActivePane('detail')}
        >
          Detail
        </button>
        <button
          type="button"
          className="p-button"
          onClick={() => setRevision((value) => value + 1)}
        >
          Reload children
        </button>
        <output aria-label="Child requests">{requests} requests</output>
      </nav>
      <div style={{ height: 400, maxWidth: 1000 }}>
        <SplitView
          ariaLabel="Documents split view"
          activePaneId={activePane}
          panes={[
            {
              id: 'outline',
              label: 'Documents',
              size: 600,
              minSize: 350,
              maxSize: 760,
              content: (
                <OutlineView
                  data={roots}
                  columns={columns}
                  getRowId={(item) => item.id}
                  getRowLabel={(item) => item.name}
                  getChildren={(item) => item.children}
                  hasChildren={(item) => item.kind === 'Folder'}
                  loadChildren={loadChildren}
                  cacheKey={String(revision)}
                  expanded={expanded}
                  onExpandedChange={(next) => {
                    setExpanded(next);
                    onExpandedChange?.(next);
                  }}
                  ariaLabel="Document hierarchy"
                  density={density}
                  selectable={selectable}
                  isRowSelectable={foldersSelectable ? undefined : (item) => item.kind !== 'Folder'}
                  selectionCheckboxes={selectionCheckboxes}
                  resizable={resizable}
                  manualSorting={manualSorting}
                  rowSelection={selection}
                  onRowSelectionChange={(updater) => {
                    const next = typeof updater === 'function' ? updater(selection) : updater;
                    setSelection(next);
                    onRowSelectionChange?.(next);
                  }}
                  disabled={disabled}
                />
              ),
            },
            {
              id: 'detail',
              label: 'Document detail',
              minSize: 240,
              content: (
                <div style={{ padding: 16 }}>
                  <h2>{selected?.name ?? 'Select a document'}</h2>
                  <p>
                    {selected
                      ? `${selected.kind} · ${selected.size.toLocaleString('en-US')} bytes`
                      : 'Select a row in the outline to show its details. Expansion and selection survive pane changes.'}
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>
    </main>
  );
}
