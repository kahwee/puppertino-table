import type { RowData } from '@tanstack/react-table';
import {
  type ColumnDef,
  columnSizingFeature,
  createColumnHelper,
  createSortedRowModel,
  metaHelper,
  type ReactTable,
  type RowSelectionState,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
  tableFeatures,
} from '@tanstack/react-table';
import type { TableBehavior } from './table-behavior.js';
export const puppertinoTableFeatures = tableFeatures({
  rowSortingFeature,
  columnSizingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
    textCaseSensitive: sortFn_textCaseSensitive,
  },
  tableMeta: metaHelper<{ puppertino: TableBehavior }>(),
});
export type PuppertinoTableInstance<T extends RowData> = ReactTable<
  typeof puppertinoTableFeatures,
  T,
  { sorting: SortingState; rowSelection: RowSelectionState }
>;
export type PuppertinoColumnDef<T extends RowData> = ColumnDef<typeof puppertinoTableFeatures, T>;

export function createPuppertinoColumnHelper<T extends RowData>() {
  return createColumnHelper<typeof puppertinoTableFeatures, T>();
}
