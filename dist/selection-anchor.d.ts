import type { RefObject } from 'react';
/** All selection entry points on a stable selection atom share one anchor, optionally owned by the app. */
export declare function selectionAnchorFor(selectionAtom: object, external?: RefObject<string | null>): RefObject<string | null>;
