export interface StoryWorkflow {
  name: string;
  story: string;
  steps: readonly string[];
  result: string;
}

/** Explain the journey before opening its executable check in Interactions. */
export const workflows: Readonly<Record<string, readonly StoryWorkflow[]>> = {
  'Puppertino/Table': [
    {
      name: 'Scroll, navigate and recover an inventory',
      story: 'puppertino-table--large-inventory-workflow',
      steps: ['Select a resource.', 'Navigate to the last row and back.', 'Clear an empty search.'],
      result: 'Focus reaches unmounted rows and the selected resource stays selected.',
    },
    {
      name: 'Select across pages',
      story: 'puppertino-table--paginated-selection',
      steps: [
        'Select people on two pages.',
        'Sort the directory and recover an empty search.',
        'Clear selection across every page.',
      ],
      result: 'Off-page IDs survive paging and filtering; clearing removes every selected ID.',
    },
    {
      name: 'Commit and reset widths',
      story: 'puppertino-table--resize-events',
      steps: ['Resize with the keyboard.', 'Reset the width.'],
      result: 'The preview, committed width and callback count agree after each completion.',
    },
  ],
  'Puppertino/Outline view': [
    {
      name: 'Load, fail and retry',
      story: 'puppertino-outline-view--loading-and-retry',
      steps: ['Expand Projects.', 'Expand Archive and observe the failure.', 'Retry Archive.'],
      result: 'The same branch recovers without replacing the hierarchy.',
    },
    {
      name: 'Cancel, then reuse cached children',
      story: 'puppertino-outline-view--cancellation-and-caching',
      steps: [
        'Collapse an unfinished request.',
        'Reopen and finish loading.',
        'Collapse and reopen again.',
      ],
      result: 'Cancelled work is discarded; completed children are reused.',
    },
    {
      name: 'Navigate and select with the keyboard',
      story: 'puppertino-outline-view--keyboard-and-selection',
      steps: [
        'Expand and enter a branch with arrow keys.',
        'Select visible eligible rows.',
        'Sort siblings.',
      ],
      result: 'Hierarchy and selection eligibility remain intact.',
    },
  ],
  'Puppertino/Tag picker': [
    {
      name: 'Create and assign a tag',
      story: 'puppertino-tag-picker--create-tag',
      steps: [
        'Search for an unknown label.',
        'Create and assign its app-owned ID.',
        'Dismiss the picker.',
      ],
      result: 'The new assignment is visible and focus returns to the trigger.',
    },
    {
      name: 'Edit tokens with the keyboard',
      story: 'puppertino-tag-picker--keyboard-workflow',
      steps: [
        'Search and assign a suggestion.',
        'Focus and remove its token with Backspace.',
        'Press Escape.',
      ],
      result: 'Token editing and dismissal preserve predictable keyboard focus.',
    },
  ],
  'Puppertino/Split view': [
    {
      name: 'Resize, hide and restore a pane',
      story: 'puppertino-split-view--vertical',
      steps: ['Resize the vertical divider.', 'Hide a pane.', 'Restore it.'],
      result: 'Pane visibility and completed sizes remain independently controlled.',
    },
  ],
  'Puppertino/Finder composition': [
    {
      name: 'Tag, Trash and undo',
      story: 'puppertino-finder-composition--tag-and-trash-workflow',
      steps: ['Select and tag a document.', 'Change views and move it to Trash.', 'Undo the move.'],
      result: 'Views share the document state and Undo restores the same record.',
    },
  ],
};
