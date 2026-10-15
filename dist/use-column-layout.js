'use client';
import { useCreateAtom } from '@tanstack/react-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moveLayoutColumn, normalizeColumnLayout, readColumnLayout, readColumnLayoutPresets, } from './column-layout.js';
/** Width previews stay in an atom; only structural changes rerender the owner. */
export function useColumnLayout({ columns, storageKey, storage, legacyWidthsKey, presets: definitions, }) {
    const committed = useRef(normalizeColumnLayout(columns));
    const columnSizing = useCreateAtom(committed.current.widths);
    const columnOrder = useCreateAtom(committed.current.order);
    const persistence = useCreateAtom('saved');
    const builtins = useMemo(() => (definitions ?? []).map((preset) => ({
        id: preset.id,
        name: preset.name,
        layout: normalizeColumnLayout(columns, { version: 1, ...preset.layout }),
        readOnly: true,
    })), [columns, definitions]);
    const [userPresets, setUserPresets] = useState([]);
    const profiles = useRef([]);
    const preferred = useRef(null);
    const [layout, setLayout] = useState(committed.current);
    const [ready, setReady] = useState(false);
    const adapter = useCallback(() => storage ?? window.localStorage, [storage]);
    useEffect(() => {
        let restored = normalizeColumnLayout(columns);
        let restoredPresets = [];
        try {
            const text = adapter().getItem(storageKey);
            try {
                const record = JSON.parse(adapter().getItem(`${storageKey}.presets.v1`) ?? 'null');
                preferred.current = typeof record?.activeId === 'string' ? record.activeId : null;
            }
            catch {
                preferred.current = null;
            }
            restoredPresets = readColumnLayoutPresets(columns, adapter().getItem(`${storageKey}.presets.v1`), builtins);
            restored = readColumnLayout(columns, text);
            if (text === null && legacyWidthsKey) {
                const widths = JSON.parse(adapter().getItem(legacyWidthsKey) ?? '{}');
                restored = normalizeColumnLayout(columns, { ...restored, widths });
            }
        }
        catch {
            /* Storage is optional; restore safe defaults. */
        }
        profiles.current = restoredPresets;
        setUserPresets(restoredPresets);
        committed.current = restored;
        columnSizing.set(restored.widths);
        columnOrder.set(restored.order);
        setLayout(restored);
        setReady(true);
    }, [columns, adapter, storageKey, legacyWidthsKey, columnSizing, columnOrder, builtins]);
    const save = useCallback((next, structural) => {
        committed.current = next;
        columnSizing.set(next.widths);
        if (structural) {
            columnOrder.set(next.order);
            setLayout(next);
        }
        try {
            adapter().setItem(storageKey, JSON.stringify(next));
            persistence.set('saved');
        }
        catch {
            persistence.set('session');
        }
    }, [adapter, storageKey, columnSizing, columnOrder, persistence]);
    const setVisible = useCallback((id, visible) => {
        const column = columns.find((column) => column.id === id);
        if (!ready || !column || column.required || column.pinned)
            return;
        const hidden = new Set(committed.current.hidden);
        if (visible)
            hidden.delete(id);
        else
            hidden.add(id);
        save(normalizeColumnLayout(columns, { ...committed.current, hidden: [...hidden] }), true);
    }, [columns, ready, save]);
    const move = useCallback((id, direction, eligibleIds) => {
        if (!ready)
            return;
        const next = moveLayoutColumn(columns, committed.current, id, direction, eligibleIds);
        if (next !== committed.current)
            save(next, true);
    }, [columns, ready, save]);
    const commitWidths = useCallback((widths) => {
        if (ready)
            save(normalizeColumnLayout(columns, {
                ...committed.current,
                widths: { ...committed.current.widths, ...widths },
            }), false);
    }, [columns, ready, save]);
    const reset = useCallback(() => {
        if (ready) {
            preferred.current = null;
            save(normalizeColumnLayout(columns), true);
            try {
                adapter().setItem(`${storageKey}.presets.v1`, JSON.stringify({ version: 1, activeId: null, presets: profiles.current }));
            }
            catch {
                persistence.set('session');
            }
        }
    }, [columns, ready, save, adapter, storageKey, persistence]);
    const commitOrder = useCallback((update) => {
        if (!ready)
            return;
        const order = typeof update === 'function' ? update(committed.current.order) : update;
        save(normalizeColumnLayout(columns, { ...committed.current, order }), true);
    }, [columns, ready, save]);
    const allPresets = [...builtins, ...userPresets];
    const storePresets = (next) => {
        profiles.current = next;
        setUserPresets(next);
        try {
            adapter().setItem(`${storageKey}.presets.v1`, JSON.stringify({ version: 1, activeId: preferred.current, presets: next }));
            persistence.set('saved');
        }
        catch {
            persistence.set('session');
        }
    };
    const validName = (name, id) => {
        const clean = name.trim().replace(/\s+/g, ' ');
        return clean &&
            clean.length <= 64 &&
            ![...builtins, ...profiles.current].some((preset) => preset.id !== id && preset.name.toLowerCase() === clean.toLowerCase())
            ? clean
            : null;
    };
    const getActivePresetId = useMemo(() => {
        let previous;
        return () => {
            // Live width previews do not change the committed snapshot. Match presets only
            // after a completed edit or profile change, even when a selector checks each tick.
            if (previous?.layout === committed.current &&
                previous.profiles === profiles.current &&
                previous.preferred === preferred.current)
                return previous.id;
            const snapshot = JSON.stringify(committed.current);
            const matches = [...builtins, ...profiles.current].filter((preset) => JSON.stringify(preset.layout) === snapshot);
            const id = matches.find((preset) => preset.id === preferred.current)?.id ?? matches[0]?.id ?? '';
            previous = {
                layout: committed.current,
                profiles: profiles.current,
                preferred: preferred.current,
                id,
            };
            return id;
        };
    }, [builtins]);
    return {
        presets: allPresets,
        getActivePresetId,
        get activePresetId() {
            return getActivePresetId();
        },
        applyPreset(id) {
            const preset = [...builtins, ...profiles.current].find((item) => item.id === id);
            if (ready && preset) {
                preferred.current = id;
                save(normalizeColumnLayout(columns, preset.layout), true);
                storePresets(profiles.current);
            }
        },
        savePreset(name) {
            const clean = validName(name);
            if (!ready || !clean || profiles.current.length >= 30)
                return null;
            const id = globalThis.crypto?.randomUUID?.() ??
                `layout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
            preferred.current = id;
            storePresets([
                ...profiles.current,
                { id, name: clean, layout: normalizeColumnLayout(columns, committed.current) },
            ]);
            return id;
        },
        renamePreset(id, name) {
            const clean = validName(name, id);
            if (!ready || !clean || !profiles.current.some((preset) => preset.id === id))
                return false;
            storePresets(profiles.current.map((preset) => (preset.id === id ? { ...preset, name: clean } : preset)));
            return true;
        },
        deletePreset(id) {
            if (ready && profiles.current.some((preset) => preset.id === id))
                storePresets(profiles.current.filter((preset) => preset.id !== id));
        },
        columnOrder,
        commitOrder,
        persistence,
        get layout() {
            return committed.current;
        },
        hidden: layout.hidden,
        order: layout.order,
        ready,
        columnSizing,
        setVisible,
        move,
        commitWidths,
        reset,
    };
}
