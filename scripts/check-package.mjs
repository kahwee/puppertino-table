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
const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', output], { encoding: 'utf8' }));
const required = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'dist/index.js', 'dist/index.d.ts', 'dist/style.css'];
for (const file of required) assert.ok(packed.files.some(entry => entry.path === file), `Missing ${file}`);
for (const { path: file } of packed.files) {
  assert.ok(required.includes(file) || /^dist\/[a-z-]+\.(js|d\.ts)$/.test(file), `Unexpected published file: ${file}`);
}
assert.equal(manifest.publishConfig.access, 'public');
assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org/');
const tarball = path.join(output, packed.filename);
const installSpec = process.argv.includes('--from-registry') ? `${manifest.name}@${manifest.version}` : tarball;
const consumer = await mkdtemp(path.join(tmpdir(), 'puppertino-consumer-'));
try {
  for (const react of ['18', '19']) {
    const directory = path.join(consumer, react);
    await mkdir(directory);
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/', installSpec,
      `react@${react}`, `react-dom@${react}`, `@types/react@${react}`, `@types/react-dom@${react}`,
      `typescript@${manifest.devDependencies.typescript.replace('^', '')}`], { cwd: directory, stdio: 'pipe' });
    await writeFile(path.join(directory, 'consumer.tsx'), `
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PuppertinoTable, usePuppertinoTable, ColumnResizeHandle, createPuppertinoColumnHelper, clampSize } from 'puppertino-table';
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
  getRowProps: row => ({ className: 'custom-row', title: row.original.title }),
  getCellProps: cell => ({ title: String(cell.getValue()) }),
  leadingRows: table => createElement('tr', null, createElement('td', { colSpan: table.getAllLeafColumns().length }, 'Folder')),
}));
if (!customized.includes('custom-row') || customized.indexOf('Folder') > customized.indexOf('Ten')) throw new Error('Custom rows failed');
function HookConsumer() {
  const table = usePuppertinoTable({ data, columns, getRowId: item => item.id, sorting: [], onSortingChange: () => {}, selectable: true });
  const header = table.getHeaderGroups()[0].headers[0];
  return createElement('table', null, createElement('thead', null, createElement('tr', null, createElement('th', null,
    createElement(ColumnResizeHandle<Item>, { table, header, label: 'Title' })))));
}
if (!renderToStaticMarkup(createElement(HookConsumer)).includes('Resize Title column')) throw new Error('Hook consumer failed');
if (!markup.includes('aria-label="Inventory"')) throw new Error('Missing table label');
if (markup.indexOf('Two') >= markup.indexOf('Ten')) throw new Error('Numeric sorting failed');
if (clampSize(500, { id: 'price', minSize: 100, maxSize: 300, size: 200 }) !== 300) throw new Error('Sizing export failed');
console.log('React ${react}: typed imports and server rendering passed');
`);
    // Consumers should not require the repository's development dependencies.
    execFileSync(path.join(directory, 'node_modules/.bin/tsc'), ['consumer.tsx', '--outDir', 'compiled', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2023', '--jsx', 'react-jsx', '--strict', '--skipLibCheck', '--types', 'react,react-dom'], { cwd: directory, stdio: 'inherit' });
    execFileSync(process.execPath, ['compiled/consumer.js'], { cwd: directory, stdio: 'inherit' });
    // CSS must be consumable through the public export, without copying package internals.
    execFileSync(process.execPath, ['--input-type=module', '-e', "import { readFileSync } from 'node:fs'; import assert from 'node:assert/strict'; const css = readFileSync(new URL(import.meta.resolve('puppertino-table/style.css')), 'utf8'); assert.match(css, /\\.pt-/);"], { cwd: directory, stdio: 'inherit' });
  }
} finally {
  await rm(consumer, { recursive: true, force: true });
}
await writeFile(path.join(output, 'pack.json'), JSON.stringify(packed, null, 2) + '\n');
console.log(`Verified ${packed.filename}: ${packed.files.length} files, ${packed.size} packed bytes`);
