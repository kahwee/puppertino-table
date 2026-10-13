import type { Person } from '../demo/fixtures.js';
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
