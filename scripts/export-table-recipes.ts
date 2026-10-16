import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finderViewRecipes } from '../.storybook/finder-recipes.js';
import { pagedPeopleSource } from '../.storybook/people-recipes.js';
import {
  outlinePlaygroundSource,
  splitPlaygroundSource,
  tablePlaygroundSource,
} from '../.storybook/playground-source.js';
import { createTableRecipes } from '../.storybook/table-recipes.js';
import { tagPickerRecipe, tagPickerSource } from '../.storybook/tag-picker-recipe.js';
import { documentWorkspaceRecipe, shortWorkspaceRecipe } from '../.storybook/workspace-recipe.js';

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
  dataPresets,
  pagedExample,
  peoplePage,
  peopleLayout,
  usePeopleLayout,
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
    'demo/table-data-presets.ts',
    'demo/paged-people-example.tsx',
    'demo/people-page.ts',
    'demo/people-layout.ts',
    'demo/use-people-layout.ts',
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
  dataPresets,
  pagedExample,
  peoplePage,
  peopleLayout,
  usePeopleLayout,
});
const directory = process.argv[2];
if (!directory) throw new Error('Provide the installed consumer directory.');
const workspace = documentWorkspaceRecipe(
  await readFile('demo/document-workspace-example.tsx', 'utf8'),
);
await Promise.all([
  writeFile(
    path.join(directory, 'paged-people.css'),
    await readFile('demo/paged-people.css', 'utf8'),
  ),
  writeFile(path.join(directory, 'table-data.tsx'), recipes.tableData),
  writeFile(path.join(directory, 'paged-people.tsx'), recipes.pagedExample),
  writeFile(path.join(directory, 'people-page.ts'), recipes.peoplePage),
  writeFile(path.join(directory, 'people-layout.ts'), recipes.peopleLayout),
  writeFile(path.join(directory, 'use-people-layout.ts'), recipes.usePeopleLayout),
  writeFile(path.join(directory, 'outline-example.tsx'), recipes.outline),
  writeFile(path.join(directory, 'split-example.tsx'), recipes.split),
  writeFile(path.join(directory, 'document-workspace.tsx'), workspace),
]);
await Promise.all([
  ...['large-inventory.ts', 'large-table-example.tsx'].map(async (filename) =>
    writeFile(
      path.join(directory, filename === 'large-table-example.tsx' ? 'large-table.tsx' : filename),
      (await readFile(`demo/${filename}`, 'utf8')).replace(
        "'../src/index.js'",
        "'puppertino-table'",
      ),
    ),
  ),
  writeFile(
    path.join(directory, 'large-table.css'),
    await readFile('demo/large-table.css', 'utf8'),
  ),
]);
const files = Object.entries({
  'inventory-virtual': `import { LargeTableExample } from './large-table'; export function Inventory() { return <LargeTableExample rowCount={10000} columnCount={100} virtualized />; }`,
  'inventory-ordinary': `import { LargeTableExample } from './large-table'; export function Inventory() { return <LargeTableExample rowCount={100} columnCount={100} virtualized={false} density="comfortable" />; }`,
  'paged-large': pagedPeopleSource({ dataPreset: 'large', query: 'engineering', pageSize: 25 }),
  'paged-read-only': pagedPeopleSource({ dataPreset: 'readOnly', disabled: true }),
  'paged-empty': pagedPeopleSource({ dataPreset: 'empty', pageSize: 5 }),
  'workspace-short': shortWorkspaceRecipe(),
  'workspace-read-only': shortWorkspaceRecipe({ dataPreset: 'readOnly', view: 'icons' }),
  'table-empty': tablePlaygroundSource(recipes.uncontrolled, { dataPreset: 'empty' }),
  'table-long-names': tablePlaygroundSource(recipes.uncontrolled, { dataPreset: 'longNames' }),
  'table-large': tablePlaygroundSource(recipes.uncontrolled, { dataPreset: 'large' }),
  'table-read-only': tablePlaygroundSource(recipes.uncontrolled, { dataPreset: 'readOnly' }),
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
  `declare module '*/large-table.css';
declare module '*/paged-people.css';
declare module '@codedgar/puppertino/colors';
declare module '@codedgar/puppertino/buttons';
declare module '@codedgar/puppertino/lists';
declare module '@codedgar/puppertino/forms';
declare module '@codedgar/puppertino/sidebars';
declare module '@codedgar/puppertino/popovers';
declare module 'puppertino-table/style.css';
`,
);
console.log(JSON.stringify([...files.map((file) => file.name), 'recipe-styles.d.ts']));
