import type { ColumnBrowserWidths } from './column-browser.js';
/** Bounded preference cache, including panels temporarily outside the current hierarchy. */
export declare function browserWidthPreferences(value: unknown): ColumnBrowserWidths;
export declare function mergeBrowserWidthPreferences(previous: ColumnBrowserWidths, next: ColumnBrowserWidths): ColumnBrowserWidths;
