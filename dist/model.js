import { createColumnHelper, createSortedRowModel, tableFeatures, rowSortingFeature, columnSizingFeature, rowSelectionFeature } from '@tanstack/react-table';
export const puppertinoTableFeatures = tableFeatures({ rowSortingFeature, columnSizingFeature, rowSelectionFeature, sortedRowModel: createSortedRowModel() });
export function createPuppertinoColumnHelper() { return createColumnHelper(); }
