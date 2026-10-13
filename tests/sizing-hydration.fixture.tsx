import { useCreateAtom } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import { memo, useState } from 'react';
import { renderToString } from 'react-dom/server';
import {
  ColumnResizeHandle,
  type PuppertinoTableInstance,
  RowSelectionCheckbox,
  usePuppertinoTable,
} from '../src/index.js';

const columns = [{ accessorKey: 'name', size: 150, minSize: 50, maxSize: 400 }];
const data = [{ name: 'Ada' }];
const getRowId = () => 'ada';
let table: PuppertinoTableInstance<{ name: string }>;
let setKey: (key: string) => void;
let setMode: (mode: string) => void;
let setWidths: (widths: ColumnSizingState) => void;
let updates = 0;
let setAtomWidth: (width: number) => void;
let readAtoms: () => { width: number; selection: RowSelectionState; sorting: SortingState };
let primitiveRenders = 0;
const StablePrimitives = memo(function StablePrimitives({
  table,
}: {
  table: PuppertinoTableInstance<{ name: string }>;
}) {
  primitiveRenders++;
  const row = table.getRowModel().rows[0];
  const header = table.getHeaderGroups()[0].headers[0];
  return (
    <div>
      <RowSelectionCheckbox row={row} />
      <ColumnResizeHandle table={table} header={header} />
    </div>
  );
});
let setAdapter: (enabled: boolean) => void;
const alternateStorage = { getItem: () => '{"name":310}', setItem: () => {} };

function Fixture({ initialMode = 'local' }: { initialMode?: string }) {
  const sizingAtom = useCreateAtom<ColumnSizingState>({ name: 245 });
  const otherSizingAtom = useCreateAtom<ColumnSizingState>({ name: 275 });
  const sortingAtom = useCreateAtom<SortingState>([]);
  const selectionAtom = useCreateAtom<RowSelectionState>({});
  const [alternate, changeAdapter] = useState(false);
  setAdapter = changeAdapter;
  const [key, changeKey] = useState('a');
  const [mode, changeMode] = useState(initialMode);
  const [widths, changeWidths] = useState<ColumnSizingState>({ name: 220 });
  setKey = changeKey;
  setMode = changeMode;
  setWidths = changeWidths;
  const activeSizingAtom = mode === 'atoms-alt' ? otherSizingAtom : sizingAtom;
  setAtomWidth = (width) => activeSizingAtom.set({ name: width });
  readAtoms = () => ({
    width: activeSizingAtom.get().name,
    selection: selectionAtom.get(),
    sorting: sortingAtom.get(),
  });
  table = usePuppertinoTable({
    data,
    columns: [...columns],
    storage: alternate ? alternateStorage : undefined,
    getRowId,
    selectable: true,
    storageKey: key,
    ...(mode.startsWith('atoms')
      ? {
          atoms: {
            columnSizing: activeSizingAtom,
            sorting: sortingAtom,
            rowSelection: selectionAtom,
          },
        }
      : mode === 'controlled'
        ? {
            columnSizing: widths,
            onColumnSizingChange: (update) => {
              updates++;
              changeWidths(update);
            },
          }
        : mode === 'readonly'
          ? { columnSizing: widths }
          : {}),
  });
  const [primitiveTable] = useState(() => table);
  return (
    <>
      <StablePrimitives table={primitiveTable} />
      <table.Subscribe source={table.atoms.columnSizing}>
        {() => <output id="width">{table.getColumn('name')?.getSize()}</output>}
      </table.Subscribe>
    </>
  );
}
export function serverHTML() {
  return renderToString(<Fixture />);
}
export async function hydrate() {
  const { hydrateRoot } = await import('react-dom/client');
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing hydration root');
  const errors: string[] = [];
  const firstHTML = root.innerHTML;
  const hydrated = hydrateRoot(root, <Fixture />, {
    onRecoverableError: (error) => errors.push(String(error)),
  });
  return {
    remount: (mode: string) => hydrated.render(<Fixture key={mode} initialMode={mode} />),
    adapter: (enabled: boolean) => setAdapter(enabled),
    errors,
    firstHTML,
    key: (key: string) => setKey(key),
    mode: (mode: string) => setMode(mode),
    widths: (widths: ColumnSizingState) => setWidths(widths),
    resize: (width: number) => table.setColumnSizing((old) => ({ ...old, name: width })),
    updates: () => updates,
    primitiveRenders: () => primitiveRenders,
    atomWidth: (width: number) => setAtomWidth(width),
    atoms: () => readAtoms(),
    sort: () => table.setSorting([{ id: 'name', desc: true }]),
    select: () => table.getRowModel().rows[0].toggleSelected(),
  };
}
