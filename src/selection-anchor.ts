import type { RefObject } from 'react';

const anchors = new WeakMap<object, RefObject<string | null>>();

/** All selection entry points on a stable selection atom share one anchor, optionally owned by the app. */
export function selectionAnchorFor(selectionAtom: object, external?: RefObject<string | null>) {
  let anchor = external ?? anchors.get(selectionAtom);
  if (!anchor) anchor = { current: null };
  anchors.set(selectionAtom, anchor);
  return anchor;
}
