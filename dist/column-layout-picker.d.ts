import type { useColumnLayout } from './use-column-layout.js';
/** Small native preset picker with an anchored, explicit save/rename workflow. */
export declare function ColumnLayoutPicker({ controller, disabled, label, }: {
    controller: ReturnType<typeof useColumnLayout>;
    disabled?: boolean;
    label?: string;
}): import("react").JSX.Element;
