import type { ResizeMember } from './resize-controller.js';
/** Persist only completed operations; storage failure never prevents resizing. */
export function persistResize({ adapter, options }: ResizeMember, widths = adapter.snapshot()) {
  try {
    if (options.storageKey)
      (options.storage || localStorage).setItem(options.storageKey, JSON.stringify(widths));
  } catch {
    /* Storage is optional. */
  }
  options.onCommit?.({ ...widths });
}
