import { createPuppertinoColumnHelper } from '../src/index.js';

export interface Resource {
  id: string;
  name: string;
  team: string;
  kind: string;
  size: number;
}
const helper = createPuppertinoColumnHelper<Resource>();
const teams = ['Design', 'Engineering', 'Operations', 'Research'];
const kinds = ['PDF', 'Image', 'Spreadsheet', 'Document'];

export function inventoryRows(count: number): Resource[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `resource-${index + 1}`,
    name: `${teams[index % teams.length]} archive ${String(index + 1).padStart(5, '0')}`,
    team: teams[index % teams.length],
    kind: kinds[index % kinds.length],
    size: 100 + index * 17,
  }));
}
export function inventoryColumns(count: number) {
  return helper.columns([
    helper.accessor('name', { header: 'Name', size: 260 }),
    helper.accessor('team', { header: 'Team', size: 140 }),
    helper.accessor('kind', { header: 'Kind', size: 120 }),
    helper.accessor('size', { header: 'Size (KB)', size: 120 }),
    ...Array.from({ length: Math.max(0, count - 4) }, (_, index) =>
      helper.accessor((row) => `${row.team} / ${index + 1}`, {
        id: `attribute-${index + 1}`,
        header: `Attribute ${index + 1}`,
        size: 140,
      }),
    ),
  ]);
}
