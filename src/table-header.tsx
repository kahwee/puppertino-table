'use client';

import { type RowData, Subscribe } from '@tanstack/react-table';
import { useContext, useEffect, useRef } from 'react';
import { ColumnOrderScope, OrderableHeaderCell, reorderColumn } from './column-order.js';
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
  onColumnOrderCommit,
}: TableHeaderProps<T>) {
  const menu = useContextMenu<ReturnType<typeof table.getAllLeafColumns>[number]>();
  const behavior = tableBehavior(table);
  const orderScope = useContext(ColumnOrderScope);
  const selectable = selectionOverride ?? (behavior.selectable && behavior.selectionCheckboxes);
  const disabled = behavior.disabled || !!disabledOverride;
  const root = useRef<HTMLTableSectionElement>(null);
  useEffect(() => {
    if (disabled || (!getHeaderMenu && !behavior.reorderable)) menu.close();
  }, [disabled, getHeaderMenu, behavior.reorderable, menu.close]);
  const resizable = behavior.resizable && resizeOverride !== false;
  const groups = table.getHeaderGroups();
  const headerMenu =
    getHeaderMenu ??
    (behavior.reorderable && groups.length === 1
      ? (column: ReturnType<typeof table.getAllLeafColumns>[number]) => {
          const visible = table.getAllLeafColumns().map((item) => item.id);
          const index = visible.indexOf(column.id);
          return ([-1, 1] as const).map((direction) => ({
            id: `move-${direction}`,
            label: `Move ${typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id} ${direction === -1 ? 'earlier' : 'later'}`,
            disabled:
              behavior.lockedColumns.includes(column.id) ||
              !visible[index + direction] ||
              behavior.lockedColumns.includes(visible[index + direction]),
            onSelect: () => {
              const next = reorderColumn(
                table.atoms.columnOrder.get(),
                visible,
                behavior.lockedColumns,
                column.id,
                visible[index + direction],
              );
              table.setColumnOrder(next);
              onColumnOrderCommit?.(next);
            },
          }));
        }
      : undefined);
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
                    // biome-ignore lint/a11y/useKeyWithClickEvents: The native input owns keyboard activation; this label only isolates bubbling.
                    <label
                      className="p-checkbox pt-selection-control"
                      onClick={(event) => event.stopPropagation()}
                    >
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
            const hasMenu = !disabled && !!headerMenu?.(column).length;
            const triggerProps = hasMenu ? menu.getTriggerProps(column) : {};
            const headerProps = {
              ...triggerProps,
              colSpan: header.colSpan,
              scope: (column.columns.length === 0 ? 'col' : 'colgroup') as 'col' | 'colgroup',
              'aria-sort': sorted
                ? ((sorted === 'asc' ? 'ascending' : 'descending') as 'ascending' | 'descending')
                : undefined,
            };
            const contents = (
              <>
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
                    aria-expanded={!disabled && menu.state?.context.id === column.id}
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
              </>
            );
            return (behavior.reorderable || orderScope) && groups.length === 1 ? (
              <OrderableHeaderCell
                key={header.id}
                id={column.id}
                locked={!behavior.reorderable || behavior.lockedColumns.includes(column.id)}
                {...headerProps}
              >
                {contents}
              </OrderableHeaderCell>
            ) : (
              <th key={header.id} {...headerProps}>
                {contents}
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
        actions={menu.state && headerMenu ? headerMenu(menu.state.context) : []}
      />
    </thead>
  );
}
