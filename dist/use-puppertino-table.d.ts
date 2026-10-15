import type { RowData } from '@tanstack/react-table';
import { type PuppertinoTableInstance } from './model.js';
import type { PuppertinoTableOptions } from './table-options.js';
/** Shared state wiring for complete tables and custom semantic layouts. */
export declare function usePuppertinoTable<T extends RowData>({ data, columns, atoms, getRowId, getSubRows, sorting: controlledSorting, onSortingChange, initialSorting, initialRowSelection, manualSorting, rowSelection: controlledSelection, onRowSelectionChange, selectable, selectionAnchor, isRowSelectable, disabled, columnSizing, onColumnSizingChange, columnOrder, onColumnOrderChange, initialColumnOrder, reorderable, lockedColumns, selectionCheckboxes, resizable, storageKey, storage, }: PuppertinoTableOptions<T>): PuppertinoTableInstance<T>;
