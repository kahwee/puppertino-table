import { useState } from 'react';
import { PuppertinoTable, type TableStatus } from '../src/index.js';
import { people, personColumns } from './fixtures.js';

export function TableStatusExample() {
  const [status, setStatus] = useState<TableStatus>('loading');
  const [data, setData] = useState<typeof people>([]);
  return (
    <>
      <div className="demo-status-controls">
        <button
          type="button"
          className="p-button"
          onClick={() => {
            setData(people.slice(0, 3));
            setStatus('ready');
          }}
        >
          Load rows
        </button>
        <button type="button" className="p-button" onClick={() => setStatus('loading')}>
          Refresh rows
        </button>
        <button type="button" className="p-button" onClick={() => setStatus('error')}>
          Fail request
        </button>
        <button
          type="button"
          className="p-button"
          onClick={() => {
            setData([]);
            setStatus('ready');
          }}
        >
          Show no results
        </button>
      </div>
      <PuppertinoTable
        data={data}
        columns={personColumns}
        getRowId={(row) => row.id}
        ariaLabel="Request states"
        status={status}
        emptyContent="No matching people."
        loadingContent={data.length ? 'Refreshing people…' : 'Loading people…'}
        errorContent={
          <p>
            Could not refresh people.{' '}
            <button type="button" className="p-button" onClick={() => setStatus('loading')}>
              Try again
            </button>
          </p>
        }
      />
    </>
  );
}
