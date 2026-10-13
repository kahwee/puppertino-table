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
  return <Composition view={view} query={query} section={section}
    activePaneId={activePaneId} previewHidden={previewHidden} artwork="symbol"
    onViewChange={setView} onQueryChange={setQuery} onSectionChange={setSection}
    onActivePaneChange={setActivePaneId} onPreviewHiddenChange={setPreviewHidden}
    onDocumentAction={(action, ids) => {
      // Connect your application's audit/API flow here. This example only changes local data.
      console.info(action, ids);
    }} />;
}`;
}
