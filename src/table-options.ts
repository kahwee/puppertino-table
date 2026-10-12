import type {
  ColumnSizingState,
  ExternalAtoms,
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import type { PuppertinoColumnDef, puppertinoTableFeatures } from './model.js';
/** App-owned writable atoms for the registered table state slices. */
export type PuppertinoTableAtoms = ExternalAtoms<typeof puppertinoTableFeatures>;

/** Shared state contract for complete tables and custom layouts. */
export interface PuppertinoTableOptions<T extends RowData> {
  data: readonly T[];
  /** Atom ownership replaces value/callback ownership for that slice. */
  atoms?: PuppertinoTableAtoms;
  columns: readonly PuppertinoColumnDef<T>[];
  getRowId: (row: T, index: number) => string;
  /** Omit for local state. Controlled state without a callback is read-only. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Initial values apply only on mount to uncontrolled state. */
  initialSorting?: SortingState;
  initialRowSelection?: RowSelectionState;
  /** Preserve host-owned order by default, including server-paginated data. */
  manualSorting?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  selectable?: boolean;
  disabled?: boolean;
  /** App-owned widths; saved preferences are ignored in controlled mode. */
  columnSizing?: ColumnSizingState;
  /** Receives a value or functional updater. Controlled widths without this are read-only. */
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  storageKey?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}
