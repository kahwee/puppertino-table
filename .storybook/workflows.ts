/** Link to existing stories and open their native Interactions panel. */
export const workflows: Readonly<Record<string, readonly { name: string; story: string }[]>> = {
  'Puppertino/Table': [
    { name: 'Select across pages', story: 'puppertino-table--paginated-selection' },
    { name: 'Commit and reset widths', story: 'puppertino-table--resize-events' },
  ],
  'Puppertino/Outline view': [
    { name: 'Load, fail and retry', story: 'puppertino-outline-view--loading-and-retry' },
    {
      name: 'Cancel, then reuse cached children',
      story: 'puppertino-outline-view--cancellation-and-caching',
    },
    {
      name: 'Navigate and select with the keyboard',
      story: 'puppertino-outline-view--keyboard-and-selection',
    },
  ],
  'Puppertino/Tag picker': [
    { name: 'Create and assign a tag', story: 'puppertino-tag-picker--create-tag' },
    { name: 'Edit tokens with the keyboard', story: 'puppertino-tag-picker--keyboard-workflow' },
  ],
  'Puppertino/Split view': [
    { name: 'Resize, hide and restore a pane', story: 'puppertino-split-view--vertical' },
  ],
  'Puppertino/Finder composition': [
    { name: 'Tag, Trash and undo', story: 'puppertino-finder-composition--tag-and-trash-workflow' },
  ],
};
