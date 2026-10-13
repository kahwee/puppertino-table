import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { type DensityMetrics, type TableDensity } from './density.js';
export interface ColumnBrowserPanel {
    /** Unique stable panel ID; retained when navigating or restoring widths. */
    id: string;
    /** Accessible name for this panel region. */
    label: string;
    content: ReactNode;
    /** Ancestor width in CSS pixels. The final panel fills remaining space. Default: 224. */
    width?: number;
    minWidth?: number;
    maxWidth?: number;
}
export type ColumnBrowserWidths = Record<string, number>;
export interface ColumnBrowserProps {
    panels: readonly ColumnBrowserPanel[];
    ariaLabel: string;
    density?: TableDensity;
    densityMetrics?: DensityMetrics;
    minimumCurrentWidth?: number;
    resizable?: boolean;
    resizeDisabled?: boolean;
    cancelMediaQuery?: string;
    /** App-owned ancestor widths. Without onWidthsChange, resizing is read-only. */
    widths?: ColumnBrowserWidths;
    /** Width snapshots during previews, cancellation and completion; not a React updater. */
    onWidthsChange?: (widths: ColumnBrowserWidths) => void;
    /** Completed resize/reset operations only, suitable for saving preferences. */
    onWidthsCommit?: (widths: ColumnBrowserWidths) => void;
    /** Optional completion-only persistence for internally owned widths. Ignored when controlled. */
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    className?: string;
    style?: ComponentPropsWithoutRef<'div'>['style'];
}
/** Caller-rendered hierarchy. No fetching, navigation, selection or application commands. */
export declare function ColumnBrowser({ panels, ariaLabel, density, densityMetrics, minimumCurrentWidth, resizable, resizeDisabled: disabled, cancelMediaQuery, widths: controlled, onWidthsChange, onWidthsCommit, storageKey, storage, className, style, }: ColumnBrowserProps): import("react").JSX.Element;
interface BrowserItemPresentation {
    icon?: ReactNode;
    trailing?: ReactNode;
    selected?: boolean;
    pathSelected?: boolean;
}
export type ColumnBrowserItemButtonProps = BrowserItemPresentation & ComponentPropsWithoutRef<'button'> & {
    href?: never;
};
export type ColumnBrowserItemLinkProps = BrowserItemPresentation & ComponentPropsWithoutRef<'a'> & {
    href: string;
    disabled?: boolean;
};
export type ColumnBrowserItemProps = ColumnBrowserItemButtonProps | ColumnBrowserItemLinkProps;
export declare function ColumnBrowserItem({ icon, trailing, selected, pathSelected, className, children, ...props }: ColumnBrowserItemProps): import("react").JSX.Element;
export {};
