import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { ColumnBrowser, type ColumnBrowserWidths } from '../src/index.js';

let changeKey: (key: string) => void;
let changeMode: (mode: string) => void;
let changeBranch: (visible: boolean) => void;
let changeAdapter: (adapter: string) => void;
let commits = 0;
const alternate = { getItem: () => '{"root":330,"branch":280}', setItem: () => {} };
const unavailable = {
  getItem: () => {
    throw new Error('Unavailable');
  },
  setItem: () => {
    throw new Error('Unavailable');
  },
};
function Fixture() {
  const [key, setKey] = useState('browser-a');
  changeKey = setKey;
  const [mode, setMode] = useState('local');
  changeMode = setMode;
  const [branch, setBranch] = useState(true);
  changeBranch = setBranch;
  const [adapter, setAdapter] = useState('local');
  changeAdapter = setAdapter;
  const [widths, setWidths] = useState<ColumnBrowserWidths>({ root: 260, branch: 240 });
  return (
    <div style={{ height: 240, width: 960 }}>
      <ColumnBrowser
        ariaLabel="Preference fixture"
        storageKey={key}
        storage={
          adapter === 'alternate' ? alternate : adapter === 'unavailable' ? unavailable : undefined
        }
        widths={mode === 'local' ? undefined : widths}
        onWidthsChange={mode === 'controlled' ? setWidths : undefined}
        onWidthsCommit={() => {
          commits++;
        }}
        panels={[
          { id: 'root', label: 'Root', maxWidth: 400, content: 'Root items' },
          ...(branch ? [{ id: 'branch', label: 'Branch', content: 'Branch items' }] : []),
          { id: 'current', label: 'Current', content: 'Current items' },
        ]}
      />
    </div>
  );
}
export function serverHTML() {
  return renderToString(<Fixture />);
}
export async function hydrate() {
  const { hydrateRoot } = await import('react-dom/client');
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing root');
  const firstHTML = root.innerHTML;
  const errors: string[] = [];
  hydrateRoot(root, <Fixture />, { onRecoverableError: (error) => errors.push(String(error)) });
  return {
    firstHTML,
    errors,
    key: (key: string) => changeKey(key),
    mode: (mode: string) => changeMode(mode),
    branch: (visible: boolean) => changeBranch(visible),
    adapter: (adapter: string) => changeAdapter(adapter),
    commits: () => commits,
  };
}
