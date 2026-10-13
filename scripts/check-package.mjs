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
        `@phosphor-icons/react@${manifest.devDependencies['@phosphor-icons/react'].replace('^', '')}`,
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
import { type DelegatedContextMenuOptions, type ContextMenuItem, type ContextMenuState, type ColumnBrowserItemLinkProps, Sidebar, SidebarGroup, SidebarItem, OutlineView, SplitView, ColumnView, TableView, FinderWindow, FinderToolbar, FinderTitle, FinderBody, FinderContent, FinderIconGrid, FinderIconItem, FinderStatusBar, TagPicker, PuppertinoTable, DensityScope, ColumnBrowser, ColumnBrowserItem, ContextMenu, useContextMenu, usePuppertinoTable, useRowSelectionGestures, applySelectionGesture, fitColumnBrowser, ColumnResizeHandle, TableHeader, TableBody, RowSelectionCheckbox, createPuppertinoColumnHelper, clampSize } from 'puppertino-table';
type Item = { id: string; title: string; price: number };
const helper = createPuppertinoColumnHelper<Item>();
const columns = helper.columns([
  helper.accessor('title', { header: 'Title' }),
  helper.accessor('price', { header: 'Price', cell: cell => cell.getValue() }),
]);
const data: Item[] = [{ id: 'ten', title: 'Ten', price: 10 }, { id: 'two', title: 'Two', price: 2 }];
const outlineMarkup = renderToStaticMarkup(createElement(OutlineView<Item>, {
  data, columns, getRowId: item => item.id, getRowLabel: item => item.title, ariaLabel: 'Consumer outline',
}));
if (!outlineMarkup.includes('role="treegrid"') || !outlineMarkup.includes('aria-level="1"')) throw new Error('Outline consumer SSR failed');
const splitMarkup = renderToStaticMarkup(createElement(SplitView, {
  ariaLabel: 'Consumer split', orientation: 'vertical', panes: [{id:'sidebar',label:'Sidebar',content:'Navigation'},{id:'detail',label:'Detail',content:'Detail'}],
}));
if (!splitMarkup.includes('aria-orientation="horizontal"')) throw new Error('Vertical split consumer SSR failed');
const columnMarkup = renderToStaticMarkup(createElement(ColumnView, {
  ariaLabel: 'Consumer columns', columns: [{id:'root',label:'Root',content:'Root'}],
}));
if (!columnMarkup.includes('Consumer columns') || TableView !== PuppertinoTable) throw new Error('Apple-named consumer exports failed');

const sidebarMarkup = renderToStaticMarkup(createElement(Sidebar, { 'aria-label': 'Consumer sections', size: 'touch' },
  createElement(SidebarGroup, {label:'Favorites'}, createElement(SidebarItem, {href:'/projects',selected:true,detail:12}, 'Projects'))));
if (!sidebarMarkup.includes('p-sidebar-touch') || !sidebarMarkup.includes('href="/projects"') || !sidebarMarkup.includes('aria-current="page"') || !sidebarMarkup.includes('p-sidebar-detail')) throw new Error('Portable sidebar consumer SSR failed');

const finderMarkup = renderToStaticMarkup(createElement(FinderWindow, { 'aria-label': 'Consumer Finder' },
  createElement(FinderToolbar, null, createElement(FinderTitle, { as: 'h2' }, 'Documents')),
  createElement(FinderBody, { density: 'comfortable' }, createElement(FinderContent, null,
    createElement(FinderIconGrid, null, createElement(FinderIconItem, { selected: true, onClick: () => {} }, 'Brief.pdf')))),
  createElement(FinderStatusBar, null, '1 item')));
