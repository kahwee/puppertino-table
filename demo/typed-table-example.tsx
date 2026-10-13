import { createPuppertinoColumnHelper, TableView, type TableViewProps } from '../src/index.js';

export interface Asset {
  id: string;
  name: string;
  size: number;
  added: Date;
}

export const assets: Asset[] = [
  { id: 'brief', name: 'Project brief.pdf', size: 2048, added: new Date('2026-10-10T23:40:00Z') },
  { id: 'notes', name: 'Research notes.txt', size: 512, added: new Date('2026-10-09T18:00:00Z') },
];

const helper = createPuppertinoColumnHelper<Asset>();
export const assetColumns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 260 }),
  helper.accessor('size', {
    header: 'Size',
    // getValue() is inferred as number from the accessor.
    cell: (cell) => `${cell.getValue().toLocaleString('en-US')} bytes`,
  }),
  helper.accessor('added', {
    header: 'Date Added',
    sortFn: 'datetime',
    cell: (cell) => (
      <time dateTime={cell.getValue().toISOString()}>
        {cell.getValue().toLocaleDateString('en-US', { timeZone: 'UTC' })}
      </time>
    ),
  }),
]);

// satisfies checks callbacks and options while retaining the object's inferred types.
export const assetTableProps = {
  data: assets,
  columns: assetColumns,
  getRowId: (asset) => asset.id,
  getRowLabel: (asset) => asset.name,
  ariaLabel: 'Assets',
  selectable: true,
} satisfies TableViewProps<Asset>;

export function TypedAssetTable() {
  return <TableView {...assetTableProps} />;
}
