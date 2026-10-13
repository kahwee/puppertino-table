import { type RefObject } from 'react';
/** Keep the native top-layer panel anchored without losing inherited theme variables. */
export declare function useTagPopover(open: boolean, anchor: RefObject<HTMLButtonElement | null>, panel: RefObject<HTMLDivElement | null>, input: RefObject<HTMLInputElement | null>): void;
