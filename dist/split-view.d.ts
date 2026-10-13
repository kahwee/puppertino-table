import { type CSSProperties, type ReactNode } from 'react';
export interface SplitViewPane {
    id: string;
    label: string;
    content: ReactNode;
    /** Initial width (horizontal) or height (vertical) in pixels. The last pane fills available space. */
    size?: number;
    minSize?: number;
    maxSize?: number;
    /** Caller-owned visibility; keep a toolbar/menu action to reveal hidden panes. */
    hidden?: boolean;
}
export type SplitViewSizes = Record<string, number>;
export interface SplitViewProps {
    panes: readonly SplitViewPane[];
    ariaLabel: string;
    orientation?: 'horizontal' | 'vertical';
    /** Compact horizontal windows show one pane. The app supplies navigation between panes. */
    activePaneId?: string;
    sizes?: SplitViewSizes;
    onSizesChange?(sizes: SplitViewSizes): void;
    onSizesCommit?(sizes: SplitViewSizes): void;
    resizable?: boolean;
    disabled?: boolean;
    cancelMediaQuery?: string;
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
    className?: string;
    style?: CSSProperties;
}
/** Adjacent sidebar/content/detail panes, thin dividers and compact single-pane navigation. */
export declare function SplitView({ panes, ariaLabel, orientation, activePaneId, sizes: controlled, onSizesChange, onSizesCommit, resizable, disabled, cancelMediaQuery, storageKey, storage, className, style, }: SplitViewProps): import("react").JSX.Element;
