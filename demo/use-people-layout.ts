import { useState } from 'react';
import { useColumnLayout } from '../src/index.js';
import { peopleLayoutColumns, peopleLayoutKey } from './people-layout.js';

const presets = [
  { id: 'review', name: 'Review', layout: { order: ['name', 'score', 'active', 'team'] } },
  { id: 'details', name: 'Team details' },
  { id: 'minimal', name: 'Minimal', layout: { hidden: ['team', 'score'] } },
];
export function usePeopleLayout() {
  const layout = useColumnLayout({
    columns: peopleLayoutColumns,
    storageKey: peopleLayoutKey,
    presets,
  });
  const [notice, setNotice] = useState('');
  const savedNotice = () => {
    try {
      setNotice(
        window.localStorage.getItem(peopleLayoutKey) === JSON.stringify(layout.layout)
          ? 'Layout saved on this device.'
          : 'Layout updated for this visit.',
      );
    } catch {
      setNotice('Layout updated for this visit.');
    }
  };
  return {
    ...layout,
    notice,
    setVisible(id: string, visible: boolean) {
      layout.setVisible(id, visible);
      savedNotice();
    },
    move(id: string, direction: -1 | 1, eligibleIds?: readonly string[]) {
      layout.move(id, direction, eligibleIds);
      savedNotice();
    },
    reset() {
      layout.reset();
      setNotice('Default columns and widths restored.');
    },
  };
}
