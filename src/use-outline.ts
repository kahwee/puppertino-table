'use client';
import { useEffect, useRef, useState } from 'react';

export type OutlineExpandedState = Record<string, boolean>;
export type OutlineLoadState = { status: 'loading' } | { status: 'error'; error: unknown };
export interface OutlineOptions<T> {
  data: readonly T[];
  getItemId(item: T): string;
  /** Return undefined for children that have not been fetched, [] for a known empty branch. */
  getChildren?(item: T): readonly T[] | undefined;
  /** Required for lazy branches whose children are not yet known. */
  hasChildren?(item: T): boolean;
  /** App-owned API/authentication. Called on expansion, with cancellation on collapse/unmount. */
  loadChildren?(item: T, context: { signal: AbortSignal }): Promise<readonly T[]>;
  expanded?: OutlineExpandedState;
  onExpandedChange?(expanded: OutlineExpandedState): void;
  initialExpanded?: OutlineExpandedState;
  disabled?: boolean;
  /** Change when replacing the data source; clears cached children and cancels pending requests. */
  cacheKey?: string;
}

/** Validate a tree before passing it to the table model; IDs must be globally unique. */
export function validateOutlineItems<T>(
  items: readonly T[],
  getItemId: (item: T) => string,
  getChildren: (item: T) => readonly T[] | undefined,
) {
  const ids = new Set<string>();
  const stack = [...items];
  while (stack.length) {
    const item = stack.pop();
    if (item === undefined) continue;
    const id = getItemId(item);
    if (typeof id !== 'string' || !id || ids.has(id))
      throw new Error('Outline items need globally unique, nonempty IDs.');
    ids.add(id);
    stack.push(...(getChildren(item) ?? []));
  }
}

/** Data-independent expansion and cancellable lazy children. Successful results are cached. */
export function useOutline<T>(options: OutlineOptions<T>) {
  const [localExpanded, setLocalExpanded] = useState(options.initialExpanded ?? {});
  const [loaded, setLoaded] = useState<ReadonlyMap<string, readonly T[]>>(new Map());
  const [loads, setLoads] = useState<ReadonlyMap<string, OutlineLoadState>>(new Map());
  const pending = useRef(new Map<string, AbortController>());
  const cache = useRef(new Map<string, readonly T[]>());
  const current = useRef(options);
  current.current = options;
  const mounted = useRef(true);
  const cacheKey = useRef(options.cacheKey);
  const expanded = options.expanded ?? localExpanded;
  const expansion = useRef(expanded);
  expansion.current = expanded;
  const readOnly =
    options.disabled || (options.expanded !== undefined && !options.onExpandedChange);
  const childrenFor = (item: T) =>
    (cacheKey.current === options.cacheKey ? loaded.get(options.getItemId(item)) : undefined) ??
    options.getChildren?.(item);
  const canExpand = (item: T) => {
    const children = childrenFor(item);
    return children !== undefined ? children.length > 0 : !!options.hasChildren?.(item);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const controller of pending.current.values()) controller.abort();
      pending.current.clear();
    };
  }, []);
  useEffect(() => {
    if (cacheKey.current !== options.cacheKey || options.disabled) {
      for (const controller of pending.current.values()) controller.abort();
      pending.current.clear();
      setLoads(new Map());
      if (cacheKey.current !== options.cacheKey) {
        cacheKey.current = options.cacheKey;
        cache.current.clear();
        setLoaded(new Map());
      }
    }
  }, [options.cacheKey, options.disabled]);
  const load = async (item: T) => {
    const config = current.current;
    const id = config.getItemId(item);
    if (config.disabled || !config.loadChildren || pending.current.has(id)) return;
    const controller = new AbortController();
    pending.current.set(id, controller);
    setLoads((previous) => new Map(previous).set(id, { status: 'loading' }));
    try {
      const children = await config.loadChildren(item, { signal: controller.signal });
      if (
        !mounted.current ||
        controller.signal.aborted ||
        pending.current.get(id) !== controller ||
        config.cacheKey !== current.current.cacheKey ||
        current.current.disabled
      )
        return;
      const next = new Map(cache.current).set(id, children);
      validateOutlineItems(
        current.current.data,
        current.current.getItemId,
        (node) => next.get(current.current.getItemId(node)) ?? current.current.getChildren?.(node),
      );
      cache.current = next;
      setLoaded(next);
      setLoads((previous) => {
        const result = new Map(previous);
        result.delete(id);
        return result;
      });
      return children;
    } catch (error) {
      if (
        mounted.current &&
        !controller.signal.aborted &&
        pending.current.get(id) === controller &&
        config.cacheKey === current.current.cacheKey &&
        !current.current.disabled
      )
        setLoads((previous) => new Map(previous).set(id, { status: 'error', error }));
    } finally {
      if (pending.current.get(id) === controller) pending.current.delete(id);
    }
  };
  const setExpanded = async (item: T, value: boolean, recursive = false): Promise<void> => {
    if (readOnly || (value && !canExpand(item))) return;
    const id = options.getItemId(item);
    const next = { ...expansion.current, [id]: value };
    expansion.current = next;
    if (options.expanded === undefined) setLocalExpanded(next);
    options.onExpandedChange?.(next);
    if (!value) {
      const descendants = [item];
      while (descendants.length) {
        const node = descendants.pop();
        if (node === undefined) continue;
        const key = options.getItemId(node);
        pending.current.get(key)?.abort();
        pending.current.delete(key);
        setLoads((previous) => {
          const result = new Map(previous);
          result.delete(key);
          return result;
        });
        descendants.push(...(childrenFor(node) ?? []));
      }
    }
    const children = childrenFor(item) ?? (value ? await load(item) : undefined);
    if (recursive && children && mounted.current && expansion.current[id] === value) {
      for (const child of children) {
        if (expansion.current[id] !== value) break;
        if (canExpand(child) || options.hasChildren?.(child)) await setExpanded(child, value, true);
      }
    }
  };
  // Initial/app-controlled expansion also loads unknown children when they become visible.
  useEffect(() => {
    if (readOnly && options.disabled) return;
    const active = new Set<string>();
    const stack = [...options.data];
    while (stack.length) {
      const item = stack.pop();
      if (item === undefined || expanded[options.getItemId(item)] !== true) continue;
      active.add(options.getItemId(item));
      const children = childrenFor(item);
      if (children) stack.push(...children);
      else if (options.hasChildren?.(item) && !loads.has(options.getItemId(item))) void load(item);
    }
    for (const [id, controller] of pending.current) {
      if (!active.has(id)) {
        controller.abort();
        pending.current.delete(id);
        setLoads((previous) => {
          const next = new Map(previous);
          next.delete(id);
          return next;
        });
      }
    }
  });
  return {
    expanded,
    childrenFor,
    canExpand,
    setExpanded,
    loads,
    loadedChildren: loaded,
    retry: load,
    readOnly,
  };
}
