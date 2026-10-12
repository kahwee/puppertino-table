'use client';
import type { RowData } from '@tanstack/react-table';
import { useEffect, useRef } from 'react';
import type { PuppertinoTableInstance } from './model.js';
import { type ColumnSizeBounds, readColumnSizing } from './sizing.js';
import type { PuppertinoTableOptions } from './table-options.js';

/** Restore preferences after hydration only while the table owns sizing. */
export function useColumnSizingPersistence<T extends RowData>({
  table,
  bounds,
  appOwned,
  storageKey,
  storage,
}: {
  table: PuppertinoTableInstance<T>;
  bounds: readonly ColumnSizeBounds[];
  appOwned: boolean;
} & Pick<PuppertinoTableOptions<T>, 'storageKey' | 'storage'>) {
  const sizingAtom = table.baseAtoms.columnSizing;
  const restored = useRef<{
    schema: string;
    key: typeof storageKey;
    adapter: typeof storage;
  } | null>(null);
  // Restore only after hydration. This is initialization, not a user resize or storage write.
  useEffect(() => {
    if (appOwned) {
      restored.current = null;
      return;
    }
    const schema = JSON.stringify(bounds);
    if (
      restored.current?.schema === schema &&
      restored.current.key === storageKey &&
      restored.current.adapter === storage
    )
      return;
    restored.current = { schema, key: storageKey, adapter: storage };
    let widths = readColumnSizing(bounds);
    try {
      widths = readColumnSizing(bounds, storageKey, storage ?? window.localStorage);
    } catch {
      widths = readColumnSizing(bounds);
    }
    sizingAtom.set(widths);
  }, [sizingAtom, bounds, storageKey, storage, appOwned]);
}
