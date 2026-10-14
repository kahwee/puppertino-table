'use client';
import { type RowData, Subscribe } from '@tanstack/react-table';
import { useEffect, useRef } from 'react';
import { ContextMenu, useContextMenu } from './context-menu.js';
import { ColumnResizeHandle } from './resize-handle.js';
import { selectionAnchorFor } from './selection-anchor.js';
import { tableBehavior } from './table-behavior.js';
import type { TableHeaderProps } from './table-types.js';

export function TableHeader<T extends RowData>({
  table,
  selectable: selectionOverride,
  disabled: disabledOverride,
  resizable: resizeOverride,
  resizeOptions,
  selectionRows,
  getHeaderMenu,
}: TableHeaderProps<T>) {
  const menu = useContextMenu<ReturnType<typeof table.getAllLeafColumns>[number]>();
  const behavior = tableBehavior(table);
  const selectable = selectionOverride ?? (behavior.selectable && behavior.selectionCheckboxes);
  const disabled = behavior.disabled || !!disabledOverride;
  const root = useRef<HTMLTableSectionElement>(null);
  useEffect(() => {
    if (disabled || !getHeaderMenu) menu.close();
  }, [disabled, getHeaderMenu, menu.close]);
  const resizable = behavior.resizable && resizeOverride !== false;
  const groups = table.getHeaderGroups();
  const options = {
    ...resizeOptions,
    enabled: resizable && !disabled && resizeOptions?.enabled !== false,
  };
  return (
    <thead ref={root}>
      {groups.map((group, index) => (
        <tr key={group.id}>
          {selectable && index === 0 && (
            <th className="pt-selection" rowSpan={groups.length} scope="col">
              <Subscribe source={table.atoms.rowSelection}>
                {(selection) => {
                  const rows = (selectionRows ?? table.getRowModel().rows).filter((row) =>
                    row.getCanSelect(),
                  );
                  const selected = rows.filter((row) => selection[row.id]).length;
                  const checked = rows.length > 0 && selected === rows.length;
                  const mixed = selected > 0 && !checked;
                  return (
                    <label className="p-checkbox pt-selection-control">
                      <input
                        type="checkbox"
                        aria-label="Select all visible rows"
                        aria-checked={mixed ? 'mixed' : checked}
                        checked={checked}
                        disabled={disabled || rows.length === 0}
                        ref={(input) => {
                          if (input) input.indeterminate = mixed;
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          if (!disabled && rows.length > 0) {
                            selectionAnchorFor(table.atoms.rowSelection).current = null;
                            const checked = event.target.checked;
                            if (selectionRows)
                              table.setRowSelection((previous) => {
                                const next = { ...previous };
                                for (const row of rows) {
                                  if (checked) next[row.id] = true;
                                  else delete next[row.id];
                                }
                                return next;
                              });
                            else table.toggleAllPageRowsSelected(checked);
                          }
                        }}
                      />
                      <span aria-hidden="true" />
                    </label>
                  );
                }}
              </Subscribe>
            </th>
          )}
          {group.headers.map((header) => {
            if (header.isPlaceholder) return <td key={header.id} colSpan={header.colSpan} />;
            const column = header.column;
            const label =
              typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
            const sorted = column.getIsSorted();
            const hasMenu = !disabled && !!getHeaderMenu?.(column).length;
            return (
              <th
                {...(hasMenu ? menu.getTriggerProps(column) : {})}
                key={header.id}
                colSpan={header.colSpan}
                scope={column.columns.length === 0 ? 'col' : 'colgroup'}
                aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {column.getCanSort() ? (
                  <button
                    type="button"
                    className="pt-sort"
                    aria-label={`Sort by ${label}`}
                    disabled={disabled}
                    onClick={() => column.toggleSorting()}
                  >
                    <table.FlexRender header={header} />
                    <span
                      className="pt-sort-arrow"
                      aria-hidden="true"
                      data-direction={sorted || 'none'}
                    >
                      ⌄
                    </span>
                  </button>
                ) : (
                  <table.FlexRender header={header} />
                )}
                {hasMenu && (
                  <button
                    type="button"
                    className="pt-header-menu-trigger"
                    aria-label={`Column options for ${label}`}
                    title={`Column options for ${label}`}
                    aria-haspopup="menu"
                    onClick={(event) => menu.open(column, event)}
                  >
                    ⋯
                  </button>
                )}
                {options.enabled && (
                  <ColumnResizeHandle
                    table={table}
                    header={header}
                    label={label}
                    options={options}
                  />
                )}
              </th>
            );
          })}
        </tr>
      ))}
      <ContextMenu
        ariaLabel="Column options"
        position={disabled ? null : (menu.state?.position ?? null)}
        returnFocus={
          menu.state?.returnFocus?.isConnected
            ? menu.state.returnFocus
            : root.current?.querySelector('button')
        }
        onClose={menu.close}
        actions={menu.state && getHeaderMenu ? getHeaderMenu(menu.state.context) : []}
      />
    </thead>
  );
}
