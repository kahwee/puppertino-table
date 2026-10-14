'use client';
import { useCreateAtom } from '@tanstack/react-store';
import type { ColumnSizingState } from '@tanstack/react-table';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ColumnLayout,
  type ColumnLayoutColumn,
  moveLayoutColumn,
  normalizeColumnLayout,
  readColumnLayout,
} from './column-layout.js';

export interface ColumnLayoutOptions {
  columns: readonly ColumnLayoutColumn[];
  storageKey: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  /** Read existing width-only preferences when no saved layout exists. */
  legacyWidthsKey?: string;
}

/** Width previews stay in an atom; only structural changes rerender the owner. */
export function useColumnLayout({
  columns,
  storageKey,
  storage,
  legacyWidthsKey,
}: ColumnLayoutOptions) {
  const committed = useRef<ColumnLayout>(normalizeColumnLayout(columns));
  const columnSizing = useCreateAtom<ColumnSizingState>(committed.current.widths);
  const [layout, setLayout] = useState(committed.current);
  const [ready, setReady] = useState(false);
  const adapter = useCallback(() => storage ?? window.localStorage, [storage]);
  useEffect(() => {
    let restored = normalizeColumnLayout(columns);
    try {
      const text = adapter().getItem(storageKey);
      restored = readColumnLayout(columns, text);
      if (text === null && legacyWidthsKey) {
        const widths: unknown = JSON.parse(adapter().getItem(legacyWidthsKey) ?? '{}');
        restored = normalizeColumnLayout(columns, { ...restored, widths });
      }
    } catch {
      /* Storage is optional; restore safe defaults. */
    }
    committed.current = restored;
    columnSizing.set(restored.widths);
    setLayout(restored);
    setReady(true);
  }, [columns, adapter, storageKey, legacyWidthsKey, columnSizing]);
  const save = useCallback(
    (next: ColumnLayout, structural: boolean) => {
      committed.current = next;
      columnSizing.set(next.widths);
      if (structural) setLayout(next);
      try {
        adapter().setItem(storageKey, JSON.stringify(next));
      } catch {
        /* Keep this visit's layout. */
      }
    },
    [adapter, storageKey, columnSizing],
  );
  const setVisible = useCallback(
    (id: string, visible: boolean) => {
      const column = columns.find((column) => column.id === id);
      if (!ready || !column || column.required || column.pinned) return;
      const hidden = new Set(committed.current.hidden);
      if (visible) hidden.delete(id);
      else hidden.add(id);
      save(normalizeColumnLayout(columns, { ...committed.current, hidden: [...hidden] }), true);
    },
    [columns, ready, save],
  );
  const move = useCallback(
    (id: string, direction: -1 | 1, eligibleIds?: readonly string[]) => {
      if (!ready) return;
      const next = moveLayoutColumn(columns, committed.current, id, direction, eligibleIds);
      if (next !== committed.current) save(next, true);
    },
    [columns, ready, save],
  );
  const commitWidths = useCallback(
    (widths: ColumnSizingState) => {
      if (ready)
        save(
          normalizeColumnLayout(columns, {
            ...committed.current,
            widths: { ...committed.current.widths, ...widths },
          }),
          false,
        );
    },
    [columns, ready, save],
  );
  const reset = useCallback(() => {
    if (ready) save(normalizeColumnLayout(columns), true);
  }, [columns, ready, save]);
  return {
    get layout() {
      return committed.current;
    },
    hidden: layout.hidden,
    order: layout.order,
    ready,
    columnSizing,
    setVisible,
    move,
    commitWidths,
    reset,
  };
}
