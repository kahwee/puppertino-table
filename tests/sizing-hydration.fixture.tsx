import type { ColumnSizingState } from '@tanstack/react-table';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { type PuppertinoTableInstance, usePuppertinoTable } from '../src/index.js';

const columns = [{ accessorKey: 'name', size: 150, minSize: 50, maxSize: 400 }];
const data = [{ name: 'Ada' }];
const getRowId = () => 'ada';
let table: PuppertinoTableInstance<{ name: string }>;
let setKey: (key: string) => void;
let setMode: (mode: string) => void;
let setWidths: (widths: ColumnSizingState) => void;
let updates = 0;
let setAdapter: (enabled: boolean) => void;
const alternateStorage = { getItem: () => '{"name":310}', setItem: () => {} };

function Fixture() {
  const [alternate, changeAdapter] = useState(false);
  setAdapter = changeAdapter;
  const [key, changeKey] = useState('a');
  const [mode, changeMode] = useState('local');
  const [widths, changeWidths] = useState<ColumnSizingState>({ name: 220 });
  setKey = changeKey;
  setMode = changeMode;
  setWidths = changeWidths;
  table = usePuppertinoTable({
    data,
    columns: [...columns],
    storage: alternate ? alternateStorage : undefined,
    getRowId,
    storageKey: key,
    ...(mode !== 'local' ? { columnSizing: widths } : {}),
    ...(mode === 'controlled'
      ? {
          onColumnSizingChange: (update) => {
            updates++;
            changeWidths(update);
          },
        }
      : {}),
  });
  return (
    <table.Subscribe source={table.atoms.columnSizing}>
      {() => <output id="width">{table.getColumn('name')?.getSize()}</output>}
    </table.Subscribe>
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
  hydrateRoot(root, <Fixture />, { onRecoverableError: (error) => errors.push(String(error)) });
  return {
    adapter: (enabled: boolean) => setAdapter(enabled),
    errors,
    firstHTML,
    key: (key: string) => setKey(key),
    mode: (mode: string) => setMode(mode),
    widths: (widths: ColumnSizingState) => setWidths(widths),
    resize: (width: number) => table.setColumnSizing((old) => ({ ...old, name: width })),
    updates: () => updates,
  };
}
