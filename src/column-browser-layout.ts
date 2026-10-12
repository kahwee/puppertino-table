export interface ColumnBrowserLayoutOptions {
  availableWidth: number;
  ancestorWidth: number;
  ancestorCount: number;
  minimumCurrentWidth: number;
}

/** Fit whole ancestor panels beside a current panel, independent of data and rendering.
 * Apply currentWidth to the final panel and scrollLeft to the horizontal scroll surface.
 */
export function fitColumnBrowser({
  availableWidth,
  ancestorWidth,
  ancestorCount,
  minimumCurrentWidth,
}: ColumnBrowserLayoutOptions) {
  if (
    !Number.isFinite(availableWidth) ||
    availableWidth < 0 ||
    !Number.isFinite(ancestorWidth) ||
    ancestorWidth <= 0 ||
    !Number.isInteger(ancestorCount) ||
    ancestorCount < 0 ||
    !Number.isFinite(minimumCurrentWidth) ||
    minimumCurrentWidth < 0
  )
    throw new RangeError(
      'Column dimensions must be finite and nonnegative, with a positive ancestor width and an integer ancestor count.',
    );
  const visibleAncestors = Math.min(
    ancestorCount,
    Math.floor(Math.max(0, availableWidth - minimumCurrentWidth) / ancestorWidth),
  );
  return {
    currentWidth: availableWidth - visibleAncestors * ancestorWidth,
    scrollLeft: (ancestorCount - visibleAncestors) * ancestorWidth,
    visibleAncestors,
  };
}
