import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finderViewRecipes } from '../.storybook/finder-recipes.js';
import {
  outlinePlaygroundSource,
  splitPlaygroundSource,
  tablePlaygroundSource,
} from '../.storybook/playground-source.js';
import { createTableRecipes } from '../.storybook/table-recipes.js';
import { tagPickerRecipe, tagPickerSource } from '../.storybook/tag-picker-recipe.js';
import { documentWorkspaceRecipe } from '../.storybook/workspace-recipe.js';

const [
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
] = await Promise.all(
  [
    'demo/fixtures.tsx',
    'demo/table-state-examples.tsx',
    'src/table.stories.tsx',
    'demo/date-table-example.tsx',
    'demo/date-format.ts',
    'demo/table-status-example.tsx',
    'demo/keyboard-navigation-example.tsx',
    'demo/typed-table-example.tsx',
    'demo/outline-view-example.tsx',
    'demo/split-view-example.tsx',
    'demo/sidebar-example.tsx',
  ].map((file) => readFile(file, 'utf8')),
);
const recipes = createTableRecipes({
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
});
const directory = process.argv[2];
if (!directory) throw new Error('Provide the installed consumer directory.');
const workspace = documentWorkspaceRecipe(
  await readFile('demo/document-workspace-example.tsx', 'utf8'),
);
const files = Object.entries({
  'document-workspace': workspace,
  'outline-live': outlinePlaygroundSource(recipes.outline, {
    loadingDelay: 1200,
    simulateError: false,
    density: 'compact',
    expanded: { projects: true },
    rowSelection: { readme: true },
  }),
  'split-live': splitPlaygroundSource(recipes.split, {
    orientation: 'vertical',
    container: 'compact',
    activePaneId: 'detail',
    sidebarHidden: true,
  }),
  'tag-existing': tagPickerSource({
    allowCreation: false,
    optionSet: 'disabledTags',
    mixedValue: ['work'],
    title: 'He said "Review"',
  }),
  'tag-custom': tagPickerSource({
    optionSet: 'custom',
    options: [{ id: 'one', label: 'A custom tag' }],
    value: ['one'],
  }),
  'table-comfortable-disabled': tablePlaygroundSource(recipes.uncontrolled, {
    density: 'comfortable',
    disabled: true,
    selectable: false,
    resizable: false,
  }),
  'table-server-order': tablePlaygroundSource(recipes.uncontrolled, {
    manualSorting: true,
    selectable: true,
    selectionCheckboxes: true,
    resizable: true,
  }),
  ...recipes,
  'finder-list': finderViewRecipes.list,
  'finder-outline': finderViewRecipes.outline,
  'finder-columns': finderViewRecipes.columns,
  'finder-icons': finderViewRecipes.icons,
  'finder-gallery': finderViewRecipes.gallery,
  'tag-picker': tagPickerRecipe,
}).map(([name, source]) => ({
  name: `recipe-${name}.tsx`,
  source,
}));
await Promise.all(files.map(({ name, source }) => writeFile(path.join(directory, name), source)));
// Styles are resolved by the app's bundler; give the TS-only consumer exact CSS declarations.
await writeFile(
  path.join(directory, 'recipe-styles.d.ts'),
  `declare module '@codedgar/puppertino/colors';
declare module '@codedgar/puppertino/lists';
declare module '@codedgar/puppertino/forms';
declare module '@codedgar/puppertino/sidebars';
declare module '@codedgar/puppertino/popovers';
declare module 'puppertino-table/style.css';
`,
);
console.log(JSON.stringify([...files.map((file) => file.name), 'recipe-styles.d.ts']));
