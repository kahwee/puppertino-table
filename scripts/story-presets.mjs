const aliases = {
  'puppertino-table--external-atoms': ['puppertino-table--selection', 'stateOwner:atoms'],
  'puppertino-split-view--vertical': ['puppertino-split-view--default', 'orientation:vertical'],
  'puppertino-split-view--compact': ['puppertino-split-view--default', 'container:compact'],
  'puppertino-sidebar--touch': ['puppertino-sidebar--default', 'size:touch'],
  'examples-finder--outline-workspace': ['examples-finder--file-table', 'initialView:outline'],
  'examples-finder--column-workspace': ['examples-finder--file-table', 'initialView:columns'],
  'examples-finder--icon-workspace': ['examples-finder--file-table', 'initialView:icons'],
  'examples-finder--gallery-workspace': ['examples-finder--file-table', 'initialView:gallery'],
  'examples-finder--checkbox-selection': [
    'examples-finder--file-table',
    'selectionCheckboxes:true',
  ],
  'examples-finder--comfortable-table': [
    'examples-finder--file-table',
    'initialDensity:comfortable',
  ],
  'examples-finder--dark-table': ['examples-finder--file-table', '', 'dark'],
  'examples-finder--dark-columns': ['examples-finder--file-table', 'initialView:columns', 'dark'],
  'puppertino-table--dark': ['puppertino-table--default', '', 'dark'],
  'puppertino-table--disabled': ['puppertino-table--default', 'disabled:true'],
  'puppertino-table--uncontrolled-item-gestures': [
    'puppertino-table--item-selection-gestures',
    'gestureOwnership:local',
  ],
  'puppertino-table--atom-item-gestures': [
    'puppertino-table--item-selection-gestures',
    'gestureOwnership:atom',
  ],
};
export function storyQuery(id) {
  const [story = id, args = '', theme] = aliases[id] ?? [];
  return `id=${story}&viewMode=story${args ? `&args=${encodeURIComponent(args)}` : ''}${theme ? `&globals=theme:${theme}` : ''}`;
}
