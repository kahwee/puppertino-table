import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PuppertinoTable, type TableStatus } from '../src/index.js';

function markup(status: TableStatus, data: { id: string; name: string }[] = []) {
  return renderToStaticMarkup(
    createElement(PuppertinoTable<{ id: string; name: string }>, {
      status,
      data,
      columns: [{ accessorKey: 'name', header: 'Name' }],
      getRowId: (row) => row.id,
      ariaLabel: 'Request state',
      emptyContent: 'No results',
      loadingContent: 'Loading files',
      errorContent: 'Request failed',
    }),
  );
}
test('pending and failed requests do not announce an empty result', () => {
  const loading = markup('loading');
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /role="status">/);
  assert.match(loading, /Loading files/);
  assert.doesNotMatch(loading, /No results/);
  const error = markup('error');
  assert.match(error, /role="alert">Request failed/);
  assert.doesNotMatch(error, /No results|aria-busy="true"/);
  assert.match(markup('ready'), /No results/);
});
test('refresh and error messages preserve existing rows', () => {
  for (const status of ['loading', 'error'] as const) {
    assert.match(markup(status, [{ id: 'a', name: 'Existing file' }]), /Existing file/);
  }
});
