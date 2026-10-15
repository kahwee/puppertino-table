import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableAtoms, PuppertinoTableOptions } from './table-options.js';

/** A slice has one owner; reject ambiguous inputs instead of silently shadowing them. */
export function validateAtomOwnership<T extends RowData>(
  options: Pick<
    PuppertinoTableOptions<T>,
    | 'atoms'
    | 'sorting'
    | 'onSortingChange'
    | 'rowSelection'
    | 'onRowSelectionChange'
    | 'columnSizing'
    | 'onColumnSizingChange'
    | 'columnOrder'
    | 'onColumnOrderChange'
  >,
) {
  for (const [slice, callback] of [
    ['sorting', 'onSortingChange'],
    ['rowSelection', 'onRowSelectionChange'],
    ['columnSizing', 'onColumnSizingChange'],
    ['columnOrder', 'onColumnOrderChange'],
  ] as const) {
    if (options.atoms?.[slice] && (options[slice] !== undefined || options[callback] !== undefined))
      throw new Error(
        `Choose atoms.${slice} or ${slice}/${callback}; a state slice must have one owner.`,
      );
  }
}

/** v9 preserves its atom bindings at construction; changing them requires a remount. */
export function validateAtomIdentity(
  initial: PuppertinoTableAtoms | undefined,
  next: PuppertinoTableAtoms | undefined,
) {
  for (const slice of ['sorting', 'rowSelection', 'columnSizing', 'columnOrder'] as const) {
    if (initial?.[slice] !== next?.[slice])
      throw new Error(
        `atoms.${slice} cannot change after mount; remount the table with a new React key.`,
      );
  }
}
