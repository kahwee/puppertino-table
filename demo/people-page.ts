import type { SortingState } from '@tanstack/react-table';
import type { Person } from './fixtures.js';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
/** App-owned ordering always happens before paging, never within an already sliced page. */
export function peoplePage(
  people: readonly Person[],
  {
    query,
    sorting,
    pageIndex,
    pageSize,
  }: {
    query: string;
    sorting: SortingState;
    pageIndex: number;
    pageSize: number;
  },
) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('pageSize must be positive.');
  const search = query.trim().toLocaleLowerCase('en');
  const matches = people.filter((person) =>
    `${person.name} ${person.team}`.toLocaleLowerCase('en').includes(search),
  );
  const sort = sorting[0];
  if (sort && ['name', 'team', 'score', 'active'].includes(sort.id)) {
    const key = sort.id as 'name' | 'team' | 'score' | 'active';
    matches.sort((a, b) => {
      const left = a[key];
      const right = b[key];
      const order =
        typeof left === 'string' && typeof right === 'string'
          ? collator.compare(left, right)
          : Number(left) - Number(right);
      return (sort.desc ? -order : order) || collator.compare(a.id, b.id);
    });
  }
  const pageCount = Math.ceil(matches.length / pageSize);
  const index = Math.max(0, Math.min(pageIndex, Math.max(0, pageCount - 1)));
  return {
    rows: matches.slice(index * pageSize, (index + 1) * pageSize),
    total: matches.length,
    pageIndex: index,
    pageCount,
  };
}
