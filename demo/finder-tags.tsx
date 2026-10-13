import { Tag } from 'lucide-react';
import { TagPicker } from '../src/index.js';
import type { FileItem } from './finder-files.js';

interface FinderTagsProps {
  files: FileItem[];
  available: string[];
  disabled: boolean;
  onTag(tag: string, remove?: boolean): void;
}
/** File mutations stay in the demo; the shared picker edits IDs. */
export function FinderTags({ files, available, disabled, onTag }: FinderTagsProps) {
  const assigned = available.filter(
    (tag) => files.length && files.every((file) => file.tags?.includes(tag)),
  );
  const mixed = available.filter(
    (tag) => !assigned.includes(tag) && files.some((file) => file.tags?.includes(tag)),
  );
  return (
    <TagPicker
      options={available.map((tag) => ({ id: tag, label: tag }))}
      value={assigned}
      mixedValue={mixed}
      disabled={disabled || !files.length}
      triggerClassName="p-toolbar-btn"
      trigger={
        <Tag size={20} strokeWidth={1.5} style={{ transform: 'scaleX(-1)' }} aria-hidden="true" />
      }
      title={`Assign tags to ${files.length === 1 ? `“${files[0].name}”` : `${files.length} items`}`}
      onCreate={(tag) => onTag(tag)}
      onValueChange={(next) => {
        for (const tag of next) if (!assigned.includes(tag)) onTag(tag);
        for (const tag of assigned) if (!next.includes(tag)) onTag(tag, true);
      }}
    />
  );
}
