import { useRef, useState } from 'react';
import {
  createPuppertinoColumnHelper,
  useItemNavigation,
  usePuppertinoTable,
  useRowSelectionGestures,
} from '../src/index.js';

const navigationItems = [
  { id: 'brief', name: 'Project brief.pdf' },
  { id: 'notes', name: 'Research notes.txt' },
  { id: 'budget', name: 'Budget.xlsx' },
  { id: 'cover', name: 'Cover artwork.png' },
  { id: 'meeting', name: 'Meeting notes.txt' },
  { id: 'timeline', name: 'Launch timeline.pdf' },
];
const navigationHelper = createPuppertinoColumnHelper<(typeof navigationItems)[number]>();
const navigationColumns = navigationHelper.columns([
  navigationHelper.accessor('name', { header: 'Name' }),
]);
export function KeyboardNavigationExample() {
  const [grid, setGrid] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const table = usePuppertinoTable({
    data: navigationItems,
    columns: navigationColumns,
    getRowId: (item) => item.id,
    selectable: true,
    disabled,
  });
  const { select } = useRowSelectionGestures(table);
  const navigation = useItemNavigation({
    orderedIds: navigationItems.map((item) => item.id),
    getItemElement: (id) => elements.current.get(id),
    orientation: grid ? 'grid' : 'vertical',
    columns: 3,
    disabled,
    getItemLabel: (id) => navigationItems.find((item) => item.id === id)?.name ?? '',
    onNavigate: select,
  });
  return (
    <>
      <p>Arrow keys move and select. Shift extends the range. Type a filename prefix to jump.</p>
      <label>
        <input type="checkbox" checked={grid} onChange={(event) => setGrid(event.target.checked)} />
        Three-column grid
      </label>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disable navigation
      </label>
      <table.Subscribe source={table.atoms.rowSelection}>
        {(selected) => (
          <ul
            className="p-list demo-navigation-items"
            aria-label="Keyboard files"
            style={
              grid
                ? { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
                : undefined
            }
          >
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  {...navigation.getItemProps(item.id)}
                  disabled={disabled}
                  aria-pressed={!!selected[item.id]}
                  ref={(element) => {
                    if (element) elements.current.set(item.id, element);
                    else elements.current.delete(item.id);
                  }}
                  className={selected[item.id] ? 'p-list-row p-selected' : 'p-list-row'}
                  onClick={(event) =>
                    select(item.id, {
                      shift: event.shiftKey,
                      toggle: event.metaKey || event.ctrlKey,
                    })
                  }
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </table.Subscribe>
    </>
  );
}
