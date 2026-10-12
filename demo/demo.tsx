import { useMemo, useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable } from '../src/index.js';
import { people, personColumns, type Person } from './fixtures.js';

export function Demo() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [page, setPage] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [dark, setDark] = useState(false);
  const ordered = useMemo(() => {
    const sort = sorting[0];
    return [...people].sort((a, b) => {
      const left = a[sort?.id as keyof Person]; const right = b[sort?.id as keyof Person];
      const compared = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
      return (sort?.desc ? -compared : compared) || a.id.localeCompare(b.id);
    });
  }, [sorting]);
  const rows = useMemo(() => ordered.slice(page * 50, page * 50 + 50), [ordered, page]);
  return <main className={dark ? 'demo-shell p-dark-mode' : 'demo-shell'}>
    <header><div><p className="demo-eyebrow">React + TanStack Table + Puppertino</p><h1>Puppertino Table</h1><p>A reusable table with precise sizing, keyboard controls and range selection.</p></div><button className="p-button" onClick={() => setDark(!dark)}>Use {dark ? 'light' : 'dark'} theme</button></header>
    <section className="demo-panel" aria-label="Table example">
      <div className="demo-toolbar"><span>267 fictional people · host-controlled sorting and pages</span><label><input type="checkbox" checked={disabled} onChange={event => setDisabled(event.target.checked)} /> Disabled</label><button className="p-button" onClick={() => setVisible(!visible)}>{visible ? 'Unmount' : 'Mount'} table</button></div>
      {visible && <PuppertinoTable data={rows} columns={personColumns} getRowId={row => row.id} getRowLabel={row => row.name} ariaLabel="People" sorting={sorting} onSortingChange={updater => { setSorting(updater); setPage(0); setSelection({}); }} rowSelection={selection} onRowSelectionChange={setSelection} selectable disabled={disabled} storageKey="puppertino-table.demo.people.v1" />}
      <footer><output aria-label="Selection count">{Object.keys(selection).length} selected</output><button className="p-button" onClick={() => setSelection({})} disabled={!Object.keys(selection).length}>Clear selection</button><span className="demo-spacer" /><button className="p-button" aria-label="Previous page" disabled={!page} onClick={() => { setPage(page - 1); setSelection({}); }}>Previous</button><span>Page {page + 1} of 6</span><button className="p-button" aria-label="Next page" disabled={page === 5} onClick={() => { setPage(page + 1); setSelection({}); }}>Next</button></footer>
    </section>
    <p className="demo-help">Drag a column edge to resize. Double-click or Enter resets its width. Arrow keys adjust width; Shift makes larger steps. Escape cancels a drag. Shift-click checkboxes selects a range on the current page.</p>
    <a href="https://github.com/kahwee/puppertino-table">Source and documentation</a>
  </main>;
}
