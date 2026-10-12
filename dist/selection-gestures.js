/** Caller-owned order can include leading items and custom layouts, not only table rows.
 * Toggle gestures preserve selections outside that order; replacing gestures clear them.
 */
export function applySelectionGesture(orderedIds, selection, anchor, id, { shift = false, toggle = false } = {}) {
    const ids = [...new Set(orderedIds)];
    const end = ids.indexOf(id);
    if (end === -1)
        return { selection, anchor };
    const start = anchor === null ? -1 : ids.indexOf(anchor);
    if (shift && start !== -1) {
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
