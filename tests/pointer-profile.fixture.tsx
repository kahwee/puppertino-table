import { createRoot } from 'react-dom/client';
import { type PuppertinoColumnDef, PuppertinoTable } from '../src/index.js';
import { resizeEnvironment } from '../src/resize-dom.js';
import '../demo/style.css';

// Profiling-only switch: compare identical browser workloads with immediate previews.
if (new URLSearchParams(location.search).get('mode') === 'immediate')
  resizeEnvironment.schedulePreview = undefined;

type Item = { id: string; values: number[] };
const count = Number(new URLSearchParams(location.search).get('columns') || 10);
const columns: PuppertinoColumnDef<Item>[] = Array.from({ length: count }, (_, index) => ({
  id: `column${index}`,
  header: `Column ${index}`,
  accessorFn: (row) => row.values[index],
  size: 90,
  minSize: 50,
  maxSize: 300,
}));
const data: Item[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  values: Array.from({ length: count }, (_, column) => index + column),
}));
let cells = 0;
let updates = 0;
let commits = 0;
let active = false;
const starts = new WeakMap<Event, number>();
let durations: number[] = [];
declare global {
  interface Window {
    pointerProfile: {
      pointerId: number;
      reset(): void;
      snapshot(): { durations: number[]; cells: number; updates: number; commits: number };
    };
  }
}
window.pointerProfile = {
  pointerId: 0,
  reset: () => {
    cells = 0;
    updates = 0;
    commits = 0;
    durations = [];
  },
  snapshot: () => ({ durations, cells, updates, commits }),
};
document.addEventListener(
  'pointerdown',
  (event) => {
    window.pointerProfile.pointerId = event.pointerId;
    active = true;
  },
  true,
);
document.addEventListener(
  'pointerup',
  () => {
    active = false;
  },
  true,
);
document.addEventListener(
  'pointermove',
  (event) => {
    if (active) starts.set(event, performance.now());
  },
  true,
);
document.addEventListener('pointermove', (event) => {
  const start = starts.get(event);
  if (start !== undefined) durations.push(performance.now() - start);
});
const root = document.getElementById('root');
if (!root) throw new Error('Missing profile root');
createRoot(root).render(
  <PuppertinoTable
    data={data}
    columns={columns}
    getRowId={(row) => row.id}
    ariaLabel="Resize profiling"
    onColumnSizingChange={() => {
      updates++;
    }}
    onColumnSizingCommit={() => {
      commits++;
    }}
    getCellProps={() => {
      cells++;
      return undefined;
    }}
  />,
);
