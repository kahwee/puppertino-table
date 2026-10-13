const anchors = new WeakMap();
/** All selection entry points on a stable selection atom share one anchor, optionally owned by the app. */
export function selectionAnchorFor(selectionAtom, external) {
    let anchor = external ?? anchors.get(selectionAtom);
    if (!anchor)
        anchor = { current: null };
    anchors.set(selectionAtom, anchor);
    return anchor;
}
