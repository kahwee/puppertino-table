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
export declare function densityStyle(metrics?: DensityMetrics): CSSProperties;
/** The same scoped metrics apply to complete tables, custom layouts and browser items. */
export declare function DensityScope({ density, metrics, className, style, ...props }: DensityScopeProps): import("react").JSX.Element;
