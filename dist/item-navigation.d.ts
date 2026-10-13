export type ItemNavigationOrientation = 'vertical' | 'horizontal' | 'grid';
export interface ItemNavigationOptions {
    orderedIds: readonly string[];
    currentId: string;
    key: string;
    orientation?: ItemNavigationOrientation;
    /** Number of visual columns in a grid. */
    columns?: number;
}
/** Focus movement stays within the current collection and never wraps at its edges. */
export declare function nextItemId({ orderedIds, currentId, key, orientation, columns, }: ItemNavigationOptions): string | undefined;
