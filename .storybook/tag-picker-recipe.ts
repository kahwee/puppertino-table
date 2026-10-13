export const tagPickerRecipe = `'use client';
import { useState } from 'react';
import { TagPicker, type TagOption } from 'puppertino-table';
import '@codedgar/puppertino/colors';
import '@codedgar/puppertino/forms';
import '@codedgar/puppertino/popovers';
import 'puppertino-table/style.css';

const initialOptions: TagOption[] = [
  { id: 'review', label: 'Review' },
  { id: 'work', label: 'Work' },
];
export function DocumentTags() {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState<string[]>(['review']);
  return <TagPicker options={options} value={value} onValueChange={setValue}
    title="Assign tags" onCreate={label => {
      // Replace with your app's creation API and its stable returned ID.
      const id = label;
      setOptions(previous => [...previous, { id, label }]);
      setValue(previous => [...previous, id]);
    }} />;
}`;
