import type { RowData } from '@tanstack/react-table';
import {
  type ColumnDef,
  columnSizingFeature,
  createColumnHelper,
  createSortedRowModel,
  type ReactTable,
  type RowSelectionState,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  tableFeatures,
} from '@tanstack/react-table';
export const puppertinoTableFeatures = tableFeatures({
  rowSortingFeature,
  columnSizingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
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
