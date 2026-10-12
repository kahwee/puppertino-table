/** Bounded preference cache, including panels temporarily outside the current hierarchy. */
export function browserWidthPreferences(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return {};
    return Object.fromEntries(Object.entries(value)
        .filter(([id, width]) => id.length > 0 &&
        id.length <= 1024 &&
        typeof width === 'number' &&
        Number.isFinite(width) &&
        width > 0)
        .slice(-100)
        .map(([id, width]) => [id, Math.max(1, Math.round(width))]));
}
export function mergeBrowserWidthPreferences(previous, next) {
    return browserWidthPreferences(Object.fromEntries([
        ...Object.entries(previous).filter(([id]) => !Object.hasOwn(next, id)),
        ...Object.entries(next),
    ]));
}
