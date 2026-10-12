'use client';
import { useEffect, useRef, useState } from 'react';
import {
  browserWidthPreferences,
  mergeBrowserWidthPreferences,
} from './browser-width-preferences.js';
import type { ColumnBrowserProps, ColumnBrowserWidths } from './column-browser.js';

/** Restore after hydration, retain hidden panels, and write only committed widths. */
export function useBrowserWidthPreferences({
  appOwned,
  storageKey,
  storage,
}: Pick<ColumnBrowserProps, 'storageKey' | 'storage'> & { appOwned: boolean }) {
  const [widths, setWidths] = useState<ColumnBrowserWidths>({});
  const committed = useRef<ColumnBrowserWidths>({});
  useEffect(() => {
    let saved: ColumnBrowserWidths = {};
    try {
      if (!appOwned && storageKey)
        saved = browserWidthPreferences(
          JSON.parse((storage ?? window.localStorage).getItem(storageKey) || '{}'),
        );
    } catch {
      /* Defaults remain usable when storage is unavailable. */
    }
    committed.current = saved;
    setWidths(saved);
  }, [appOwned, storageKey, storage]);
  return {
    widths,
    apply: (next: ColumnBrowserWidths) => setWidths({ ...committed.current, ...next }),
    commit: (next: ColumnBrowserWidths) => {
      if (appOwned) return;
      committed.current = mergeBrowserWidthPreferences(committed.current, next);
      setWidths({ ...committed.current, ...next });
      try {
        if (storageKey)
          (storage ?? window.localStorage).setItem(storageKey, JSON.stringify(committed.current));
      } catch {
        /* Completion callbacks and browsing survive storage failure. */
      }
    },
  };
}
