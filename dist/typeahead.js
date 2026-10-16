/** Search after the focused item, wrapping once without copying the collection. */
export function findTypeaheadMatch(ids, currentId, prefix, getLabel) {
    const start = ids.indexOf(currentId);
    for (let offset = 1; offset <= ids.length; offset++) {
        const id = ids[(start + offset) % ids.length];
        if (getLabel(id).toLocaleLowerCase().startsWith(prefix))
            return id;
    }
    return undefined;
}
