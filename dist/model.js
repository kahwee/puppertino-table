import { columnOrderingFeature, columnSizingFeature, createColumnHelper, createSortedRowModel, metaHelper, rowSelectionFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_alphanumericCaseSensitive, sortFn_basic, sortFn_datetime, sortFn_text, sortFn_textCaseSensitive, tableFeatures, } from '@tanstack/react-table';
export const puppertinoTableFeatures = tableFeatures({
    rowSortingFeature,
    columnSizingFeature,
    columnOrderingFeature,
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
    tableMeta: metaHelper(),
});
export function createPuppertinoColumnHelper() {
    return createColumnHelper();
}
