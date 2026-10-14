import {
  type ColumnLayout,
  columnSizeBounds,
  normalizeColumnLayout,
  readColumnLayout,
} from '../src/index.js';
import { personColumns } from './fixtures.js';

export const peopleLayoutKey = 'puppertino-table.team-directory.layout.v1';
export const peopleColumnChoices = [
  { id: 'name', label: 'Name' },
  { id: 'team', label: 'Team' },
  { id: 'score', label: 'Score' },
  { id: 'active', label: 'Status' },
] as const;
export type PeopleColumnId = (typeof peopleColumnChoices)[number]['id'];
export const peopleLayoutColumns = columnSizeBounds(personColumns).map((bound) => ({
  ...bound,
  label: peopleColumnChoices.find((column) => column.id === bound.id)?.label ?? bound.id,
  required: bound.id === 'name',
  pinned: bound.id === 'name',
}));
export type PeopleLayout = ColumnLayout;
export function defaultPeopleLayout(): PeopleLayout {
  return normalizeColumnLayout(peopleLayoutColumns);
}
export function normalizePeopleLayout(value: unknown): PeopleLayout {
  return normalizeColumnLayout(peopleLayoutColumns, value);
}
export function readPeopleLayout(value: string | null): PeopleLayout {
  return readColumnLayout(peopleLayoutColumns, value);
}
