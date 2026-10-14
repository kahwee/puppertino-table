export interface ComponentGuide {
  intro: string;
  scenarios: readonly { setting: string; try: string; result: string }[];
  integration: string;
  keyboard?: readonly { keys: string; action: string }[];
  api: string;
}

/** Guidance complements live arg tables; examples use the same public integration recipes. */
export const componentGuides: Readonly<Record<string, ComponentGuide>> = {
  'Puppertino/Table': {
    intro:
      'Start with the typed table. Explore behavior in Controls before choosing a state-ownership recipe below.',
    scenarios: [
      {
        setting: 'selectable / selectionCheckboxes',
        try: 'Enable selection, then hide checkboxes.',
        result:
          'Compare checkbox selection with row gestures. Selection never authorizes an action.',
      },
      {
        setting: 'manualSorting',
        try: 'Keep false for supplied rows; enable for an ordered server page.',
        result: 'Sorting ownership and sorting state are separate decisions.',
      },
      {
        setting: 'resizable / disabled',
        try: 'Resize a header, then disable the table.',
        result: 'Completed widths remain; unfinished gestures cancel.',
      },
      {
        setting: 'density',
        try: 'Compare native, compact and comfortable.',
        result: 'Spacing changes without replacing the row model.',
      },
    ],
    integration:
      'Copy the Code panel recipe with your own row type and column helpers. Keep Date values in accessors and format in cells. Choose internal, React-controlled or atom ownership for each state slice; use one owner per slice. Keep data and columns stable. For app-owned paging, filter and sort before slicing and preserve selection by getRowId, including IDs outside the current page.',
    keyboard: [
      { keys: 'Space', action: 'Toggle a focused checkbox.' },
      {
        keys: 'Arrows / Shift+Arrows',
        action: 'Resize a focused header divider; Shift uses a larger step.',
      },
      { keys: 'Escape', action: 'Cancel an unfinished resize.' },
    ],
    api: 'defaults-and-ownership-at-a-glance',
  },
  'Puppertino/Outline view': {
    intro:
      'Use one hierarchy playground to explore selection, lazy loading and sibling ordering. Requests below are fictional; your app supplies the loader.',
    scenarios: [
      {
        setting: 'loadingDelay / simulateError',
        try: 'Expand Projects, then Archive; retry the failed branch.',
        result: 'See loading, cancellation, retry and cached re-expansion in the same canvas.',
      },
      {
        setting: 'foldersSelectable',
        try: 'Disable folder selection and use Select all.',
        result: 'Group rows remain navigable while only eligible visible files are selected.',
      },
      {
        setting: 'expanded / rowSelection',
        try: 'Expand a branch or select rows, then inspect these args.',
        result:
          'The canvas and Controls share the same controlled state; callbacks appear in Actions.',
      },
      {
        setting: 'manualSorting',
        try: 'Sort Name with automatic ordering, then use app-owned order.',
        result: 'Automatic sorting stays inside each sibling group.',
      },
    ],
    integration:
      'Supply stable IDs, getChildren for known children, and hasChildren plus loadChildren(item, { signal }) for lazy branches. Forward the AbortSignal to your API. Change cacheKey when the app invalidates loaded children; collapsing a branch preserves hidden selections without including them in visible bulk selection.',
    keyboard: [
      {
        keys: 'Right / Left',
        action: 'Expand or enter a branch; collapse or return to its parent.',
      },
      { keys: 'Up / Down / Home / End', action: 'Navigate visible rows.' },
      { keys: 'Option-click', action: 'Recursively disclose the known branch.' },
      { keys: 'Command/Ctrl+A', action: 'Select eligible visible rows.' },
    ],
    api: 'outline-view-and-fetching-children',
  },
  'Puppertino/Split view': {
    intro:
      'Explore pane arrangements and compact navigation with args. Pane visibility and active-pane buttons update the same controls.',
    scenarios: [
      {
        setting: 'orientation',
        try: 'Switch horizontal to vertical.',
        result: 'The same panes use the correct divider axis and keyboard direction.',
      },
      {
        setting: 'container',
        try: 'Choose compact, then change activePaneId.',
        result: 'One pane is visible; the navigation buttons and Controls stay synchronized.',
      },
      {
        setting: 'sidebarHidden',
        try: 'Hide the sidebar, then restore it.',
        result: 'Hidden panes leave the layout while completed widths remain available.',
      },
      {
        setting: 'resizable / disabled',
        try: 'Resize, disable resizing, then inspect Actions.',
        result: 'onSizesCommit reports completed gestures; cancellation does not commit.',
      },
    ],
    integration:
      'Give each pane a stable ID, label, size bounds and app-owned content. Use activePaneId for compact navigation. Persist only onSizesCommit; do not save preview widths during a drag. Supply container sizing in your layout.',
    keyboard: [
      { keys: 'Left / Right', action: 'Resize a divider in a horizontal arrangement.' },
      { keys: 'Up / Down', action: 'Resize a divider in a vertical arrangement.' },
      { keys: 'Escape', action: 'Cancel the preview without persisting it.' },
    ],
    api: 'split-view',
  },
  'Puppertino/Sidebar': {
    intro:
      'Use one sidebar playground for all four Puppertino sizes. Row clicks and the section control represent the same app selection.',
    scenarios: [
      {
        setting: 'size',
        try: 'Compare small, medium, large and touch.',
        result: 'The same navigation uses different row metrics; touch targets stay larger.',
      },
      {
        setting: 'section',
        try: 'Choose Downloads, then click Archive.',
        result: 'Controls track navigation and Actions reports onSectionChange.',
      },
      {
        setting: 'aria-label',
        try: 'Name the navigation for your app.',
        result: 'Distinct sidebars need distinct accessible names.',
      },
    ],
    integration:
      'Compose SidebarGroup headings and native SidebarItem buttons or links. Your app owns routing and selected state. Use a real href for navigation, onClick for commands, selected for the current section, and detail for counts.',
    keyboard: [
      { keys: 'Tab / Shift+Tab', action: 'Move among enabled native controls.' },
      { keys: 'Enter / Space', action: 'Activate a button; Enter follows a link.' },
    ],
    api: 'compose-a-finder',
  },
  'Puppertino/Column view': {
    intro:
      'Explore layout, width ownership and menu triggers in one workspace. Controls preserve its file selection and inspector.',
    scenarios: [
      {
        setting: 'view',
        try: 'Switch Columns to Table after selecting files.',
        result: 'App state survives the layout change.',
      },
      {
        setting: 'widthMode',
        try: 'Compare internal, controlled, read only and persisted.',
        result: 'Each sizing state has one owner. Only completed internal widths persist.',
      },
      {
        setting: 'menuMode',
        try: 'Compare item triggers with a delegated workspace trigger.',
        result: 'Both support pointer menus and Shift+F10 without adding command authority.',
      },
      {
        setting: 'narrow / density',
        try: 'Constrain the workspace and change spacing.',
        result: 'Ancestors remain scrollable; selection and detail remain intact.',
      },
    ],
    integration:
      'Use ColumnView with app-rendered columns and ColumnViewItem controls. Attach useContextMenu trigger props or delegate from a containing workspace. The app owns navigation, fetching, selection and commands; the library owns geometry and resize gestures.',
    keyboard: [
      { keys: 'Shift+F10', action: 'Open commands for a focused item.' },
      {
        keys: 'Arrows / Home / End',
        action: 'Navigate menu entries, including disabled entries for discovery.',
      },
      { keys: 'Escape', action: 'Dismiss a menu and restore its invoking target.' },
    ],
    api: 'column-view',
  },
  'Puppertino/Tag picker': {
    intro:
      'Choose an option dataset in Controls, then open Tags. Assignment, mixed state and creation are all variants of this playground.',
    scenarios: [
      {
        setting: 'optionSet',
        try: 'Choose long labels or disabled tags; choose custom to edit options.',
        result: 'Stable IDs preserve assignment when presentation changes.',
      },
      {
        setting: 'value / mixedValue',
        try: 'Assign a mixed tag and inspect the updated args.',
        result: 'Assigned IDs and partially assigned IDs stay distinct.',
      },
      {
        setting: 'allowCreation',
        try: 'Disable creation, then search for an unknown label.',
        result: 'Only existing tags can be assigned; creation stays app-owned.',
      },
    ],
    integration:
      'Pass stable option IDs and controlled value/onValueChange. Use mixedValue for a multi-item selection. Supply onCreate only when your app permits creation. Watch callbacks in Actions; copying the complete Code recipe includes imports, data and state.',
    keyboard: [
      { keys: 'Up / Down / Enter', action: 'Navigate suggestions and choose an enabled option.' },
      {
        keys: 'Backspace',
        action: 'Focus the last token from an empty input; press again to remove it.',
      },
      { keys: 'Escape', action: 'Close the popover and restore its trigger.' },
    ],
    api: 'compose-a-finder',
  },
  'Puppertino/Finder composition': {
    intro:
      'Explore a complete, typed document workspace with locations, resizable panes, shared selection, tags, previews and reversible Trash. Controls and application navigation share the same args.',
    scenarios: [
      {
        setting: 'view',
        try: 'Select a document and change between List, Icons, Columns, Gallery and Outline.',
        result: 'Document selection and app-owned commands stay shared.',
      },
      {
        setting: 'query',
        try: 'Filter filenames from Controls or the app search.',
        result: 'Both edit the same args.',
      },
    ],
    integration:
      'The composed document app uses FinderWindow, FinderToolbar, Sidebar, SplitView, collection views and a detail pane. Navigate Documents/Archive, tag a file, change views, resize panes, then Trash and undo. Keep document models, API clients, authentication and command authorization in your application. Use the full Finder walkthrough for the larger app example.',
    keyboard: [
      { keys: 'Tab / Enter', action: 'Navigate locations and use the compact pane controls.' },
      { keys: 'Left/Right', action: 'Resize a focused horizontal pane divider.' },
    ],
    api: 'compose-a-finder',
  },
};