if (!finderMarkup.includes('pt-finder-window') || !finderMarkup.includes('aria-pressed="true"')) throw new Error('Finder composition SSR failed');
const tagMarkup = renderToStaticMarkup(createElement(TagPicker, { options: [{ id: 'review', label: 'Review' }], value: ['review'], onValueChange: () => {} }));
if (!tagMarkup.includes('Remove tag Review') || !tagMarkup.includes('popover="auto"')) throw new Error('Tag picker SSR failed');
const browserMarkup = renderToStaticMarkup(createElement(DensityScope, { density: 'comfortable' }, createElement(ColumnBrowser, {
  storageKey: 'consumer.browser', storage: { getItem: () => { throw new Error('SSR read storage'); }, setItem: () => { throw new Error('SSR wrote storage'); } }, ariaLabel: 'Consumer browser', onWidthsCommit: widths => { const value: number | undefined = widths.root; void value; }, panels: [{ id: 'root', label: 'Root', content: createElement(ColumnBrowserItem, { selected: true }, 'Item') }, { id: 'current', label: 'Current', content: 'Current entries' }],
})));
const linkProps: ColumnBrowserItemLinkProps = { href: '/resources', target: '_blank', rel: 'noopener', pathSelected: true };
const nativeLink = renderToStaticMarkup(createElement(ColumnBrowserItem, linkProps, 'Resources'));
if (!nativeLink.includes('<a ') || !nativeLink.includes('href="/resources"') || nativeLink.includes('aria-pressed')) throw new Error('Native browser link consumer failed');
const richActions: ContextMenuItem[] = [{ id: 'group', type: 'separator' }, { id: 'docs', label: 'Docs', href: '/docs', shortcut: '⌘D' }, { id: 'action', label: 'Action', onSelect: () => {} }];
const menuLabels = richActions.filter(item => 'label' in item).map(item => item.label.toUpperCase());
if (menuLabels.join(',') !== 'DOCS,ACTION') throw new Error('Menu label narrowing failed');
function menuLabel(item: ContextMenuItem): string {
  return 'label' in item ? item.label.toUpperCase() : '';
}
if (menuLabel(richActions[0]) !== '') throw new Error('Separator narrowing failed');
const richMenu = renderToStaticMarkup(createElement(ContextMenu, { position: { x: 8, y: 8 }, actions: richActions, ariaLabel: 'Rich commands', onClose: () => {} }));
if (!richMenu.includes('href="/docs"') || !richMenu.includes('pt-menu-separator')) throw new Error('Rich menu consumer failed');
if (!browserMarkup.includes('Consumer browser') || !browserMarkup.includes('aria-pressed="true"')) throw new Error('Column browser consumer failed');
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
  const gestures = useRowSelectionGestures(table);
  const menu = useContextMenu<string>();
  const menuState: ContextMenuState<string> | null = menu.state;
  void menuState;
  const delegated: DelegatedContextMenuOptions<string> = { resolveContext: (_target, _root) => 'ten' };
  if (typeof menu.getDelegatedTriggerProps(delegated).onKeyDownCapture !== 'function') throw new Error('Delegated menu consumer failed');
  if (menu.state !== null || typeof menu.getTriggerProps('ten').onContextMenu !== 'function') throw new Error('Context menu hook consumer failed');
  if (typeof gestures.select !== 'function') throw new Error('Selection gesture hook export failed');
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
if (renderToStaticMarkup(createElement(ContextMenu, { position: null, actions: [], ariaLabel: 'Commands', onClose: () => {} })) !== '') throw new Error('Closed menu SSR failed');
if (!primitiveMarkup.includes('Resize Title column') || !primitiveMarkup.includes('Select Standalone item') || primitiveMarkup.indexOf('Two') > primitiveMarkup.indexOf('Ten')) throw new Error('Shared primitive consumer failed');
if (!markup.includes('aria-label="Inventory"')) throw new Error('Missing table label');
if (markup.indexOf('Two') >= markup.indexOf('Ten')) throw new Error('Numeric sorting failed');
if (clampSize(500, { id: 'price', minSize: 100, maxSize: 300, size: 200 }) !== 300) throw new Error('Sizing export failed');
if (applySelectionGesture(['ten', 'two'], { ten: true }, 'ten', 'two', { shift: true }).selection.two !== true) throw new Error('Selection gesture export failed');
if (fitColumnBrowser({ availableWidth: 724, ancestorWidth: 224, ancestorCount: 3, minimumCurrentWidth: 288 }).scrollLeft !== 448) throw new Error('Column geometry export failed');
console.log('React ${react}: typed imports and server rendering passed');
`,
    );
    await writeFile(
      path.join(directory, 'public-contracts.ts'),
      (await readFile('tests/public-type-contracts.ts', 'utf8')).replaceAll(
        '../src/index.js',
        'puppertino-table',
      ),
    );
    const recipeFiles = JSON.parse(
      execFileSync(
        path.join(root, 'node_modules/.bin/tsx'),
        ['scripts/export-table-recipes.ts', directory],
        { cwd: root, encoding: 'utf8' },
      ),
    );
    // Consumers should not require the repository's development dependencies.
    execFileSync(
      path.join(directory, 'node_modules/.bin/tsc'),
      [
        'consumer.tsx',
        'public-contracts.ts',
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
    // Frontend recipes use bundler resolution (including Phosphor's extensionless declarations).
    // Keep NodeNext above to independently verify library imports and SSR consumers.
    execFileSync(
      path.join(directory, 'node_modules/.bin/tsc'),
      [
        ...recipeFiles,
        '--outDir',
        'compiled-recipes',
        '--module',
        'ESNext',
        '--moduleResolution',
        'Bundler',
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
    console.log(
      `Typechecked ${recipeFiles.length - 1} Storybook recipes against the installed package.`,
    );
    execFileSync(process.execPath, ['compiled/consumer.js'], { cwd: directory, stdio: 'inherit' });
    // CSS must be consumable through the public export, without copying package internals.
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import { readFileSync } from 'node:fs'; import assert from 'node:assert/strict'; const css = readFileSync(new URL(import.meta.resolve('puppertino-table/style.css')), 'utf8'); assert.match(css, /\\.pt-/); assert.match(css, /\\.pt-finder-window/); assert.match(css, /\\.pt-tag-popover/);",
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
