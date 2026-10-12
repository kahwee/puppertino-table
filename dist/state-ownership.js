/** A slice has one owner; reject ambiguous inputs instead of silently shadowing them. */
export function validateAtomOwnership(options) {
    for (const [slice, callback] of [
        ['sorting', 'onSortingChange'],
        ['rowSelection', 'onRowSelectionChange'],
        ['columnSizing', 'onColumnSizingChange'],
    ]) {
        if (options.atoms?.[slice] && (options[slice] !== undefined || options[callback] !== undefined))
            throw new Error(`Choose atoms.${slice} or ${slice}/${callback}; a state slice must have one owner.`);
    }
}
/** v9 preserves its atom bindings at construction; changing them requires a remount. */
export function validateAtomIdentity(initial, next) {
    for (const slice of ['sorting', 'rowSelection', 'columnSizing']) {
        if (initial?.[slice] !== next?.[slice])
            throw new Error(`atoms.${slice} cannot change after mount; remount the table with a new React key.`);
    }
}
