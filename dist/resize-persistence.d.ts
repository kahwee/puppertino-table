import type { ResizeMember } from './resize-controller.js';
/** Persist only completed operations; storage failure never prevents resizing. */
export declare function persistResize({ adapter, options }: ResizeMember): void;
