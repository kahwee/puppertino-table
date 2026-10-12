/** Persist only completed operations; storage failure never prevents resizing. */
export function persistResize({ adapter, options }, widths = adapter.snapshot()) {
    try {
        if (options.storageKey)
            (options.storage || localStorage).setItem(options.storageKey, JSON.stringify(widths));
    }
    catch {
        /* Storage is optional. */
    }
    options.onCommit?.({ ...widths });
}
