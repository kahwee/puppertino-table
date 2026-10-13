import { useCreateAtom, useSelector } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { PuppertinoTable, type PuppertinoTableAtoms } from '../src/index.js';
import { people, personColumns } from './fixtures.js';

export function ControlledSizingExample() {
  const [committed, setCommitted] = useState<ColumnSizingState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({ name: 280 });
  return (
    <>
      <button type="button" onClick={() => setColumnSizing({ name: 200 })}>
        Set name width to 200
      </button>
      <PuppertinoTable
        data={people.slice(0, 5)}
        columns={personColumns}
        getRowId={(row) => row.id}
        ariaLabel="Controlled widths"
        onColumnSizingCommit={setCommitted}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
      />
      <output aria-label="Committed name width">{committed.name ?? 'No commit'}</output>
      <output aria-label="Name width">{columnSizing.name}</output>
    </>
  );
}

function AtomWidthOutput({ atom }: { atom: NonNullable<PuppertinoTableAtoms['columnSizing']> }) {
  const widths = useSelector(atom);
  return <output aria-label="Atom name width">{widths.name}</output>;
}
export function AtomOwnershipExample() {
  const [committed, setCommitted] = useState<ColumnSizingState>({});
  const columnSizing = useCreateAtom<ColumnSizingState>({ name: 280 });
  const sorting = useCreateAtom<SortingState>([]);
  const rowSelection = useCreateAtom<RowSelectionState>({});
  return (
    <>
      <button type="button" onClick={() => columnSizing.set({ name: 200 })}>
        Set atom width to 200
      </button>
      <PuppertinoTable
        data={people.slice(0, 5)}
        columns={personColumns}
        getRowId={(row) => row.id}
        ariaLabel="Atom-owned table"
        onColumnSizingCommit={setCommitted}
        selectable
        manualSorting={false}
        atoms={{ columnSizing, sorting, rowSelection }}
      />
      <AtomWidthOutput atom={columnSizing} />
      <output aria-label="Committed name width">{committed.name ?? 'No commit'}</output>
    </>
  );
}

export function ResizeEventsExample() {
  const [preview, setPreview] = useState<ColumnSizingState>({});
  const [committed, setCommitted] = useState<ColumnSizingState>({});
  const [commits, setCommits] = useState(0);
  return (
    <>
      <PuppertinoTable
        data={people.slice(0, 5)}
        columns={personColumns}
        getRowId={(row) => row.id}
        ariaLabel="Resize events"
        onColumnSizingChange={setPreview}
        onColumnSizingCommit={(widths) => {
          setCommitted(widths);
          setCommits((count) => count + 1);
        }}
      />
      <output aria-label="Preview name width">{preview.name ?? 240}</output>
      <output aria-label="Committed name width">{committed.name ?? 'No commit'}</output>
      <output aria-label="Resize commits">{commits}</output>
    </>
  );
}
