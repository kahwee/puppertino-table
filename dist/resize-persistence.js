/** Persist only completed operations; storage failure never prevents resizing. */
export function persistResize({ adapter, options }) {
    try {
        if (options.storageKey)
            (options.storage || localStorage).setItem(options.storageKey, JSON.stringify(adapter.snapshot()));
    }
    catch { /* Storage is optional. */ }
}
