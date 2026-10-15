export type ItemNavigationOrientation = 'vertical' | 'horizontal' | 'grid';

export interface ItemNavigationOptions {
  orderedIds: readonly string[];
  currentId: string;
  key: string;
  orientation?: ItemNavigationOrientation;
  /** Number of visual columns in a grid. */
  columns?: number;
}

// Cache only frozen inputs: mutable caller arrays must reflect in-place edits.
const preparedOrders = new WeakMap<
  readonly string[],
  { ids: string[]; index: Map<string, number> }
>();
function prepareOrder(order: readonly string[]) {
  if (!Object.isFrozen(order)) return { ids: [...new Set(order)], index: undefined };
  const cached = preparedOrders.get(order);
  if (cached) return cached;
  const ids = [...new Set(order)];
  const prepared = { ids, index: new Map(ids.map((id, index) => [id, index])) };
  preparedOrders.set(order, prepared);
  return prepared;
}

/** Focus movement stays within the current collection and never wraps at its edges. */
export function nextItemId({
  orderedIds,
  currentId,
  key,
  orientation = 'vertical',
  columns = 1,
}: ItemNavigationOptions): string | undefined {
  if (!orderedIds.length) return;
  if (key === 'Home') return orderedIds[0];
  const stride =
    orientation === 'grid' && Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
  let offset = 0;
  if (key === 'ArrowDown' && orientation !== 'horizontal') offset = stride;
  if (key === 'ArrowUp' && orientation !== 'horizontal') offset = -stride;
  if (key === 'ArrowRight' && orientation !== 'vertical') offset = 1;
  if (key === 'ArrowLeft' && orientation !== 'vertical') offset = -1;
  if (!offset && key !== 'End') return;
  const { ids, index: positions } = prepareOrder(orderedIds);
  if (key === 'End') return ids.at(-1);
  const index = positions ? (positions.get(currentId) ?? -1) : ids.indexOf(currentId);
  if (index < 0) return offset > 0 ? ids[0] : ids.at(-1);
  // Horizontal grid movement must not jump into the next visual row.
  if (
    orientation === 'grid' &&
    (key === 'ArrowRight' || key === 'ArrowLeft') &&
    Math.floor(index / stride) !== Math.floor((index + offset) / stride)
  )
    return currentId;
  const next = index + offset;
  return next < 0 || next >= ids.length ? currentId : ids[next];
}
