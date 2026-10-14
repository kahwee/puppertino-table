import type { ColumnSizingState } from '@tanstack/react-table';
import { clampSize, columnSizeBounds, readColumnSizing } from '../src/index.js';
import { personColumns } from './fixtures.js';

export const peopleLayoutKey = 'puppertino-table.team-directory.layout.v1';
export const peopleColumnChoices = [
  { id: 'name', label: 'Name' },
  { id: 'team', label: 'Team' },
  { id: 'score', label: 'Score' },
  { id: 'active', label: 'Status' },
] as const;
export type PeopleColumnId = (typeof peopleColumnChoices)[number]['id'];
const bounds = columnSizeBounds(personColumns);
export interface PeopleLayout {
  version: 1;
  hidden: PeopleColumnId[];
  widths: ColumnSizingState;
}
export function defaultPeopleLayout(): PeopleLayout {
  return { version: 1, hidden: [], widths: readColumnSizing(bounds) };
}
/** Only known optional columns and bounded numeric widths enter the saved layout. */
export function normalizePeopleLayout(value: unknown): PeopleLayout {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPeopleLayout();
  const saved = value as Record<string, unknown>;
  if (saved.version !== 1) return defaultPeopleLayout();
  const hidden = Array.isArray(saved.hidden) ? saved.hidden : [];
  const widths =
    saved.widths && typeof saved.widths === 'object' && !Array.isArray(saved.widths)
      ? (saved.widths as Record<string, unknown>)
      : {};
  return {
    version: 1,
    hidden: peopleColumnChoices
      .filter(({ id }) => id !== 'name' && hidden.includes(id))
      .map(({ id }) => id),
    widths: Object.fromEntries(
      bounds.map((bound) => [bound.id, clampSize(widths[bound.id], bound)]),
    ),
  };
}
export function readPeopleLayout(value: string | null): PeopleLayout {
  try {
    return normalizePeopleLayout(JSON.parse(value ?? 'null'));
  } catch {
    return defaultPeopleLayout();
  }
}
