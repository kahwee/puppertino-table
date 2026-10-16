import type { RowSelectionState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { PuppertinoTable, type TableDensity, type TableStatus } from '../src/index.js';
import './large-table.css';
import { inventoryColumns, inventoryRows, type Resource } from './large-inventory.js';

export interface LargeTableProps {
  rowCount?: number;
  columnCount?: number;
  virtualized?: boolean;
  density?: TableDensity;
  status?: TableStatus;
}

/** Identical data and columns in both modes; fetching and filtering stay application-owned. */
export function LargeTableExample({
  rowCount = 10000,
  columnCount = 10,
  virtualized = true,
  density = 'native',
  status = 'ready',
}: LargeTableProps) {
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<RowSelectionState>({});
  const data = useMemo(() => inventoryRows(rowCount), [rowCount]);
  const filtered = useMemo(
    () =>
      data.filter((row) => `${row.name} ${row.kind}`.toLowerCase().includes(query.toLowerCase())),
    [data, query],
  );
  const columns = useMemo(() => inventoryColumns(columnCount), [columnCount]);
  if (!virtualized && rowCount * columnCount > 20000)
    return (
      <main className="demo-large-inventory" aria-label="Large resource inventory">
        <h1>Resource inventory</h1>
        <p>
          Choose 100 rows or fewer columns for the ordinary-rendering comparison, or enable
          virtualization. This combination would mount {rowCount * columnCount} cells.
        </p>
      </main>
    );
  return (
    <main className="demo-large-inventory" aria-label="Large resource inventory">
      <header className="demo-large-heading">
        <h1>Resource inventory</h1>
        <p>Browse, filter and select a loaded archive.</p>
      </header>
      <div className="demo-large-controls">
        <label className="p-search">
          <span className="pt-sr-only">Find resources</span>
          <input
            type="search"
            aria-label="Find resources"
            placeholder="Find resources"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {query && (
          <button type="button" className="p-button" onClick={() => setQuery('')}>
            Clear search
          </button>
        )}
        <output aria-label="Inventory summary">
          {filtered.length.toLocaleString('en-US')} rows · {columnCount} columns ·{' '}
          {Object.values(selection).filter(Boolean).length} selected
        </output>
      </div>
      <PuppertinoTable<Resource>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        ariaLabel="Resource inventory"
        density={density}
        status={status}
        virtualization={virtualized ? { height: 400, overscan: 5 } : undefined}
        selectable
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        emptyContent={
          rowCount === 0
            ? 'The inventory is empty. Choose a dataset in Controls.'
            : 'No matching resources. Clear search to restore the inventory.'
        }
      />
      <p className="demo-large-help">
        {virtualized
          ? 'Arrow keys and Page Up/Down move focus. Home/End reach the edges. Selection survives filtering.'
          : 'All loaded rows are rendered. Enable virtualization in Controls to try row navigation.'}
      </p>
    </main>
  );
}
