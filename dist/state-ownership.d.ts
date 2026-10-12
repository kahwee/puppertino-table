import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableAtoms, PuppertinoTableOptions } from './table-options.js';
/** A slice has one owner; reject ambiguous inputs instead of silently shadowing them. */
export declare function validateAtomOwnership<T extends RowData>(options: Pick<PuppertinoTableOptions<T>, 'atoms' | 'sorting' | 'onSortingChange' | 'rowSelection' | 'onRowSelectionChange' | 'columnSizing' | 'onColumnSizingChange'>): void;
/** v9 preserves its atom bindings at construction; changing them requires a remount. */
export declare function validateAtomIdentity(initial: PuppertinoTableAtoms | undefined, next: PuppertinoTableAtoms | undefined): void;
