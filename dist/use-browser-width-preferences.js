'use client';
import { useEffect, useRef, useState } from 'react';
import { browserWidthPreferences, mergeBrowserWidthPreferences, } from './browser-width-preferences.js';
/** Restore after hydration, retain hidden panels, and write only committed widths. */
export function useBrowserWidthPreferences({ appOwned, storageKey, storage, }) {
    const [widths, setWidths] = useState({});
    const committed = useRef({});
    useEffect(() => {
        let saved = {};
        try {
            if (!appOwned && storageKey)
                saved = browserWidthPreferences(JSON.parse((storage ?? window.localStorage).getItem(storageKey) || '{}'));
        }
        catch {
            /* Defaults remain usable when storage is unavailable. */
        }
        committed.current = saved;
        setWidths(saved);
    }, [appOwned, storageKey, storage]);
    return {
        widths,
        apply: (next) => setWidths({ ...committed.current, ...next }),
        commit: (next) => {
            if (appOwned)
                return;
            committed.current = mergeBrowserWidthPreferences(committed.current, next);
            setWidths({ ...committed.current, ...next });
            try {
                if (storageKey)
                    (storage ?? window.localStorage).setItem(storageKey, JSON.stringify(committed.current));
            }
            catch {
                /* Completion callbacks and browsing survive storage failure. */
            }
        },
    };
}
