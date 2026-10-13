import { type ColumnBrowserPanel, type ColumnBrowserProps, type ColumnBrowserWidths } from './column-browser.js';
export type ColumnViewColumn = ColumnBrowserPanel;
export type ColumnViewWidths = ColumnBrowserWidths;
export type ColumnViewProps = Omit<ColumnBrowserProps, 'panels'> & {
    columns: readonly ColumnViewColumn[];
};
/** Successive hierarchy levels arranged in columns; each column contains app-owned content. */
export declare function ColumnView({ columns, ...props }: ColumnViewProps): import("react").JSX.Element;
export { ColumnBrowserItem as ColumnViewItem } from './column-browser.js';
