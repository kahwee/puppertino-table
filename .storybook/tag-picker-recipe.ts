import type { TagOption, TagPickerProps } from '../src/index.js';
export const standardOptions: TagOption[] = [
  { id: 'review', label: 'Review' },
  { id: 'work', label: 'Work' },
  { id: 'alpine', label: 'Project Alpine' },
];

export type TagRecipeArgs = Partial<TagPickerProps> & {
  optionSet?: 'standard' | 'longLabels' | 'disabledTags' | 'custom';
  allowCreation?: boolean;
};
export function tagOptions(
  optionSet: TagRecipeArgs['optionSet'],
  options?: readonly TagOption[],
): readonly TagOption[] {
  return optionSet === 'custom'
    ? (options ?? standardOptions)
    : optionSet === 'longLabels'
      ? standardOptions.map((option) =>
          option.id === 'review'
            ? {
                ...option,
                label: 'A very long project name that wraps without widening the popover',
              }
            : option,
        )
      : optionSet === 'disabledTags'
        ? standardOptions.map((option) => ({ ...option, disabled: option.id !== 'alpine' }))
        : standardOptions;
}

export function tagPickerSource(args: TagRecipeArgs) {
  const base = tagOptions(args.optionSet, args.options);
  const initialOptions = [
    ...base,
    ...(args.options ?? []).filter((option) => !base.some((item) => item.id === option.id)),
  ];
  const creation =
    args.allowCreation !== false
      ? `
    onCreate={label => {
      // Replace with your creation API and its returned stable ID.
      const id = label;
      setOptions(previous => [...previous, { id, label }]);
      setValue(previous => [...previous, id]);
    }}`
      : '';
  return `'use client';
import { useState } from 'react';
import { TagPicker, type TagOption } from 'puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/forms';
import '@codedgar/puppertino/popovers';
import 'puppertino-table/style.css';

const initialOptions: TagOption[] = ${JSON.stringify(initialOptions, null, 2)};
export function DocumentTags() {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState<string[]>(${JSON.stringify(args.value ?? ['review'])});
  const [mixedValue, setMixedValue] = useState<string[]>(${JSON.stringify(args.mixedValue ?? [])});
  return <TagPicker options={options} value={value} mixedValue={mixedValue}
    onValueChange={next => { setValue(next); setMixedValue(previous => previous.filter(id => !next.includes(id))); }}
    title={${JSON.stringify(args.title ?? 'Assign tags')}} disabled={${Boolean(args.disabled)}}${creation} />;
}`;
}
export const tagPickerRecipe = tagPickerSource({});
