export function clampSize(value, bounds) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(bounds.minSize, Math.min(bounds.maxSize, Math.round(value))) : bounds.size;
}
/** Unknown/stale column IDs and nonnumeric preferences never enter table state. */
export function readColumnSizing(bounds, key, storage) {
    let saved = {};
    try {
        const value = key ? JSON.parse(storage?.getItem(key) || '{}') : {};
        if (value && typeof value === 'object' && !Array.isArray(value))
            saved = value;
    }
    catch { /* Unavailable or malformed storage uses defaults. */ }
    return Object.fromEntries(bounds.map(bound => [bound.id, clampSize(saved[bound.id], bound)]));
}
export function columnSizeBounds(columns) {
    const flatten = (defs) => defs.flatMap(column => column.columns ? flatten(column.columns) : [column]);
    const leaves = flatten(columns);
    const ids = new Set();
    return leaves.map(column => {
        const id = column.id ?? (typeof column.accessorKey === 'string' ? column.accessorKey.replaceAll('.', '_') : undefined);
        if (!id || ids.has(id))
            throw new Error('Every leaf column needs a unique stable id or accessorKey.');
        ids.add(id);
        const minSize = column.minSize ?? 20;
        const maxSize = column.maxSize ?? 1200;
        if (!Number.isFinite(minSize) || !Number.isFinite(maxSize) || minSize <= 0 || maxSize < minSize)
            throw new Error(`Invalid width bounds for ${id}.`);
        const size = clampSize(column.size ?? 150, { id, size: Math.max(minSize, Math.min(maxSize, 150)), minSize, maxSize });
        return { id, size, minSize, maxSize };
    });
}
