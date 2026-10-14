import type { Person } from '../demo/fixtures.js';
import type { OutlineViewExampleProps } from '../demo/outline-view-example.js';
import type { SplitViewExample } from '../demo/split-view-example.js';
import type { TableDataPreset } from '../demo/table-data-presets.js';
import type { PuppertinoTableProps } from '../src/index.js';

/** Keep a complete consumer recipe while reflecting the live public configuration. */
export function tablePlaygroundSource(
  _code: string,
  args: Partial<PuppertinoTableProps<Person>> & { dataPreset?: TableDataPreset },
) {
  const preset = args.dataPreset ?? 'standard';
  const properties = [
    `ariaLabel=${JSON.stringify(args.ariaLabel ?? 'People')}`,
    ...(preset === 'readOnly' ? ['isRowSelectable={() => false}'] : []),
    `density=${JSON.stringify(args.density ?? 'native')}`,
    ...(
      ['selectable', 'selectionCheckboxes', 'resizable', 'disabled', 'manualSorting'] as const
    ).map((key) => `${key}={${Boolean(args[key])}}`),
  ];
  return `import { PuppertinoTable } from 'puppertino-table';
import { tableData, personColumns } from './table-data';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import 'puppertino-table/style.css';

// Stable data and columns; replace the fixture with your application data.
const people = tableData(${JSON.stringify(preset)});

export function PeopleTable() {
  return <PuppertinoTable
    data={people} columns={personColumns}
    getRowId={(person) => person.id} getRowLabel={(person) => person.name}
    ${properties.join('\n    ')} />;
}`;
}

function withApp(code: string, app: string) {
  const position = code.indexOf('export ');
  return `${code.slice(0, position)}${app}\n\n${code.slice(position)}`;
}

export function outlinePlaygroundSource(_code: string, args: Partial<OutlineViewExampleProps>) {
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
    `import { useState } from 'react';\nimport type { OutlineExpandedState } from 'puppertino-table';\nimport type { RowSelectionState } from '@tanstack/react-table';\nimport { OutlineViewExample } from './outline-example';\nexport {};`,
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
  _code: string,
  args: Partial<Parameters<typeof SplitViewExample>[0]> & { container?: 'fluid' | 'compact' },
) {
  return withApp(
    `import { useState } from 'react';\nimport { SplitViewExample } from './split-example';\nexport {};`,
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
