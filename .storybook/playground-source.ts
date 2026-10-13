import type { Person } from '../demo/fixtures.js';
import type { OutlineViewExampleProps } from '../demo/outline-view-example.js';
import type { SplitViewExample } from '../demo/split-view-example.js';
import type { PuppertinoTableProps } from '../src/index.js';

/** Keep a complete consumer recipe while reflecting the live public configuration. */
export function tablePlaygroundSource(code: string, args: Partial<PuppertinoTableProps<Person>>) {
  const properties = [
    `ariaLabel=${JSON.stringify(args.ariaLabel ?? 'People')}`,
    `density=${JSON.stringify(args.density ?? 'native')}`,
    ...(
      ['selectable', 'selectionCheckboxes', 'resizable', 'disabled', 'manualSorting'] as const
    ).map((key) => `${key}={${Boolean(args[key])}}`),
  ];
  return code.replace('ariaLabel="People"\n      selectable', properties.join('\n      '));
}

function withApp(code: string, app: string) {
  const position = code.indexOf('export ');
  return code.slice(0, position) + app + '\n\n' + code.slice(position);
}

export function outlinePlaygroundSource(code: string, args: Partial<OutlineViewExampleProps>) {
  const settings = {
    density: args.density ?? 'comfortable',
    disabled: args.disabled ?? false,
    selectable: args.selectable ?? true,
    selectionCheckboxes: args.selectionCheckboxes ?? true,
    resizable: args.resizable ?? true,
    manualSorting: args.manualSorting ?? false,
    loadingDelay: args.loadingDelay ?? 600,
    simulateError: args.simulateError ?? true,
    foldersSelectable: args.foldersSelectable ?? true,
  };
  return withApp(
    code,
    `// Your app: current configuration.
export function OutlineApp() {
  const [expanded, setExpanded] = useState<OutlineExpandedState>(${JSON.stringify(args.expanded ?? {})});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(${JSON.stringify(args.rowSelection ?? {})});
  return <OutlineViewExample
    ${Object.entries(settings)
      .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
      .join('\n    ')}
    expanded={expanded} onExpandedChange={setExpanded}
    rowSelection={rowSelection} onRowSelectionChange={setRowSelection} />;
}`,
  );
}
export function splitPlaygroundSource(
  code: string,
  args: Partial<Parameters<typeof SplitViewExample>[0]> & { container?: 'fluid' | 'compact' },
) {
  return withApp(
    code,
    `// Your app: current configuration.
export function SplitApp() {
  const [activePaneId, setActivePaneId] = useState<'sidebar' | 'content' | 'detail'>(${JSON.stringify(args.activePaneId ?? 'sidebar')});
  const [sidebarHidden, setSidebarHidden] = useState(${Boolean(args.sidebarHidden)});
  return <div style={{ width: ${args.container === 'compact' ? '390' : "'100%'"}, maxWidth: '100%' }}>
    <SplitViewExample orientation={${JSON.stringify(args.orientation ?? 'horizontal')}}
      resizable={${args.resizable ?? true}} disabled={${Boolean(args.disabled)}}
      activePaneId={activePaneId} onActivePaneChange={setActivePaneId}
      sidebarHidden={sidebarHidden} onSidebarHiddenChange={setSidebarHidden} />
  </div>;
}`,
  );
}
