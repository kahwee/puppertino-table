import type { RowData } from '@tanstack/react-table';
import { createColumnHelper, createSortedRowModel, tableFeatures, rowSortingFeature, columnSizingFeature, rowSelectionFeature, type ReactTable, type SortingState, type RowSelectionState, type ColumnDef } from '@tanstack/react-table';
export const puppertinoTableFeatures = tableFeatures({ rowSortingFeature, columnSizingFeature, rowSelectionFeature, sortedRowModel: createSortedRowModel() });
export type PuppertinoTableInstance<T extends RowData> = ReactTable<typeof puppertinoTableFeatures, T, { sorting: SortingState; rowSelection: RowSelectionState }>;
export type PuppertinoColumnDef<T extends RowData> = ColumnDef<typeof puppertinoTableFeatures, T>;

export function createPuppertinoColumnHelper<T extends RowData>() { return createColumnHelper<typeof puppertinoTableFeatures, T>(); }
