import type { RowData } from '@tanstack/react-table';
import type { TableBodyProps, TableVirtualizationOptions } from './table-types.js';
interface VirtualBodyProps<T extends RowData> extends TableBodyProps<T> {
    scrollElement: HTMLDivElement | null;
    options: TableVirtualizationOptions;
}
declare function RenderVirtualBody<T extends RowData>({ table, scrollElement, options, ...props }: VirtualBodyProps<T>): import("react").JSX.Element;
export declare const VirtualTableBody: typeof RenderVirtualBody;
export {};
