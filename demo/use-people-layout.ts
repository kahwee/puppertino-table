import { useCreateAtom } from '@tanstack/react-store';
import type { ColumnSizingState } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import {
  defaultPeopleLayout,
  normalizePeopleLayout,
  type PeopleColumnId,
  type PeopleLayout,
  peopleLayoutKey,
  readPeopleLayout,
} from './people-layout.js';

/** App-owned layout: restore after hydration, save visibility and completed widths together. */
export function usePeopleLayout() {
  const committed = useRef<PeopleLayout>(defaultPeopleLayout());
  const columnSizing = useCreateAtom<ColumnSizingState>(committed.current.widths);
  const [hidden, setHidden] = useState<PeopleColumnId[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let restored = defaultPeopleLayout();
    try {
      restored = readPeopleLayout(window.localStorage.getItem(peopleLayoutKey));
    } catch {
      /* Storage is optional. */
    }
    committed.current = restored;
    columnSizing.set(restored.widths);
    setHidden(restored.hidden);
    setReady(true);
  }, [columnSizing]);
  const save = (layout: PeopleLayout) => {
    committed.current = layout;
    columnSizing.set(layout.widths);
    setHidden((previous) =>
      previous.join(',') === layout.hidden.join(',') ? previous : layout.hidden,
    );
    try {
      window.localStorage.setItem(peopleLayoutKey, JSON.stringify(layout));
      setNotice('Layout saved on this device.');
    } catch {
      setNotice('Layout updated for this visit.');
    }
  };
  return {
    hidden,
    ready,
    notice,
    columnSizing,
    setVisible(id: PeopleColumnId, visible: boolean) {
      if (id === 'name') return;
      const next = new Set(committed.current.hidden);
      if (visible) next.delete(id);
      else next.add(id);
      save(normalizePeopleLayout({ ...committed.current, hidden: [...next] }));
    },
    commitWidths(widths: ColumnSizingState) {
      if (ready)
        save(
          normalizePeopleLayout({
            ...committed.current,
            widths: { ...committed.current.widths, ...widths },
          }),
        );
    },
    reset() {
      save(defaultPeopleLayout());
      setNotice('Default columns and widths restored.');
    },
  };
}
