import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'test-results/package');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--json', '--pack-destination', output], { encoding: 'utf8' }),
);
const required = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/style.css',
];
for (const file of required)
  assert.ok(
    packed.files.some((entry) => entry.path === file),
    `Missing ${file}`,
  );
for (const { path: file } of packed.files) {
  assert.ok(
    required.includes(file) || /^dist\/[a-z-]+\.(js|d\.ts)$/.test(file),
    `Unexpected published file: ${file}`,
  );
}
assert.equal(manifest.publishConfig.access, 'public');
assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org/');
const tarball = path.join(output, packed.filename);
const installSpec = process.argv.includes('--from-registry')
  ? `${manifest.name}@${manifest.version}`
  : tarball;
const consumer = await mkdtemp(path.join(tmpdir(), 'puppertino-consumer-'));
try {
  assert.match(manifest.devDependencies.react, /^19\.\d+\.\d+$/);
  assert.equal(manifest.peerDependencies.react, `^${manifest.devDependencies.react}`);
  for (const react of [manifest.devDependencies.react]) {
    const directory = path.join(consumer, react);
    await mkdir(directory);
    await writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({ private: true, type: 'module' }),
    );
    execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--registry=https://registry.npmjs.org/',
        installSpec,
        `@tanstack/react-store@${manifest.devDependencies['@tanstack/react-store']}`,
        `react@${react}`,
        `react-dom@${react}`,
        `@types/react@${manifest.devDependencies['@types/react'].replace('^', '')}`,
        `@types/react-dom@${manifest.devDependencies['@types/react-dom'].replace('^', '')}`,
        `typescript@${manifest.devDependencies.typescript.replace('^', '')}`,
      ],
      { cwd: directory, stdio: 'pipe' },
    );
    await writeFile(
      path.join(directory, 'consumer.tsx'),
      `
import { createElement } from 'react';
import { createAtom } from '@tanstack/react-store';
import type { ColumnSizingState, SortingState, RowSelectionState } from '@tanstack/react-table';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PuppertinoBodyContext, PuppertinoRowProps, ColumnResizeHandleProps, TableHeaderProps, TableBodyProps, RowSelectionCheckboxProps, PuppertinoTableOptions, PuppertinoTableAtoms } from 'puppertino-table';
import { PuppertinoTable, usePuppertinoTable, ColumnResizeHandle, TableHeader, TableBody, RowSelectionCheckbox, createPuppertinoColumnHelper, clampSize } from 'puppertino-table';
type Item = { id: string; title: string; price: number };
const helper = createPuppertinoColumnHelper<Item>();
const columns = helper.columns([
  helper.accessor('title', { header: 'Title' }),
  helper.accessor('price', { header: 'Price', cell: cell => cell.getValue() }),
]);
const data: Item[] = [{ id: 'ten', title: 'Ten', price: 10 }, { id: 'two', title: 'Two', price: 2 }];
const markup = renderToStaticMarkup(createElement(PuppertinoTable<Item>, {
  data, columns, getRowId: item => item.id, ariaLabel: 'Inventory',
  sorting: [{ id: 'price', desc: false }], onSortingChange: () => {}, manualSorting: false,
}));
const customized = renderToStaticMarkup(createElement(PuppertinoTable<Item>, {
  data, columns, getRowId: item => item.id, ariaLabel: 'Custom inventory', sorting: [], onSortingChange: () => {},
  getRowProps: (row, context) => ({ className: 'custom-row', title: row.original.title, 'data-column-count': context.columnCount }),
  getCellProps: cell => ({ title: String(cell.getValue()) }),
  leadingRows: (_table, context) => createElement('tr', null, createElement('td', { colSpan: context.columnCount }, 'Folder')),
}));
if (!customized.includes('custom-row') || customized.indexOf('Folder') > customized.indexOf('Ten')) throw new Error('Custom rows failed');
function HookConsumer() {
  const table = usePuppertinoTable({ data, columns, getRowId: item => item.id, initialSorting: [{ id: 'price', desc: false }], manualSorting: false, selectable: true });
  const header = table.getHeaderGroups()[0].headers[0];
  const headerProps: TableHeaderProps<Item> = { table, selectable: true };
  const bodyProps: TableBodyProps<Item> = { table, selectable: true, getRowLabel: row => row.title };
  const checkboxProps: RowSelectionCheckboxProps<Item> = { row: table.getRowModel().rows[0], label: 'Standalone item' };
  return createElement('div', null,
    createElement('table', null, createElement(TableHeader<Item>, headerProps), createElement(TableBody<Item>, bodyProps)),
    createElement(RowSelectionCheckbox<Item>, checkboxProps));
}
const atoms: PuppertinoTableAtoms = {
  columnSizing: createAtom<ColumnSizingState>({ title: 240 }),
  sorting: createAtom<SortingState>([{ id: 'price', desc: false }]),
  rowSelection: createAtom<RowSelectionState>({ two: true }),
};
const atomMarkup = renderToStaticMarkup(createElement(PuppertinoTable<Item>, {
  data, columns, atoms, getRowId: item => item.id, ariaLabel: 'Atom inventory', selectable: true, manualSorting: false,
}));
if (!atomMarkup.includes('width:240px') || !atomMarkup.includes('p-selected') || atomMarkup.indexOf('Two') > atomMarkup.indexOf('Ten')) throw new Error('External atom consumer failed');
const attributes: PuppertinoRowProps = { 'data-row-id': 'example' };
const primitiveMarkup = renderToStaticMarkup(createElement(HookConsumer));
if (!primitiveMarkup.includes('Resize Title column') || !primitiveMarkup.includes('Select Standalone item') || primitiveMarkup.indexOf('Two') > primitiveMarkup.indexOf('Ten')) throw new Error('Shared primitive consumer failed');
if (!markup.includes('aria-label="Inventory"')) throw new Error('Missing table label');
if (markup.indexOf('Two') >= markup.indexOf('Ten')) throw new Error('Numeric sorting failed');
if (clampSize(500, { id: 'price', minSize: 100, maxSize: 300, size: 200 }) !== 300) throw new Error('Sizing export failed');
console.log('React ${react}: typed imports and server rendering passed');
`,
    );
    // Consumers should not require the repository's development dependencies.
    execFileSync(
      path.join(directory, 'node_modules/.bin/tsc'),
      [
        'consumer.tsx',
        '--outDir',
        'compiled',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2023',
        '--jsx',
        'react-jsx',
        '--strict',
        '--skipLibCheck',
        '--types',
        'react,react-dom',
      ],
      { cwd: directory, stdio: 'inherit' },
    );
    execFileSync(process.execPath, ['compiled/consumer.js'], { cwd: directory, stdio: 'inherit' });
    // CSS must be consumable through the public export, without copying package internals.
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import { readFileSync } from 'node:fs'; import assert from 'node:assert/strict'; const css = readFileSync(new URL(import.meta.resolve('puppertino-table/style.css')), 'utf8'); assert.match(css, /\\.pt-/);",
      ],
      { cwd: directory, stdio: 'inherit' },
    );
  }
} finally {
  await rm(consumer, { recursive: true, force: true });
}
await writeFile(path.join(output, 'pack.json'), `${JSON.stringify(packed, null, 2)}\n`);
console.log(
  `Verified ${packed.filename}: ${packed.files.length} files, ${packed.size} packed bytes`,
);
