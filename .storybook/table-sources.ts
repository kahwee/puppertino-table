import dateFormat from '../demo/date-format.ts?raw';
import dateExample from '../demo/date-table-example.tsx?raw';
import fixtures from '../demo/fixtures.tsx?raw';
import navigationExample from '../demo/keyboard-navigation-example.tsx?raw';
import outlineExample from '../demo/outline-view-example.tsx?raw';
import pagedExample from '../demo/paged-people-example.tsx?raw';
import peopleLayout from '../demo/people-layout.ts?raw';
import peoplePage from '../demo/people-page.ts?raw';
import sidebarExample from '../demo/sidebar-example.tsx?raw';
import splitExample from '../demo/split-view-example.tsx?raw';
import dataPresets from '../demo/table-data-presets.ts?raw';
import stateExamples from '../demo/table-state-examples.tsx?raw';
import statusExample from '../demo/table-status-example.tsx?raw';
import typedExample from '../demo/typed-table-example.tsx?raw';
import usePeopleLayout from '../demo/use-people-layout.ts?raw';
import stories from '../src/table.stories.tsx?raw';
import { createTableRecipes } from './table-recipes.js';

export const tableRecipes = createTableRecipes({
  fixtures,
  stateExamples,
  stories,
  dateExample,
  dateFormat,
  statusExample,
  navigationExample,
  typedExample,
  outlineExample,
  splitExample,
  sidebarExample,
  dataPresets,
  pagedExample,
  peoplePage,
  peopleLayout,
  usePeopleLayout,
});
