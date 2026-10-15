import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance } from './model.js';

export const tableDefaults = {
  manualSorting: false,
  selectable: false,
  selectionCheckboxes: true,
  disabled: false,
  resizable: true,
  reorderable: false,
  lockedColumns: [] as readonly string[],
} as const;

/** Shared UI policy; writable selection is resolved independently by TanStack. */
export interface TableBehavior {
  selectable: boolean;
  selectionCheckboxes: boolean;
  disabled: boolean;
  resizable: boolean;
  reorderable: boolean;
  lockedColumns: readonly string[];
}

export function tableBehavior<T extends RowData>(table: PuppertinoTableInstance<T>): TableBehavior {
  return (
    table.options.meta?.puppertino ?? {
      ...tableDefaults,
      selectable: table.options.enableRowSelection === true,
    }
  );
}
