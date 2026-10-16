/** Search after the focused item, wrapping once without copying the collection. */
export declare function findTypeaheadMatch(ids: readonly string[], currentId: string, prefix: string, getLabel: (id: string) => string): string | undefined;
