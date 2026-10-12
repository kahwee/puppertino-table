import type { RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance } from './model.js';
import { type ColumnSizeBounds } from './sizing.js';
import type { PuppertinoTableOptions } from './table-options.js';
/** Restore preferences after hydration only while the table owns sizing. */
export declare function useColumnSizingPersistence<T extends RowData>({ table, bounds, appOwned, storageKey, storage, }: {
    table: PuppertinoTableInstance<T>;
    bounds: readonly ColumnSizeBounds[];
    appOwned: boolean;
} & Pick<PuppertinoTableOptions<T>, 'storageKey' | 'storage'>): void;
