import type { Person } from './fixtures.js';
export type TableDataPreset = 'standard' | 'empty' | 'longNames' | 'large' | 'readOnly';
export const tablePresetNames = [
  'Maya Chen',
  'Oliver Grant',
  'Amina Hassan',
  'Lucas Silva',
  'Sofia Rossi',
  'Noah Williams',
  'Priya Patel',
  'Hugo Martin',
  'Emma Wilson',
  'Daniel Kim',
  'Zoe Anderson',
  'Elias Fischer',
];
export function tableData(preset: TableDataPreset): Person[] {
  if (preset === 'empty') return [];
  return Array.from({ length: preset === 'large' ? 1000 : 12 }, (_, index) => ({
    id: `person-${index}`,
    team: ['Design', 'Engineering', 'Operations'][index % 3],
    score: (index * 17) % 101,
    active: index % 4 !== 0,
    name:
      preset === 'longNames'
        ? `${tablePresetNames[index % tablePresetNames.length]} — international project coordination and final review owner`
        : `${tablePresetNames[index % tablePresetNames.length]}${index >= tablePresetNames.length ? ` (${Math.floor(index / tablePresetNames.length) + 1})` : ''}`,
  }));
}
