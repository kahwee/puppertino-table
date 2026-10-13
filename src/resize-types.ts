import type { Header, RowData } from '@tanstack/react-table';
import type { PuppertinoTableInstance, puppertinoTableFeatures } from './model.js';
export interface ColumnResizeOptions {
  enabled?: boolean;
  /** Shared split-pane gestures may measure vertical movement. Tables use x. */
  axis?: 'x' | 'y';
  storageKey?: string;
  storage?: Pick<Storage, 'setItem'>;
  cancelMediaQuery?: string;
  dragClassName?: string;
  /** Completed pointer, keyboard or reset operation; previews/cancellation never commit. */
  onCommit?: (widths: Record<string, number>) => void;
}
export interface ColumnResizeHandleProps<T extends RowData> {
  table: PuppertinoTableInstance<T>;
  header: Header<typeof puppertinoTableFeatures, T>;
  /** Defaults to a string header or the stable column ID. */
  label?: string;
  options?: ColumnResizeOptions;
}
