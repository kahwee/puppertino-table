import type { CompositionProps } from '../demo/document-workspace-example.js';
import type { Person } from '../demo/fixtures.js';
import type { OutlineViewExampleProps } from '../demo/outline-view-example.js';
import type { SidebarExampleProps } from '../demo/sidebar-example.js';
import type { SplitViewExample } from '../demo/split-view-example.js';
import type { PuppertinoTableProps } from '../src/index.js';

type Primitive = string | number | boolean;
export interface Scenario<Args> {
  name: string;
  story?: string;
  args: Partial<{
    [K in keyof Args as NonNullable<Args[K]> extends Primitive ? K : never]: Args[K];
  }>;
  observe: string;
}

const table = [
  {
    name: 'Row selection without checkboxes',
    args: { selectable: true, selectionCheckboxes: false },
    observe: 'Select rows while keeping the selection column hidden.',
  },
  {
    name: 'Comfortable, disabled table',
    args: { density: 'comfortable', disabled: true },
    observe: 'Inspect spacing and disabled sorting, selection and resizing.',
  },
  {
    name: 'Server-owned ordering',
    args: { manualSorting: true },
    observe: 'Sorting changes state while supplied row order stays intact.',
  },
  {
    name: 'React-owned state',
    story: 'puppertino-table--selection',
    args: { stateOwner: 'react' },
    observe: 'Follow the typed sorting and selection callbacks into React state.',
  },
  {
    name: 'Shared atom state',
    story: 'puppertino-table--selection',
    args: { stateOwner: 'atoms' },
    observe: 'Resize, sort and select through shared atoms; compare the matching Code recipe.',
  },
] satisfies readonly Scenario<PuppertinoTableProps<Person> & { stateOwner: 'react' | 'atoms' }>[];
const outline = [
  {
    name: 'Select documents only',
    args: { foldersSelectable: false },
    observe: 'Expand Projects; Select all includes eligible documents rather than folders.',
  },
  {
    name: 'Retry a failed branch',
    args: { loadingDelay: 1000, simulateError: true },
    observe: 'Expand Archive, observe its first failure, then retry.',
  },
  {
    name: 'Immediate loading',
    args: { loadingDelay: 0, simulateError: false },
    observe: 'Expand the same hierarchy without simulated delay or errors.',
  },
] satisfies readonly Scenario<OutlineViewExampleProps>[];
const split = [
  {
    name: 'Compact document navigation',
    args: { container: 'compact', activePaneId: 'content' },
    observe: 'Navigate between Sidebar, Content and Detail in a narrow host.',
  },
  {
    name: 'Vertical panes',
    args: { orientation: 'vertical' },
    observe: 'Resize pane heights with the pointer or Up/Down keys.',
  },
] satisfies readonly Scenario<
  Parameters<typeof SplitViewExample>[0] & { container: 'fluid' | 'compact' }
>[];
const sidebar = [
  {
    name: 'Touch navigation',
    args: { size: 'touch', section: 'Archive' },
    observe: 'Compare larger row targets and navigate between sections.',
  },
] satisfies readonly Scenario<SidebarExampleProps>[];

const composition = [
  {
    name: 'Empty collection',
    args: { dataPreset: 'empty' },
    observe: 'Inspect the empty state and disabled document commands.',
  },
  {
    name: 'Long filenames',
    args: { dataPreset: 'longNames' },
    observe: 'Check clipping, wrapping and accessible full labels across views.',
  },
  {
    name: '250 documents',
    args: { dataPreset: 'large' },
    observe: 'Browse 200 current documents and 50 archived records.',
  },
  {
    name: 'Read-only document',
    args: { dataPreset: 'readOnly' },
    observe: 'Preview Brief.pdf; tagging and Trash stay unavailable for that record.',
  },
  {
    name: 'Browse archived documents',
    args: { section: 'Archive' },
    observe: 'Select the launch report and inspect its app-owned preview.',
  },
  {
    name: 'Thumbnail artwork',
    args: { view: 'icons', artwork: 'thumbnail' },
    observe: 'Compare real thumbnail slots with symbolic file artwork.',
  },
  {
    name: 'Collection without a preview pane',
    args: { previewHidden: true },
    observe: 'Use the workspace navigation to restore the detail pane.',
  },
] satisfies readonly Scenario<CompositionProps>[];

export const scenarioGroups = {
  'Puppertino/Finder composition': {
    story: 'puppertino-finder-composition--composed',
    scenarios: composition,
  },
  'Puppertino/Table': { story: 'puppertino-table--default', scenarios: table },
  'Puppertino/Outline view': { story: 'puppertino-outline-view--default', scenarios: outline },
  'Puppertino/Split view': { story: 'puppertino-split-view--default', scenarios: split },
  'Puppertino/Sidebar': { story: 'puppertino-sidebar--default', scenarios: sidebar },
};

/** Use Storybook's native URL args; these presets do not create sidebar entries. */
export function scenarioHref(story: string, args: object) {
  const serialized = Object.entries(args)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  return `./?path=/story/${story}&args=${encodeURIComponent(serialized)}`;
}
