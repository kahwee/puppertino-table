export type OutlineExpandedState = Record<string, boolean>;
export type OutlineLoadState = {
    status: 'loading';
} | {
    status: 'error';
    error: unknown;
};
export interface OutlineOptions<T> {
    data: readonly T[];
    getItemId(item: T): string;
    /** Return undefined for children that have not been fetched, [] for a known empty branch. */
    getChildren?(item: T): readonly T[] | undefined;
    /** Required for lazy branches whose children are not yet known. */
    hasChildren?(item: T): boolean;
    /** App-owned API/authentication. Called on expansion, with cancellation on collapse/unmount. */
    loadChildren?(item: T, context: {
        signal: AbortSignal;
    }): Promise<readonly T[]>;
    expanded?: OutlineExpandedState;
    onExpandedChange?(expanded: OutlineExpandedState): void;
    initialExpanded?: OutlineExpandedState;
    disabled?: boolean;
    /** Change when replacing the data source; clears cached children and cancels pending requests. */
    cacheKey?: string;
}
/** Validate a tree before passing it to the table model; IDs must be globally unique. */
export declare function validateOutlineItems<T>(items: readonly T[], getItemId: (item: T) => string, getChildren: (item: T) => readonly T[] | undefined): void;
/** Data-independent expansion and cancellable lazy children. Successful results are cached. */
export declare function useOutline<T>(options: OutlineOptions<T>): {
    expanded: OutlineExpandedState;
    childrenFor: (item: T) => readonly T[] | undefined;
    canExpand: (item: T) => boolean;
    setExpanded: (item: T, value: boolean, recursive?: boolean) => Promise<void>;
    loads: ReadonlyMap<string, OutlineLoadState>;
    loadedChildren: ReadonlyMap<string, readonly T[]>;
    retry: (item: T) => Promise<readonly T[] | undefined>;
    readOnly: boolean;
};
