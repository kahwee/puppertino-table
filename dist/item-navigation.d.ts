export type ItemNavigationOrientation = 'vertical' | 'horizontal' | 'grid';
export interface ItemNavigationOptions {
    orderedIds: readonly string[];
    currentId: string;
    key: string;
    orientation?: ItemNavigationOrientation;
    /** Number of visual columns in a grid. */
    columns?: number;
    /** Visual rows per PageUp/PageDown, default 10. Grid pages preserve the column stride. */
    pageSize?: number;
}
/** Focus movement stays within the current collection and never wraps at its edges. */
export declare function nextItemId({ orderedIds, currentId, key, orientation, columns, pageSize, }: ItemNavigationOptions): string | undefined;
/** Composition must remain owned by the input method, including legacy keyCode 229 events. */
export declare function isCompositionKey(event: {
    isComposing?: boolean;
    keyCode?: number;
}): boolean;
/** Read geometry only for page keys; use the nearest vertical scrolling viewport. */
export declare function itemPageSize(element: HTMLElement | null | undefined): number;
