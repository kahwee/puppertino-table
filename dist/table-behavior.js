export const tableDefaults = {
    manualSorting: false,
    selectable: false,
    selectionCheckboxes: true,
    disabled: false,
    resizable: true,
    reorderable: false,
    lockedColumns: [],
};
export function tableBehavior(table) {
    return (table.options.meta?.puppertino ?? {
        ...tableDefaults,
        selectable: table.options.enableRowSelection === true,
    });
}
