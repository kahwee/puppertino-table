export interface TableRecipeSources {
  fixtures: string;
  stateExamples: string;
  stories: string;
  dateExample: string;
  dateFormat: string;
}

export function createTableRecipes({
  fixtures,
  stateExamples,
  stories,
  dateExample,
  dateFormat,
}: TableRecipeSources) {
  // Reuse the rendered examples so documentation cannot drift from their state wiring.
  const peopleFixture = fixtures
    .slice(0, fixtures.indexOf('export interface Product'))
    .replace("'../src/index.js'", "'puppertino-table'");
  const styles = `import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/lists';
import '@codedgar/puppertino/forms';
import 'puppertino-table/style.css';`;
  function recipe(imports: string, body: string) {
    return `'use client';\n${imports}\n${styles}\n\n${peopleFixture}\n${body.trim()}`;
  }
  function section(source: string, start: string, end?: string) {
    const from = source.indexOf(start);
    const to = end ? source.indexOf(end, from) : undefined;
    if (from < 0 || to === -1) throw new Error(`Missing Storybook recipe section: ${start}`);
    return source.slice(from, to);
  }
  const controlled = section(stories, 'function Example(', 'const meta =')
    .replace('function Example(', 'export function PeopleTable(')
    .replace("'atoms'>>)", "'atoms'>> = {})");

  function gestureRecipe(ownership: 'controlled' | 'local' | 'atom') {
    return recipe(
      `import { useRef, useState } from 'react';
import { useCreateAtom } from '@tanstack/react-store';
import type { RowSelectionState } from '@tanstack/react-table';
import { usePuppertinoTable, useRowSelectionGestures } from 'puppertino-table';`,
      section(stories, 'function ItemGestureExample(', 'export const ItemSelectionGestures:') +
        `\nexport function GestureItems() { return <ItemGestureExample ownership="${ownership}" />; }`,
    );
  }
  return {
    controlled: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      controlled,
    ),
    server: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      controlled.replace('        manualSorting={false}', '        manualSorting'),
    ),
    uncontrolled: recipe(
      `import { PuppertinoTable } from 'puppertino-table';`,
      `export function PeopleTable() {
  return (
    <PuppertinoTable
      data={people.slice(0, 12)}
      columns={personColumns}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      ariaLabel="People"
      selectable
    />
  );
}`,
    ),
    readOnly: recipe(
      `import { PuppertinoTable } from 'puppertino-table';`,
      section(stateExamples, 'export function ReadOnlyStateExample()'),
    ),
    sizing: recipe(
      `import { useState } from 'react';
import type { ColumnSizingState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';`,
      section(
        stateExamples,
        'export function ControlledSizingExample()',
        'function AtomWidthOutput(',
      ),
    ),
    atoms: recipe(
      `import { useState } from 'react';
import { useCreateAtom, useSelector } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableAtoms } from 'puppertino-table';`,
      section(stateExamples, 'function AtomWidthOutput(', 'export function ResizeEventsExample()'),
    ),
    resize: recipe(
      `import { useState } from 'react';
import type { ColumnSizingState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';`,
      section(
        stateExamples,
        'export function ResizeEventsExample()',
        'export function ReadOnlyStateExample()',
      ),
    ),
    hook: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { TableBody, TableHeader, usePuppertinoTable } from 'puppertino-table';`,
      section(stories, 'function HookLayoutExample()', 'export const HookLayout:').replace(
        'function HookLayoutExample()',
        'export function HookLayoutExample()',
      ),
    ),
    customized: recipe(
      `import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';`,
      section(stories, 'function CustomizedRowsExample(', 'export const CustomizedRows:').replace(
        'function CustomizedRowsExample(',
        'export function CustomizedRowsExample(',
      ),
    ),
    leading: recipe(
      `import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';`,
      section(stories, 'function CustomizedRowsExample(', 'export const CustomizedRows:') +
        '\nexport function EmptyTableWithLeadingRows() { return <CustomizedRowsExample empty />; }',
    ),
    paginated: recipe(
      `import { useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { PuppertinoTable } from 'puppertino-table';`,
      section(
        stories,
        'function PaginatedSelectionExample()',
        'export const PaginatedSelection:',
      ).replace(
        'function PaginatedSelectionExample()',
        'export function PaginatedSelectionExample()',
      ),
    ),
    controlledGestures: gestureRecipe('controlled'),
    localGestures: gestureRecipe('local'),
    atomGestures: gestureRecipe('atom'),
    standalone: recipe(
      `import { useState } from 'react';
import { ColumnResizeHandle, type PuppertinoColumnDef, usePuppertinoTable } from 'puppertino-table';`,
      section(stories, 'const standaloneColumns:', 'export const StandaloneResize:').replace(
        'function StandaloneResizeExample()',
        'export function StandaloneResizeExample()',
      ),
    ),
    observed: recipe(
      `import { useState } from 'react';
import { PuppertinoTable } from 'puppertino-table';`,
      section(
        stories,
        'function UncontrolledStateExample()',
        'export const UncontrolledState:',
      ).replace(
        'function UncontrolledStateExample()',
        'export function UncontrolledStateExample()',
      ),
    ),
    checkbox: recipe(
      `import { RowSelectionCheckbox, usePuppertinoTable } from 'puppertino-table';`,
      section(
        stories,
        'function CheckboxPrimitiveExample()',
        'export const CheckboxPrimitive:',
      ).replace(
        'function CheckboxPrimitiveExample()',
        'export function CheckboxPrimitiveExample()',
      ),
    ),
    independent: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      controlled +
        '\nexport function IndependentTables() { return <><PeopleTable ariaLabel="First table" /><PeopleTable ariaLabel="Second table" /></>; }',
    ),
    empty: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      controlled +
        '\nexport function EmptyTable() { return <PeopleTable data={[]} emptyContent="No people match this view." />; }',
    ),
    disabled: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      `${controlled}\nexport function DisabledTable() { return <PeopleTable disabled />; }`,
    ),
    grouped: recipe(
      `import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { PuppertinoTable, type PuppertinoTableProps } from 'puppertino-table';`,
      controlled +
        '\nexport function GroupedTable() { return <PeopleTable columns={[{ id: "identity", header: "Identity", columns: personColumns.slice(0, 2) }, ...personColumns.slice(2)]} />; }',
    ),
    products: `'use client';\nimport { PuppertinoTable } from 'puppertino-table';\n${styles}\n${fixtures.replace("'../src/index.js'", "'puppertino-table'")}\nexport function Inventory() { return <PuppertinoTable data={products} columns={productColumns} getRowId={(row) => row.id} ariaLabel="Inventory" />; }`,
    dates: `'use client';\n${styles}\n${dateExample.replace("'../src/index.js'", "'puppertino-table'").replace("import { formatDateTime } from './date-format.js';", dateFormat)}`,
  };
}
