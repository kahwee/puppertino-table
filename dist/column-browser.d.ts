import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { type DensityMetrics, type TableDensity } from './density.js';
export interface ColumnBrowserPanel {
    id: string;
    label: string;
    content: ReactNode;
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
    widths?: ColumnBrowserWidths;
    onWidthsChange?: (widths: ColumnBrowserWidths) => void;
    /** Completed resize/reset operations only, suitable for saving preferences. */
    onWidthsCommit?: (widths: ColumnBrowserWidths) => void;
    className?: string;
    style?: ComponentPropsWithoutRef<'div'>['style'];
}
/** Caller-rendered hierarchy. No fetching, navigation, selection or application commands. */
export declare function ColumnBrowser({ panels, ariaLabel, density, densityMetrics, minimumCurrentWidth, resizable, resizeDisabled: disabled, cancelMediaQuery, widths: controlled, onWidthsChange, onWidthsCommit, className, style, }: ColumnBrowserProps): import("react").JSX.Element;
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
