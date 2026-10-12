import { columnSizingFeature, createColumnHelper, createSortedRowModel, rowSelectionFeature, rowSortingFeature, tableFeatures, } from '@tanstack/react-table';
export const puppertinoTableFeatures = tableFeatures({
    rowSortingFeature,
    columnSizingFeature,
    rowSelectionFeature,
    sortedRowModel: createSortedRowModel(),
});
export function createPuppertinoColumnHelper() {
    return createColumnHelper();
}
