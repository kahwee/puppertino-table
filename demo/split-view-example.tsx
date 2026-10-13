import { useState } from 'react';
import { SplitView, type SplitViewProps, type SplitViewSizes } from '../src/index.js';

export function SplitViewExample({
  orientation = 'horizontal',
  resizable = true,
  disabled = false,
}: Pick<SplitViewProps, 'orientation' | 'resizable' | 'disabled'>) {
  const [active, setActive] = useState('sidebar');
  const [hidden, setHidden] = useState(false);
  const [committed, setCommitted] = useState<SplitViewSizes>({});
  return (
    <main>
      <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>Workspace</h1>
      <nav
        aria-label="Pane navigation"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}
      >
        <button
          type="button"
          className="p-button"
          onClick={() => {
            setHidden(false);
            setActive('sidebar');
          }}
        >
          Sidebar
        </button>
        <button type="button" className="p-button" onClick={() => setActive('content')}>
          Content
        </button>
        <button type="button" className="p-button" onClick={() => setActive('detail')}>
          Detail
        </button>
        <button
          type="button"
          className="p-button"
          aria-pressed={hidden}
          onClick={() => setHidden((value) => !value)}
        >
          Hide sidebar
        </button>
      </nav>
      <div style={{ height: orientation === 'vertical' ? 540 : 320, maxWidth: 960 }}>
        <SplitView
          ariaLabel="Three-pane workspace"
          orientation={orientation}
          resizable={resizable}
          disabled={disabled}
          activePaneId={active}
          onSizesCommit={setCommitted}
          panes={[
            {
              id: 'sidebar',
              label: 'Sidebar',
              size: 200,
              minSize: 120,
              maxSize: 400,
              hidden,
              content: (
                <div style={{ padding: 16 }}>
                  <h2>Projects</h2>
                  <p>App-owned navigation.</p>
                </div>
              ),
            },
            {
              id: 'content',
              label: 'Content',
              size: 300,
              minSize: 180,
              maxSize: 600,
              content: (
                <div style={{ padding: 16 }}>
                  <h2>Documents</h2>
                  <p>App-owned collection.</p>
                </div>
              ),
            },
            {
              id: 'detail',
              label: 'Detail',
              minSize: 180,
              content: (
                <div style={{ padding: 16 }}>
                  <h2>Document preview</h2>
                  <p>App-owned detail.</p>
                </div>
              ),
            },
          ]}
        />
      </div>
      <output aria-label="Committed pane sizes">{JSON.stringify(committed)}</output>
    </main>
  );
}
