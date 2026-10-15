import { clampSize, columnSizeBounds } from './sizing.js';
/** Normalize saved data against the current schema, retaining hidden-column widths. */
export function normalizeColumnLayout(columns, value) {
    const bounds = columnSizeBounds(columns);
    const ids = columns.map((column) => column.id);
    if (new Set(ids).size !== ids.length || ids.some((id) => !id))
        throw new Error('Column layout IDs must be unique and nonempty.');
    const saved = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
    const valid = saved.version === 1;
    const order = valid && Array.isArray(saved.order) ? saved.order : [];
    const hidden = valid && Array.isArray(saved.hidden)
        ? saved.hidden
        : columns.filter((column) => column.defaultHidden).map((column) => column.id);
    const widths = valid && saved.widths && typeof saved.widths === 'object' && !Array.isArray(saved.widths)
        ? saved.widths
        : {};
    const pinned = columns.filter((column) => column.pinned).map((column) => column.id);
    return {
        version: 1,
        order: [
            ...new Set([
                ...pinned,
                ...order.filter((id) => typeof id === 'string' && ids.includes(id)),
                ...ids,
            ]),
        ],
        hidden: columns
            .filter((column) => !column.required && !column.pinned && hidden.includes(column.id))
            .map((column) => column.id),
        widths: Object.fromEntries(bounds.map((column) => [column.id, clampSize(widths[column.id], column)])),
    };
}
export function readColumnLayout(columns, text) {
    try {
        return normalizeColumnLayout(columns, JSON.parse(text ?? 'null'));
    }
    catch {
        return normalizeColumnLayout(columns);
    }
}
export function moveLayoutColumn(columns, layout, id, direction, eligibleIds) {
    const order = [...layout.order];
    const eligible = order.filter((key) => !layout.hidden.includes(key) &&
        columns.some((column) => column.id === key) &&
        (!eligibleIds || eligibleIds.includes(key)));
    const position = eligible.indexOf(id), target = eligible[position + direction];
    const pinned = (key) => columns.find((column) => column.id === key)?.pinned;
    if (position < 0 || !target || pinned(id) || pinned(target))
        return layout;
    const index = order.indexOf(id), next = order.indexOf(target);
    [order[index], order[next]] = [order[next], order[index]];
    return normalizeColumnLayout(columns, { ...layout, order });
}
/** Compose these with app-owned sorting actions in getHeaderMenu. */
export function columnLayoutMenu(commands, columnId) {
    const { columns, layout } = commands;
    const current = columns.find((column) => column.id === columnId);
    const actions = current
        ? [-1, 1].map((direction) => ({
            id: `layout-move-${direction}`,
            label: `Move ${current.label}${direction === -1 ? ' earlier' : ' later'}`,
            disabled: moveLayoutColumn(columns, layout, current.id, direction, columns.map((column) => column.id)) === layout,
            onSelect: () => commands.move(current.id, direction, columns.map((column) => column.id)),
        }))
        : [];
    if (current)
        actions.push({ id: 'layout-separator', type: 'separator' });
    actions.push(...layout.order.flatMap((id) => {
        const column = columns.find((column) => column.id === id);
        return column
            ? [
                {
                    id: `layout-visible-${id}`,
                    label: column.label,
                    checked: !layout.hidden.includes(id),
                    disabled: column.required || column.pinned,
                    onSelect: () => commands.setVisible(id, layout.hidden.includes(id)),
                },
            ]
            : [];
    }), { id: 'layout-reset-separator', type: 'separator' }, { id: 'layout-reset', label: 'Restore default layout', onSelect: commands.reset });
    return actions;
}
/** Ignore corrupt/retired schemas; normalize every snapshot before it reaches a table. */
export function readColumnLayoutPresets(columns, text, reserved = []) {
    try {
        const saved = JSON.parse(text ?? 'null');
        if (!saved ||
            typeof saved !== 'object' ||
            !('version' in saved) ||
            saved.version !== 1 ||
            !('presets' in saved) ||
            !Array.isArray(saved.presets))
            return [];
        const ids = new Set(reserved.map((preset) => preset.id)), names = new Set(reserved.map((preset) => preset.name.toLowerCase()));
        return saved.presets.slice(0, 30).flatMap((preset) => {
            if (!preset ||
                typeof preset !== 'object' ||
                !('id' in preset) ||
                typeof preset.id !== 'string' ||
                !preset.id ||
                !('name' in preset) ||
                typeof preset.name !== 'string' ||
                !('layout' in preset))
                return [];
            if (!preset.layout ||
                typeof preset.layout !== 'object' ||
                !('version' in preset.layout) ||
                preset.layout.version !== 1)
                return [];
            const name = preset.name.trim().replace(/\s+/g, ' ').slice(0, 64);
            if (!name || ids.has(preset.id) || names.has(name.toLowerCase()))
                return [];
            ids.add(preset.id);
            names.add(name.toLowerCase());
            return [{ id: preset.id, name, layout: normalizeColumnLayout(columns, preset.layout) }];
        });
    }
    catch {
        return [];
    }
}
