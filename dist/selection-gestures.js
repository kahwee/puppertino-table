/** Caller-owned order can include leading items and custom layouts, not only table rows.
 * Toggle gestures preserve selections outside that order; replacing gestures clear them.
 */
export function applySelectionGesture(orderedIds, selection, anchor, id, { shift = false, toggle = false } = {}) {
    if (!orderedIds.includes(id))
        return { selection, anchor };
    // Ordinary clicks need no deduplication or range allocation.
    if (shift && anchor !== null && orderedIds.includes(anchor)) {
        const ids = [...new Set(orderedIds)];
        const start = ids.indexOf(anchor);
        const end = ids.indexOf(id);
        const range = Object.fromEntries(ids.slice(Math.min(start, end), Math.max(start, end) + 1).map((key) => [key, true]));
        return { selection: toggle ? { ...selection, ...range } : range, anchor };
    }
    if (toggle) {
        const next = { ...selection, [id]: true };
        if (selection[id] === true)
            delete next[id];
        return { selection: next, anchor: id };
    }
    return { selection: { [id]: true }, anchor: id };
}
