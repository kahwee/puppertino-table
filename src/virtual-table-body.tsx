// biome-ignore-all lint/a11y/noNoninteractiveTabindex: Roving native table rows provide keyboard access to unmounted data.
'use client';

import type { RowData } from '@tanstack/react-table';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import {
  type KeyboardEvent,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isCompositionKey, nextItemId } from './item-navigation.js';
import { tableBehavior } from './table-behavior.js';
import { TableBody, TableDataRow } from './table-body.js';
import type { TableBodyProps, TableVirtualizationOptions } from './table-types.js';

interface VirtualBodyProps<T extends RowData> extends TableBodyProps<T> {
  scrollElement: HTMLDivElement | null;
  options: TableVirtualizationOptions;
}

function RenderVirtualBody<T extends RowData>({
  table,
  scrollElement,
  options,
  ...props
}: VirtualBodyProps<T>) {
  const estimate = options.estimateRowHeight ?? 32;
  const overscan = options.overscan ?? 5;
  if (
    !Number.isFinite(options.height) ||
    options.height <= 0 ||
    !Number.isFinite(estimate) ||
    estimate <= 0 ||
    !Number.isInteger(overscan) ||
    overscan < 0
  )
    throw new RangeError(
      'Virtualization needs a positive height/row estimate and nonnegative integer overscan.',
    );
  const rows = table.getRowModel().rows;
  const behavior = tableBehavior(table);
  const context = useMemo(
    () => ({
      table,
      selectable: behavior.selectable && behavior.selectionCheckboxes,
      disabled: behavior.disabled,
      columnCount:
        table.getAllLeafColumns().length +
        (behavior.selectable && behavior.selectionCheckboxes ? 1 : 0),
    }),
    [table, behavior.selectable, behavior.selectionCheckboxes, behavior.disabled],
  );
  const { ids, indexes } = useMemo(
    () => ({
      ids: Object.freeze(rows.map((row) => row.id)),
      indexes: new Map(rows.map((row, index) => [row.id, index])),
    }),
    [rows],
  );
  const elements = useRef(new Map<string, HTMLTableRowElement>());
  const [focused, setFocused] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [margin, setMargin] = useState(0);
  const focusedIndex = focused === null ? undefined : indexes.get(focused);
  const pendingIndex = pending === null ? undefined : indexes.get(pending);
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) =>
      [
        ...new Set([
          ...defaultRangeExtractor(range),
          ...(focusedIndex === undefined ? [] : [focusedIndex]),
          ...(pendingIndex === undefined ? [] : [pendingIndex]),
        ]),
      ].sort((a, b) => a - b),
    [focusedIndex, pendingIndex],
  );
  const getItemKey = useCallback((index: number) => rows[index].id, [rows]);
  const estimateSize = useCallback(() => estimate, [estimate]);
  const virtualizer = useVirtualizer({
    initialRect: { width: 0, height: options.height },
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize,
    getItemKey,
    overscan,
    scrollMargin: margin,
    scrollPaddingStart: margin,
    rangeExtractor,
  });
  useLayoutEffect(() => {
    const header = scrollElement?.querySelector('thead');
    if (!header) return;
    const before = [
      header,
      scrollElement?.querySelector('caption'),
      props.status && props.status !== 'ready'
        ? scrollElement?.querySelector('.pt-state-row')
        : undefined,
    ].filter((element): element is Element => !!element);
    const measure = () =>
      setMargin(
        before.reduce((height, element) => height + element.getBoundingClientRect().height, 0),
      );
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of before) observer.observe(element);
    return () => observer.disconnect();
  }, [scrollElement, props.status]);
  const items = virtualizer.getVirtualItems();
  useLayoutEffect(() => {
    if (!pending) return;
    const element = elements.current.get(pending);
    if (element) {
      element.focus({ preventScroll: true });
      setPending(null);
    }
  }, [pending]);
  const keydown = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (
      behavior.disabled ||
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      isCompositionKey(event.nativeEvent) ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    const height = elements.current.get(id)?.getBoundingClientRect().height ?? estimate;
    const next = nextItemId({
      orderedIds: ids,
      currentId: id,
      key: event.key,
      pageSize: Math.max(
        1,
        Math.floor(((scrollElement?.clientHeight ?? options.height) - margin) / height),
      ),
    });
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const index = indexes.get(next);
    if (index === undefined) return;
    virtualizer.scrollToIndex(index, { align: 'auto' });
    setPending(next);
  };
  if (!rows.length) return <TableBody<T> table={table} {...props} />;
  let end = margin;
  const content = items.flatMap((item) => {
    const gap = item.start - end;
    end = item.end;
    const row = rows[item.index];
    const rowProps = props.getRowProps?.(row, context);
    return [
      gap > 0 ? (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: This spacer has no tabindex or controls and represents omitted rows.
        <tr key={`gap-${item.key}`} className="pt-virtual-spacer" aria-hidden="true">
          <td colSpan={context.columnCount} style={{ height: gap }} />
        </tr>
      ) : null,
      <TableDataRow<T>
        key={item.key}
        row={row}
        context={context}
        {...props}
        getRowProps={undefined}
        rowRef={(element) => {
          if (element) {
            elements.current.set(row.id, element);
          } else elements.current.delete(row.id);
          virtualizer.measureElement(element);
        }}
        rowProps={{
          ...rowProps,
          'data-index': item.index,
          'data-virtual-row': row.id,
          'data-virtual-stripe': item.index % 2 === 0,
          'aria-rowindex':
            table.getHeaderGroups().length +
            (props.status && props.status !== 'ready' ? 1 : 0) +
            item.index +
            1,
          tabIndex:
            rowProps?.tabIndex ??
            (row.id === focused || (focusedIndex === undefined && item.index === items[0]?.index)
              ? 0
              : -1),
          onFocus: (event) => {
            setFocused(row.id);
            rowProps?.onFocus?.(event);
          },
          onBlur: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
            rowProps?.onBlur?.(event);
          },
          onKeyDown: (event) => {
            rowProps?.onKeyDown?.(event);
            keydown(event, row.id);
          },
        }}
      />,
    ];
  });
  const bottom = virtualizer.getTotalSize() + margin - end;
  return (
    <tbody aria-busy={props.status === 'loading' || undefined}>
      {props.status && props.status !== 'ready' && (
        <tr className="pt-state-row">
          <td colSpan={context.columnCount}>
            <div className="pt-state-message" role={props.status === 'error' ? 'alert' : 'status'}>
              {props.status === 'loading'
                ? (props.loadingContent ?? 'Loading rows…')
                : (props.errorContent ?? 'Could not load rows.')}
            </div>
          </td>
        </tr>
      )}
      {content}
      {bottom > 0 && (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: This spacer has no tabindex or controls and represents omitted rows.
        <tr className="pt-virtual-spacer" aria-hidden="true">
          <td colSpan={context.columnCount} style={{ height: bottom }} />
        </tr>
      )}
    </tbody>
  );
}

export const VirtualTableBody = memo(RenderVirtualBody) as typeof RenderVirtualBody;
