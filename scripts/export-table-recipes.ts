import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createTableRecipes } from '../.storybook/table-recipes.js';

const [fixtures, stateExamples, stories, dateExample, dateFormat] = await Promise.all(
  [
    'demo/fixtures.tsx',
    'demo/table-state-examples.tsx',
    'src/table.stories.tsx',
    'demo/date-table-example.tsx',
    'demo/date-format.ts',
  ].map((file) => readFile(file, 'utf8')),
);
const recipes = createTableRecipes({ fixtures, stateExamples, stories, dateExample, dateFormat });
const directory = process.argv[2];
if (!directory) throw new Error('Provide the installed consumer directory.');
const files = Object.entries(recipes).map(([name, source]) => ({
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
declare module 'puppertino-table/style.css';
`,
);
console.log(JSON.stringify([...files.map((file) => file.name), 'recipe-styles.d.ts']));
