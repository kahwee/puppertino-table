import type {
  ColumnSizingState,
  ExternalAtoms,
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import type { RefObject } from 'react';
import type { PuppertinoColumnDef, puppertinoTableFeatures } from './model.js';
/** App-owned writable atoms for the registered table state slices. */
export type PuppertinoTableAtoms = ExternalAtoms<typeof puppertinoTableFeatures>;

/** Shared state contract for complete tables and custom layouts. */
interface TableOptions<T extends RowData> {
  /** Supplied rows only; pagination and fetching remain app-owned. */
  data: readonly T[];
  /** Atom ownership replaces value/callback ownership for that slice. */
  atoms?: PuppertinoTableAtoms;
  /** Stable IDs or string accessor keys are required for sizing and persistence. */
  columns: readonly PuppertinoColumnDef<T>[];
  /** Stable unique ID, independent of current sorting or page position. */
  getRowId: (row: T, index: number) => string;
  /** Synchronous nested rows; async fetching belongs in OutlineView/loadChildren. */
  getSubRows?: (row: T, index: number) => readonly T[] | undefined;
  /** Omit for local state. Controlled state without a callback is read-only. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Initial values apply only on mount to uncontrolled state. */
  initialSorting?: SortingState;
  /** Mount-only seed for internally owned selection; ignored for controlled/atom state. */
  initialRowSelection?: RowSelectionState;
  /** Sort supplied rows locally by default. Set true for server pages or app-owned order. */
  manualSorting?: boolean;
  /** Omit for local selection; a value without a callback is read-only. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Enable row selection. Default: false. Selection never authorizes an action. */
  selectable?: boolean;
  /** Shared range anchor for checkboxes, row gestures and other layouts. */
  selectionAnchor?: RefObject<string | null>;
  /** Disable sorting, selection and resizing across complete and custom layouts. */
  disabled?: boolean;
  /** Show selection checkboxes in complete and primitive layouts. Default: true. */
  selectionCheckboxes?: boolean;
  /** Enable resizing across complete and primitive layouts. Default: true. */
  resizable?: boolean;
  /** App-owned widths; saved preferences are ignored in controlled mode. */
  columnSizing?: ColumnSizingState;
  /** Receives a value or updater; observes internal changes when widths are omitted.
   * Controlled widths without this are read-only. Atom owners subscribe to their atom instead. */
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  /** Restore internal widths after hydration; complete-table resizing saves on completion. */
  storageKey?: string;
  /** Defaults to browser localStorage. Unavailable storage is handled safely. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** One owner per slice; other slices may use a different ownership mode. */
type SliceOwnership<
  K extends 'sorting' | 'rowSelection' | 'columnSizing',
  C extends keyof TableOptions<RowData>,
> =
  | ({ atoms?: { [P in K]?: never } } & Pick<TableOptions<RowData>, K | C>)
  | ({ atoms?: Pick<PuppertinoTableAtoms, K> } & { [P in K | C]?: never });

export type PuppertinoTableOptions<T extends RowData> = TableOptions<T> &
  SliceOwnership<'sorting', 'onSortingChange'> &
  SliceOwnership<'rowSelection', 'onRowSelectionChange'> &
  SliceOwnership<'columnSizing', 'onColumnSizingChange'>;
