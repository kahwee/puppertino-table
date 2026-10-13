'use client';
import {
  ColumnBrowser,
  type ColumnBrowserPanel,
  type ColumnBrowserProps,
  type ColumnBrowserWidths,
} from './column-browser.js';

export type ColumnViewColumn = ColumnBrowserPanel;
export type ColumnViewWidths = ColumnBrowserWidths;
export type ColumnViewProps = Omit<ColumnBrowserProps, 'panels'> & {
  columns: readonly ColumnViewColumn[];
};
/** Successive hierarchy levels arranged in columns; each column contains app-owned content. */
export function ColumnView({ columns, ...props }: ColumnViewProps) {
  return <ColumnBrowser {...props} panels={columns} />;
}
export { ColumnBrowserItem as ColumnViewItem } from './column-browser.js';
