/** Search after the focused item, wrapping once without copying the collection. */
export function findTypeaheadMatch(
  ids: readonly string[],
  currentId: string,
  prefix: string,
  getLabel: (id: string) => string,
): string | undefined {
  const start = ids.indexOf(currentId);
  for (let offset = 1; offset <= ids.length; offset++) {
    const id = ids[(start + offset) % ids.length];
    if (getLabel(id).toLocaleLowerCase().startsWith(prefix)) return id;
  }
  return undefined;
}
