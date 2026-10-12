import type { ColumnBrowserProps, ColumnBrowserWidths } from './column-browser.js';
/** Restore after hydration, retain hidden panels, and write only committed widths. */
export declare function useBrowserWidthPreferences({ appOwned, storageKey, storage, }: Pick<ColumnBrowserProps, 'storageKey' | 'storage'> & {
    appOwned: boolean;
}): {
    widths: ColumnBrowserWidths;
    apply: (next: ColumnBrowserWidths) => void;
    commit: (next: ColumnBrowserWidths) => void;
};
