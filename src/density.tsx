import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type TableDensity = 'native' | 'compact' | 'comfortable';
export interface DensityMetrics {
  rowHeight?: number;
  rowPaddingBlock?: number;
  rowPaddingInline?: number;
  iconSize?: number;
}
export interface DensityScopeProps extends ComponentPropsWithRef<'div'> {
  /** Omit to inherit CSS metrics; explicit presets start a new density scope. */
  density?: TableDensity;
  metrics?: DensityMetrics;
}

export function densityStyle(metrics: DensityMetrics = {}): CSSProperties {
  const properties = {
    rowHeight: '--pt-row-height',
    rowPaddingBlock: '--pt-row-padding-block',
    rowPaddingInline: '--pt-row-padding-inline',
    iconSize: '--pt-icon-size',
  } as const;
  return Object.fromEntries(
    Object.entries(properties).flatMap(([key, property]) => {
      const value = metrics[key as keyof DensityMetrics];
      if (value === undefined) return [];
      if (
        !Number.isFinite(value) ||
        value < 0 ||
        ((key === 'rowHeight' || key === 'iconSize') && value === 0)
      )
        throw new RangeError(`Invalid density metric: ${key}.`);
      return [[property, `${value}px`]];
    }),
  );
}

/** The same scoped metrics apply to complete tables, custom layouts and browser items. */
export function DensityScope({
  density,
  metrics,
  className = '',
  style,
  ...props
}: DensityScopeProps) {
  return (
    <div
      {...props}
      className={`pt-density ${className}`}
      data-pt-density={density}
      data-pt-metrics={metrics ? 'custom' : undefined}
      style={{ ...densityStyle(metrics), ...style }}
    />
  );
}
