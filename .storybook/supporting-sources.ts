import workspace from '../demo/document-workspace-example.tsx?raw';
import { tableRecipes } from './table-sources.js';
import { documentWorkspaceRecipe } from './workspace-recipe.js';
export const supportingSources: Readonly<Record<string, { filename: string; code: string }>> = {
  'Puppertino/Table': {
    filename: 'Full table example and fixtures',
    code: tableRecipes.uncontrolled,
  },
  'Puppertino/Outline view': { filename: 'outline-example.tsx', code: tableRecipes.outline },
  'Puppertino/Split view': { filename: 'split-example.tsx', code: tableRecipes.split },
  'Puppertino/Finder composition': {
    filename: 'document-workspace.tsx',
    code: documentWorkspaceRecipe(workspace),
  },
};
