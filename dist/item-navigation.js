// Cache only frozen inputs: mutable caller arrays must reflect in-place edits.
const preparedOrders = new WeakMap();
function prepareOrder(order) {
    if (!Object.isFrozen(order))
        return { ids: [...new Set(order)], index: undefined };
    const cached = preparedOrders.get(order);
    if (cached)
        return cached;
    const ids = [...new Set(order)];
    const prepared = { ids, index: new Map(ids.map((id, index) => [id, index])) };
    preparedOrders.set(order, prepared);
    return prepared;
}
/** Focus movement stays within the current collection and never wraps at its edges. */
export function nextItemId({ orderedIds, currentId, key, orientation = 'vertical', columns = 1, pageSize = 10, }) {
    if (!orderedIds.length)
        return;
    if (key === 'Home')
        return orderedIds[0];
    const stride = orientation === 'grid' && Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
    let offset = 0;
    if (key === 'ArrowDown' && orientation !== 'horizontal')
        offset = stride;
    if (key === 'ArrowUp' && orientation !== 'horizontal')
        offset = -stride;
    if (key === 'ArrowRight' && orientation !== 'vertical')
        offset = 1;
    if (key === 'ArrowLeft' && orientation !== 'vertical')
        offset = -1;
    const paging = orientation !== 'horizontal' && (key === 'PageUp' || key === 'PageDown');
    if (paging) {
        const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;
        offset = stride * size * (key === 'PageUp' ? -1 : 1);
    }
    if (!offset && key !== 'End')
        return;
    const { ids, index: positions } = prepareOrder(orderedIds);
    if (key === 'End')
        return ids.at(-1);
    const index = positions ? (positions.get(currentId) ?? -1) : ids.indexOf(currentId);
    if (index < 0)
        return offset > 0 ? ids[0] : ids.at(-1);
    // Horizontal grid movement must not jump into the next visual row.
    if (orientation === 'grid' &&
        (key === 'ArrowRight' || key === 'ArrowLeft') &&
        Math.floor(index / stride) !== Math.floor((index + offset) / stride))
        return currentId;
    const next = paging ? Math.max(0, Math.min(ids.length - 1, index + offset)) : index + offset;
    return next < 0 || next >= ids.length ? currentId : ids[next];
}
/** Composition must remain owned by the input method, including legacy keyCode 229 events. */
export function isCompositionKey(event) {
    return event.isComposing === true || event.keyCode === 229;
}
/** Read geometry only for page keys; use the nearest vertical scrolling viewport. */
export function itemPageSize(element) {
    if (!element)
        return 10;
    const view = element.ownerDocument.defaultView;
    let parent = element.parentElement;
    while (parent) {
        if (parent.clientHeight > 0 &&
            /auto|scroll|overlay/.test(view?.getComputedStyle(parent).overflowY ?? ''))
            break;
        parent = parent.parentElement;
    }
    const header = element.closest('table')?.tHead?.getBoundingClientRect().height ?? 0;
    const height = (parent?.clientHeight ?? view?.innerHeight ?? 0) - header;
    const row = element.getBoundingClientRect().height;
    return height > 0 && row > 0 ? Math.max(1, Math.floor(height / row)) : 10;
}
