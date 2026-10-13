import { useMemo, useState } from 'react';
import { createPuppertinoColumnHelper, PuppertinoTable } from '../src/index.js';
import { formatDateTime } from './date-format.js';

interface DatedItem {
  id: string;
  name: string;
  added: Date | null;
}
// Validate timestamps at the app boundary; never put Invalid Date into a cell.
export function parseAddedDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
const datedItems: DatedItem[] = [
  { id: 'october', name: 'October brief', added: new Date('2026-10-10T23:40:00Z') },
  { id: 'september', name: 'September notes', added: new Date('2026-09-30T23:40:00Z') },
  { id: 'morning', name: 'Morning update', added: new Date('2026-10-10T16:15:00Z') },
  { id: 'november', name: 'November plan', added: new Date('2026-11-01T18:00:00Z') },
  { id: 'before-clock', name: 'Before clock change', added: new Date('2026-11-01T08:30:00Z') },
  { id: 'after-clock', name: 'After clock change', added: new Date('2026-11-01T09:30:00Z') },
  { id: 'undated', name: 'Undated draft', added: null },
  { id: 'invalid', name: 'Invalid imported timestamp', added: parseAddedDate('not-a-date') },
];
const datedHelper = createPuppertinoColumnHelper<DatedItem>();
export function DateTableExample() {
  const [timeZone, setTimeZone] = useState('America/Los_Angeles');
  const datedColumns = useMemo(
    () =>
      datedHelper.columns([
        datedHelper.accessor('name', { header: 'Name', size: 240 }),
        datedHelper.accessor((item) => item.added ?? undefined, {
          id: 'added',
          header: 'Date Added',
          size: 280,
          minSize: 240,
          sortFn: 'datetime',
          sortDescFirst: true,
          sortUndefined: 'last',
          cell: (cell) => {
            const date = cell.getValue();
            return date ? (
              <time dateTime={date.toISOString()} title={date.toISOString()}>
                {formatDateTime(date, timeZone)}
              </time>
            ) : (
              <span>
                <span aria-hidden="true">—</span>
                <span className="pt-sr-only">No date added</span>
              </span>
            );
          },
        }),
      ]),
    [timeZone],
  );
  return (
    <>
      <label>
        Display time zone{' '}
        <select
          aria-label="Display time zone"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
        >
          <option value="America/Los_Angeles">Los Angeles</option>
          <option value="America/New_York">New York</option>
          <option value="UTC">UTC</option>
        </select>
      </label>
      <PuppertinoTable
        data={datedItems}
        columns={datedColumns}
        getRowId={(row) => row.id}
        ariaLabel="Date columns"
      />
    </>
  );
}
