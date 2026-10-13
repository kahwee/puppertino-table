import type { Meta, StoryObj } from '@storybook/react-vite';
import { createPuppertinoColumnHelper, PuppertinoTable } from '../src/index.js';
import type meta from '../src/typed-table.stories.js';
import type { Story } from '../src/typed-table.stories.js';

const valid = { args: { density: 'compact' } } satisfies Story;
// @ts-expect-error Story overrides retain the library's density union.
const invalidDensity = { args: { density: 'tiny' } } satisfies Story;
// @ts-expect-error Story data must match the bound Asset row model.
const invalidData = { args: { data: [{ id: 'bad', name: 'Missing fields' }] } } satisfies Story;
const inferred: StoryObj<typeof meta> = { args: { getRowLabel: (asset) => asset.name } };
const helper = createPuppertinoColumnHelper<{ id: string; bytes: number }>();
// @ts-expect-error Accessor keys must exist on the row model.
helper.accessor('unknown', { header: 'Unknown' });
helper.accessor('bytes', {
  cell: (cell) => {
    const bytes: number = cell.getValue();
    // @ts-expect-error Numeric accessor values cannot be treated as strings.
    const text: string = cell.getValue();
    void text;
    return bytes.toFixed(0);
  },
});
const RequiredTable = PuppertinoTable<{ id: string }>;
const requiredMeta = { component: RequiredTable } satisfies Meta<typeof RequiredTable>;
// @ts-expect-error A direct component story still requires data, columns and ariaLabel.
const missingArgs = {} satisfies StoryObj<typeof requiredMeta>;
void [valid, invalidDensity, invalidData, inferred, missingArgs];
