import dateFormat from '../demo/date-format.ts?raw';
import dateExample from '../demo/date-table-example.tsx?raw';
import fixtures from '../demo/fixtures.tsx?raw';
import navigationExample from '../demo/keyboard-navigation-example.tsx?raw';
import stateExamples from '../demo/table-state-examples.tsx?raw';
import statusExample from '../demo/table-status-example.tsx?raw';
import typedExample from '../demo/typed-table-example.tsx?raw';
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
});
