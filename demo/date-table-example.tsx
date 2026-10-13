import { createPuppertinoColumnHelper, PuppertinoTable } from '../src/index.js';
import { formatDateTime } from './date-format.js';

interface DatedItem {
  id: string;
  name: string;
  added: Date;
}
const datedItems: DatedItem[] = [
  { id: 'october', name: 'October brief', added: new Date('2026-10-10T23:40:00Z') },
  { id: 'september', name: 'September notes', added: new Date('2026-09-30T23:40:00Z') },
  { id: 'morning', name: 'Morning update', added: new Date('2026-10-10T16:15:00Z') },
  { id: 'november', name: 'November plan', added: new Date('2026-11-01T18:00:00Z') },
];
const datedHelper = createPuppertinoColumnHelper<DatedItem>();
const datedColumns = datedHelper.columns([
  datedHelper.accessor('name', { header: 'Name', size: 240 }),
  datedHelper.accessor('added', {
    header: 'Date Added',
    size: 280,
    minSize: 240,
    sortFn: 'datetime',
    sortDescFirst: true,
    cell: (cell) => {
      const date = cell.getValue();
      return <time dateTime={date.toISOString()}>{formatDateTime(date)}</time>;
    },
  }),
]);
export function DateTableExample() {
  return (
    <PuppertinoTable
      data={datedItems}
      columns={datedColumns}
      getRowId={(row) => row.id}
      ariaLabel="Date columns"
    />
  );
}
