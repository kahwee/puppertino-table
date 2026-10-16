/** Curated learning paths. Variants belong in Controls; recipes teach a distinct integration. */
export interface StoryRecipe {
  name: string;
  story: string;
  when: string;
  try: string;
  expect: string;
}

export const tableIntegrations = [
  {
    name: 'Paged workspace',
    story: 'puppertino-table--paginated-selection',
    when: 'Your app shows one page of a larger collection.',
    try: 'Select people, change pages, then search.',
    expect: 'Selection follows stable IDs; filtering and sorting happen before paging.',
  },
  {
    name: 'Large inventory',
    story: 'puppertino-table--large-inventory',
    when: 'Many rows are already loaded in memory.',
    try: 'Compare rendering modes, then use End and filter the archive.',
    expect: 'Virtual rendering bounds mounted rows; the app still owns all loaded data.',
  },
  {
    name: 'State ownership',
    story: 'puppertino-table--selection',
    when: 'Sorting or selection must be shared with your app.',
    try: 'Switch React and atom ownership, then inspect Code.',
    expect: 'Each state slice has one owner and a matching typed integration.',
  },
] satisfies readonly StoryRecipe[];

export const focusedRecipes: Readonly<Record<string, readonly StoryRecipe[]>> = {
  'Puppertino/Table': [
    {
      name: 'Server-owned ordering',
      story: 'puppertino-table--server-owned-order',
      when: 'Your API returns an already ordered page.',
      try: 'Change the sort header and inspect the callback.',
      expect: 'Sorting state changes without reordering the supplied page.',
    },
    {
      name: 'Request recovery',
      story: 'puppertino-table--request-states',
      when: 'Loading, refreshes and failures need distinct presentation.',
      try: 'Load rows, refresh, fail, retry and show an empty result.',
      expect: 'Loaded rows survive refresh errors; empty results have their own message.',
    },
    {
      name: 'Chronological dates',
      story: 'puppertino-table--date-columns',
      when: 'Timestamps must sort correctly across time zones.',
      try: 'Sort Date Added and change the display time zone.',
      expect: 'Date values determine order; formatting and invalid values do not distort it.',
    },
    {
      name: 'Grouped headers',
      story: 'puppertino-table--grouped-headers',
      when: 'Related fields need a shared heading.',
      try: 'Sort and resize the columns inside Identity.',
      expect: 'Leaf columns retain their own semantics and sizing.',
    },
    {
      name: 'Custom row commands',
      story: 'puppertino-table--customized-rows',
      when: 'Rows and cells need app-owned event handlers.',
      try: 'Click a row, double-click a cell and use Open folder.',
      expect: 'Activity outputs show the row/cell callbacks; checkboxes still own selection.',
    },
    {
      name: 'Selection gestures',
      story: 'puppertino-table--item-selection-gestures',
      when: 'Your collection uses custom item markup.',
      try: 'Select a range, switch layout and extend it again.',
      expect: 'The anchor survives layout changes with controlled, local or atom state.',
    },
  ],
  'Puppertino/Column view': [
    {
      name: 'Custom styling',
      story: 'puppertino-column-view--custom-styling',
      when: 'Your app needs its own column and row presentation.',
      try: 'Compare the custom layout with the playground.',
      expect: 'Presentation changes without replacing the resize primitives.',
    },
    {
      name: 'Density inheritance',
      story: 'puppertino-column-view--density-inheritance',
      when: 'A workspace mixes inherited and explicit spacing.',
      try: 'Compare nested density scopes.',
      expect: 'An explicit density overrides its surrounding scope.',
    },
  ],
};
