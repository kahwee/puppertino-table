import type { CompositionProps } from '../demo/document-workspace-example.js';
/** The same typed app shown in Storybook, with a small consumer-owned state host. */
export function documentWorkspaceRecipe(source: string) {
  return `'use client';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import '@codedgar/puppertino/sidebars';
import 'puppertino-table/style.css';
${source.replace("'../src/index.js'", "'puppertino-table'")}

export function DocumentWorkspace() {
  const [view, setView] = useState<FinderView>('list');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<CompositionProps['section']>('Documents');
  const [activePaneId, setActivePaneId] = useState<CompositionProps['activePaneId']>('content');
  const [previewHidden, setPreviewHidden] = useState(false);
  return <Composition dataPreset="standard" view={view} query={query} section={section}
    activePaneId={activePaneId} previewHidden={previewHidden} artwork="symbol"
    onViewChange={setView} onQueryChange={setQuery} onSectionChange={setSection}
    onActivePaneChange={setActivePaneId} onPreviewHiddenChange={setPreviewHidden}
    onDocumentAction={(action, ids) => {
      // Connect your application's audit/API flow here. This example only changes local data.
      console.info(action, ids);
    }} />;
}`;
}

export function shortWorkspaceRecipe(args: Partial<CompositionProps> = {}) {
  const complete = documentWorkspaceRecipe('');
  return `import { useState } from 'react';
import type { FinderView } from 'puppertino-table';
import { Composition, type CompositionProps } from './document-workspace';
${complete
  .slice(complete.indexOf('export function DocumentWorkspace'))
  .replace("('list')", `(${JSON.stringify(args.view ?? 'list')})`)
  .replace("('')", `(${JSON.stringify(args.query ?? '')})`)
  .replace("('Documents')", `(${JSON.stringify(args.section ?? 'Documents')})`)
  .replace("('content')", `(${JSON.stringify(args.activePaneId ?? 'content')})`)
  .replace('(false)', `(${Boolean(args.previewHidden)})`)
  .replace('dataPreset="standard"', `dataPreset=${JSON.stringify(args.dataPreset ?? 'standard')}`)
  .replace('artwork="symbol"', `artwork=${JSON.stringify(args.artwork ?? 'symbol')}`)}`;
}
