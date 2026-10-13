import { type ReactNode } from 'react';
export interface TagOption {
    id: string;
    label: string;
    disabled?: boolean;
}
export interface TagPickerProps {
    options: readonly TagOption[];
    /** Assigned IDs. The application owns persistence. */
    value: readonly string[];
    onValueChange(value: string[]): void;
    /** IDs assigned to some, but not all, selected items. */
    mixedValue?: readonly string[];
    onCreate?(label: string): void;
    disabled?: boolean;
    trigger?: ReactNode;
    triggerClassName?: string;
    title?: string;
}
/** Controlled tags in a Finder-style token field. Import Puppertino popover CSS. */
export declare function TagPicker({ options, value, onValueChange, mixedValue, onCreate, disabled, trigger, triggerClassName, title, }: TagPickerProps): import("react").JSX.Element;
