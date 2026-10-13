import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Scenario } from '../.storybook/scenarios.js';
import type { OutlineViewExampleProps } from '../demo/outline-view-example.js';
import { createPuppertinoColumnHelper, PuppertinoTable } from '../src/index.js';
import type meta from '../src/table.stories.js';
import type { Story } from '../src/table.stories.js';

const valid = { args: { density: 'compact' } } satisfies Story;
// @ts-expect-error Story overrides retain the library's density union.
const invalidDensity = { args: { density: 'tiny' } } satisfies Story;
// @ts-expect-error Story data must match the bound Person row model.
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

const validScenario = {
  name: 'Fast load',
  args: { loadingDelay: 0 },
  observe: 'Expand a branch',
} satisfies Scenario<OutlineViewExampleProps>;
const invalidScenario = {
  name: 'Invalid',
  // @ts-expect-error Scenario presets use the actual component density union.
  args: { density: 'tiny' },
  observe: '',
} satisfies Scenario<OutlineViewExampleProps>;
const invalidEventPreset = {
  name: 'Invalid',
  // @ts-expect-error Function props belong to Actions rather than serialized URL presets.
  args: { onExpandedChange: () => {} },
  observe: '',
} satisfies Scenario<OutlineViewExampleProps>;
void [validScenario, invalidScenario, invalidEventPreset];
