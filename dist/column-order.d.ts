import type { ColumnOrderState, RowData } from '@tanstack/react-table';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { PuppertinoTableInstance } from './model.js';
/** Preserve absent/hidden IDs while moving visible leaf columns through native table state. */
export declare function reorderColumn(order: readonly string[], visible: readonly string[], locked: readonly string[], active: string, over: string): string[];
/** DnD Kit contexts and announcements stay outside the semantic table. */
export declare function ColumnOrderProvider<T extends RowData>({ table, onCommit, children, }: {
    table: PuppertinoTableInstance<T>;
    onCommit?: (order: ColumnOrderState) => void;
    children: ReactNode;
}): string | number | bigint | boolean | import("react").JSX.Element | Iterable<ReactNode> | Promise<string | number | bigint | boolean | Iterable<ReactNode> | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | import("react").ReactPortal | null | undefined> | null | undefined;
export declare function OrderableHeaderCell({ id, locked, children, ...props }: Omit<ComponentPropsWithoutRef<'th'>, 'id'> & {
    id: string;
    locked: boolean;
}): import("react").JSX.Element;
