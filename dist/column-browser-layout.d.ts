export interface ColumnBrowserLayoutOptions {
    availableWidth: number;
    ancestorWidth: number;
    ancestorCount: number;
    minimumCurrentWidth: number;
}
/** Variable-width equivalent used by independently resizable browser panels. */
export declare function fitColumnPanels(availableWidth: number, ancestorWidths: readonly number[], minimumCurrentWidth: number): {
    currentWidth: number;
    scrollLeft: number;
    visibleAncestors: number;
};
/** Fit whole ancestor panels beside a current panel, independent of data and rendering.
 * Apply currentWidth to the final panel and scrollLeft to the horizontal scroll surface.
 */
export declare function fitColumnBrowser({ availableWidth, ancestorWidth, ancestorCount, minimumCurrentWidth, }: ColumnBrowserLayoutOptions): {
    currentWidth: number;
    scrollLeft: number;
    visibleAncestors: number;
};
