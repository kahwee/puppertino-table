'use client';
import { useEffect, useRef } from 'react';
import { readColumnSizing } from './sizing.js';
/** Restore preferences after hydration only while the table owns sizing. */
export function useColumnSizingPersistence({ table, bounds, appOwned, storageKey, storage, }) {
    const sizingAtom = table.baseAtoms.columnSizing;
    const restored = useRef(null);
    // Restore only after hydration. This is initialization, not a user resize or storage write.
    useEffect(() => {
        if (appOwned) {
            restored.current = null;
            return;
        }
        const schema = JSON.stringify(bounds);
        if (restored.current?.schema === schema &&
            restored.current.key === storageKey &&
            restored.current.adapter === storage)
            return;
        restored.current = { schema, key: storageKey, adapter: storage };
        let widths = readColumnSizing(bounds);
        try {
            widths = readColumnSizing(bounds, storageKey, storage ?? window.localStorage);
        }
        catch {
            widths = readColumnSizing(bounds);
        }
        sizingAtom.set(widths);
    }, [sizingAtom, bounds, storageKey, storage, appOwned]);
}
