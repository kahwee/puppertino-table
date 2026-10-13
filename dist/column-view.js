'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { ColumnBrowser, } from './column-browser.js';
/** Successive hierarchy levels arranged in columns; each column contains app-owned content. */
export function ColumnView({ columns, ...props }) {
    return _jsx(ColumnBrowser, { ...props, panels: columns });
}
export { ColumnBrowserItem as ColumnViewItem } from './column-browser.js';
