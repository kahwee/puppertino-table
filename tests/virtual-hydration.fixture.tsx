import { renderToString } from 'react-dom/server';
import { PuppertinoTable } from '../src/index.js';
import '../src/style.css';

const rows = Array.from({ length: 1000 }, (_, index) => ({
  id: `row-${index + 1}`,
  name: `Resource ${index + 1}`,
}));
function Fixture() {
  return (
    <PuppertinoTable
      data={rows}
      columns={[{ accessorKey: 'name', header: 'Name' }]}
      getRowId={(row) => row.id}
      ariaLabel="Hydrated inventory"
      virtualization={{ height: 400 }}
    />
  );
}
export function serverHTML() {
  return renderToString(<Fixture />);
}
export async function hydrate() {
  const { hydrateRoot } = await import('react-dom/client');
  const root = document.getElementById('root');
  if (!root) throw Error('Missing fixture root');
  const errors: string[] = [];
  hydrateRoot(root, <Fixture />, { onRecoverableError: (error) => errors.push(String(error)) });
  return { errors };
}
