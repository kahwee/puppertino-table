import workspace from '../demo/document-workspace-example.tsx?raw';
import inventory from '../demo/large-inventory.ts?raw';
import largeStyles from '../demo/large-table.css?raw';
import largeTable from '../demo/large-table-example.tsx?raw';
import pagedStyles from '../demo/paged-people.css?raw';
import { tableRecipes } from './table-sources.js';
import { documentWorkspaceRecipe } from './workspace-recipe.js';
export const supportingSources: Readonly<
  Record<
    string,
    {
      filename: string;
      code: string;
      additional?: readonly { filename: string; code: string }[];
    }
  >
> = {
  'Puppertino/Table': {
    filename: 'table-data.tsx',
    code: tableRecipes.tableData,
    additional: [
      { filename: 'large-table.css', code: largeStyles },
      {
        filename: 'large-inventory.ts',
        code: inventory.replace("'../src/index.js'", "'puppertino-table'"),
      },
      {
        filename: 'large-table.tsx',
        code: largeTable.replace("'../src/index.js'", "'puppertino-table'"),
      },
      { filename: 'paged-people.tsx', code: tableRecipes.pagedExample },
      { filename: 'people-page.ts', code: tableRecipes.peoplePage },
      { filename: 'people-layout.ts', code: tableRecipes.peopleLayout },
      { filename: 'use-people-layout.ts', code: tableRecipes.usePeopleLayout },
      { filename: 'paged-people.css', code: pagedStyles },
    ],
  },
  'Puppertino/Outline view': { filename: 'outline-example.tsx', code: tableRecipes.outline },
  'Puppertino/Split view': { filename: 'split-example.tsx', code: tableRecipes.split },
  'Puppertino/Finder composition': {
    filename: 'document-workspace.tsx',
    code: documentWorkspaceRecipe(workspace),
  },
};
