export interface ColumnBrowserLayoutOptions {
    availableWidth: number;
    ancestorWidth: number;
    ancestorCount: number;
    minimumCurrentWidth: number;
}
/** Fit whole ancestor panels beside a current panel, independent of data and rendering.
 * Apply currentWidth to the final panel and scrollLeft to the horizontal scroll surface.
 */
export declare function fitColumnBrowser({ availableWidth, ancestorWidth, ancestorCount, minimumCurrentWidth, }: ColumnBrowserLayoutOptions): {
    currentWidth: number;
    scrollLeft: number;
    visibleAncestors: number;
};
