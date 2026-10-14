import type { PagedPeopleProps } from '../demo/paged-people-example.js';

export function peopleDataSource(fixtures: string, presets: string) {
  return `import { createPuppertinoColumnHelper } from 'puppertino-table';
${fixtures.slice(fixtures.indexOf('export interface Person'), fixtures.indexOf('export const people'))}
${fixtures.slice(fixtures.indexOf('const helper ='), fixtures.indexOf('export interface Product'))}
${presets.replace("import type { Person } from './fixtures.js';", '')}`;
}

export function pagedPeopleSource(args: Partial<PagedPeopleProps> = {}) {
  return `import { useState } from 'react';
import { PagedPeopleExample } from './paged-people';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/buttons';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import 'puppertino-table/style.css';

export function TeamDirectory() {
  const [query, setQuery] = useState(${JSON.stringify(args.query ?? '')});
  return <PagedPeopleExample
    dataPreset=${JSON.stringify(args.dataPreset ?? 'standard')} pageSize={${args.pageSize ?? 2}}
    density=${JSON.stringify(args.density ?? 'native')} disabled={${Boolean(args.disabled)}}
    query={query} onQueryChange={setQuery} />;
}`;
}
