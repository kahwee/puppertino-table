import './paged-people.css';
import { useCreateAtom } from '@tanstack/react-store';
import {
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  Subscribe,
} from '@tanstack/react-table';
import { useId, useMemo, useRef, useState } from 'react';
import {
  ColumnLayoutPicker,
  columnLayoutMenu,
  PuppertinoTable,
  type TableDensity,
} from '../src/index.js';
import { personColumns } from './fixtures.js';
import { peopleColumnChoices, peopleLayoutColumns } from './people-layout.js';
import { peoplePage } from './people-page.js';
import { type TableDataPreset, tableData } from './table-data-presets.js';
import { usePeopleLayout } from './use-people-layout.js';

export interface PagedPeopleProps {
  dataPreset?: TableDataPreset;
  pageSize?: 2 | 5 | 10 | 25;
  query: string;
  onQueryChange(value: string): void;
  onSortingChange?: OnChangeFn<SortingState>;
  density?: TableDensity;
  disabled?: boolean;
}

export function PagedPeopleExample({
  dataPreset = 'standard',
  pageSize = 2,
  query,
  onQueryChange,
  onSortingChange,
  density = 'native',
  disabled = false,
}: PagedPeopleProps) {
  const people = useMemo(() => tableData(dataPreset), [dataPreset]);
  const layout = usePeopleLayout();
  const columns = useMemo(
    () =>
      personColumns.filter(
        (column) =>
          !layout.hidden.includes(
            ('accessorKey' in column ? column.accessorKey : column.id) as string,
          ),
      ),
    [layout.hidden],
  );
  const columnsId = useId();
  const columnsPanel = useRef<HTMLDivElement>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 });
  const [pagination, setPagination] = useState({ query, pageSize, pageIndex: 0 });
  // Adjust paging before rendering new args; retain selection and column widths.
  if (pagination.query !== query || pagination.pageSize !== pageSize)
    setPagination({ query, pageSize, pageIndex: 0 });
  const pageIndex = pagination.pageIndex;
  const setPageIndex = (pageIndex: number) => setPagination({ query, pageSize, pageIndex });
  const [sorting, setSorting] = useState<SortingState>([]);
  const search = useRef<HTMLInputElement>(null);
  // One shared owner; the footer subscribes without rerendering this whole workspace.
  const rowSelection = useCreateAtom<RowSelectionState>({});
  const page = useMemo(
    () => peoplePage(people, { query, sorting, pageIndex, pageSize }),
    [people, query, sorting, pageIndex, pageSize],
  );
  const changeQuery = (value: string) => {
    setPageIndex(0);
    onQueryChange(value);
  };
  return (
    <section className="demo-people-workspace" aria-label="Team directory workspace">
      <header className="demo-people-controls">
        <label>
          Find teammates
          <input
            ref={search}
            type="search"
            className="p-form-text"
            aria-label="Filter people"
            placeholder="Name or team"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
          />
        </label>
        <p>Selection stays with you across pages.</p>
        <button
          type="button"
          className="p-button demo-people-columns-trigger"
          disabled={disabled || !layout.ready}
          popoverTarget={columnsId}
          aria-haspopup="dialog"
          aria-expanded={columnsOpen}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setPanelPosition({
              left: Math.max(12, Math.min(rect.right - 250, window.innerWidth - 262)),
              top: Math.max(12, Math.min(rect.bottom + 6, window.innerHeight - 290)),
            });
          }}
        >
          Columns
        </button>
        <div
          ref={columnsPanel}
          id={columnsId}
          popover="auto"
          role="dialog"
          aria-label="Columns"
          className="demo-people-column-panel"
          style={panelPosition}
          onToggle={(event) => {
            const open = event.newState === 'open';
            setColumnsOpen(open);
            if (open)
              columnsPanel.current
                ?.querySelector<HTMLInputElement>('input:not(:disabled)')
                ?.focus();
          }}
        >
          <fieldset>
            <legend>Visible columns</legend>
            {peopleColumnChoices.map(({ id, label }) => (
              <label key={id} className="p-checkbox">
                <input
                  type="checkbox"
                  checked={!layout.hidden.includes(id)}
                  disabled={disabled || id === 'name'}
                  onChange={(event) => {
                    layout.setVisible(id, event.target.checked);
                    if (!event.target.checked && sorting[0]?.id === id) {
                      setSorting([]);
                      setPageIndex(0);
                      onSortingChange?.([]);
                    }
                  }}
                />
                <span aria-hidden="true" />
                {label}
              </label>
            ))}
          </fieldset>
          <p>Name stays visible. Visibility and widths are saved.</p>
          <button type="button" className="p-button" disabled={disabled} onClick={layout.reset}>
            Restore default layout
          </button>
          <span role="status" aria-live="polite">
            {layout.notice}
          </span>
        </div>
      </header>
      <ColumnLayoutPicker controller={layout} disabled={disabled} />
      <PuppertinoTable
        data={page.rows}
        columns={columns}
        getRowId={(person) => person.id}
        getRowLabel={(person) => person.name}
        ariaLabel="Paged people"
        density={density}
        disabled={disabled}
        resizable={layout.ready}
        manualSorting
        sorting={sorting}
        onSortingChange={(update) => {
          setSorting(update);
          setPageIndex(0);
          onSortingChange?.(update);
        }}
        selectable
        atoms={{ rowSelection, columnSizing: layout.columnSizing, columnOrder: layout.columnOrder }}
        onColumnSizingCommit={layout.commitWidths}
        onColumnOrderCommit={layout.commitOrder}
        reorderable={layout.ready}
        lockedColumns={['name']}
        getHeaderMenu={(column) =>
          disabled || !layout.ready
            ? []
            : columnLayoutMenu({ ...layout, columns: peopleLayoutColumns }, column.id)
        }
        isRowSelectable={dataPreset === 'readOnly' ? () => false : undefined}
        emptyContent={
          <div className="demo-people-empty">
            <strong>{query.trim() ? 'No matching people' : 'No people available'}</strong>
            {query.trim() && (
              <button
                type="button"
                className="p-button"
                onClick={() => {
                  changeQuery('');
                  search.current?.focus();
                }}
              >
                Clear search
              </button>
            )}
          </div>
        }
      />
      <footer className="demo-people-controls">
        <nav aria-label="People pages">
          <button
            type="button"
            className="p-button"
            disabled={page.pageIndex === 0}
            onClick={() => setPageIndex(page.pageIndex - 1)}
          >
            Previous page
          </button>
          <button
            type="button"
            className="p-button"
            disabled={page.pageIndex + 1 >= page.pageCount}
            onClick={() => setPageIndex(page.pageIndex + 1)}
          >
            Next page
          </button>
        </nav>
        <output aria-label="People page" aria-live="polite">
          {page.total ? page.pageIndex * pageSize + 1 : 0}–
          {Math.min((page.pageIndex + 1) * pageSize, page.total)} of {page.total} people · Page{' '}
          {page.pageCount ? page.pageIndex + 1 : 0} of {page.pageCount}
        </output>
        <Subscribe source={rowSelection}>
          {(selected) => {
            const total = Object.values(selected).filter(Boolean).length;
            const visible = page.rows.filter((person) => selected[person.id]).length;
            return (
              <div className="demo-people-selection">
                <output aria-label="Total selected">
                  {total} selected · {visible} on this page
                </output>
                <button
                  type="button"
                  className="p-button"
                  disabled={!total || disabled}
                  onClick={() => rowSelection.set({})}
                >
                  Clear selection
                </button>
              </div>
            );
          }}
        </Subscribe>
      </footer>
    </section>
  );
}
