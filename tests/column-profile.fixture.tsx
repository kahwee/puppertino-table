import { createRoot } from 'react-dom/client';
import {
  ColumnLayoutPicker,
  type PuppertinoColumnDef,
  PuppertinoTable,
  useColumnLayout,
} from '../src/index.js';
import '../demo/style.css';

type Item = { id: string; values: number[] };
const count = Number(new URLSearchParams(location.search).get('columns') || 10);
const columns: PuppertinoColumnDef<Item>[] = Array.from({ length: count }, (_, index) => ({
  id: `column${index}`,
  header: `Column ${index}`,
  accessorFn: (row: Item) => row.values[index],
  size: 90,
  minSize: 50,
  maxSize: 300,
}));
const schema = Array.from({ length: count }, (_, index) => ({
  id: `column${index}`,
  label: `Column ${index}`,
  size: 90,
  minSize: 50,
  maxSize: 300,
}));
const presets = [{ id: 'all', name: 'All columns' }];
const data = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  values: Array.from({ length: count }, (_, column) => index + column),
}));
declare global {
  interface Window {
    columnProfile: { headers: number; pickers: number; cells: number; commits: number };
  }
}
window.columnProfile = { headers: 0, pickers: 0, cells: 0, commits: 0 };
function Fixture() {
  const layout = useColumnLayout({ columns: schema, presets, storageKey: 'column-profile' });
  return (
    <>
      <ColumnLayoutPicker controller={layout} />
      <PuppertinoTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        ariaLabel="Column profiling"
        atoms={{ columnOrder: layout.columnOrder, columnSizing: layout.columnSizing }}
        reorderable={layout.ready}
        lockedColumns={['column0']}
        getCellProps={() => {
          window.columnProfile.cells++;
          return undefined;
        }}
        onColumnOrderCommit={(order) => {
          window.columnProfile.commits++;
          layout.commitOrder(order);
        }}
        onColumnSizingCommit={layout.commitWidths}
      />
    </>
  );
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing profile root');
createRoot(root).render(<Fixture />);
