import { clampSize } from './sizing.js';
/** Gesture ownership and width transitions. No React or browser globals. */
export function createResizeController(environment, persist) {
    const members = new Set();
    let stopListening;
    let drag = null;
    const finish = (cancel) => {
        const active = drag;
        if (!active)
            return false;
        drag = null;
        active.cleanup();
        if (cancel) {
            active.member.adapter.apply(active.member.adapter.coupled
                ? active.before
                : {
                    ...active.before,
                    ...active.member.adapter.snapshot(),
                    [active.id]: active.before[active.id],
                });
        }
        else
            persist(active.member, active.member.adapter.coupled
                ? active.latest
                : {
                    ...active.member.adapter.snapshot(),
                    [active.id]: active.latest[active.id],
                });
        return true;
    };
    const owns = (member, pointer) => drag?.member === member && drag.pointer === pointer;
    const cancelMember = (member) => {
        if (drag?.member === member)
            finish(true);
    };
    const resetMember = (member, id) => {
        if (!members.has(member) || member.options.enabled === false || drag)
            return false;
        const widths = member.adapter.snapshot();
        const bounds = member.adapter.bounds(id);
        const applied = member.adapter.reset(id);
        persist(member, member.adapter.coupled
            ? (applied ?? member.adapter.snapshot())
            : { ...widths, [id]: clampSize(bounds.size, bounds) });
        return true;
    };
    return {
        cancelMember,
        retain(member) {
            if (!members.size)
                stopListening = environment.listenCancel(() => finish(true));
            members.add(member);
            let released = false;
            return () => {
                if (released)
                    return;
                released = true;
                cancelMember(member);
                members.delete(member);
                if (!members.size) {
                    stopListening?.();
                    stopListening = undefined;
                }
            };
        },
        begin(member, id, x, pointer, target, button) {
            if (button !== 0 ||
                member.options.enabled === false ||
                drag ||
                !members.has(member) ||
                environment.isCompact(member.options.cancelMediaQuery))
                return false;
            const before = member.adapter.snapshot();
            if (!Number.isFinite(before[id]))
                return false;
            const active = {
                member,
                id,
                x,
                width: before[id],
                before,
                latest: { ...before },
                pointer,
                query: member.options.cancelMediaQuery,
                cleanup: () => { },
            };
            drag = active;
            try {
                active.cleanup = environment.startGesture(target, pointer, member.options.dragClassName ?? 'pt-resizing', active.query, () => finish(true));
            }
            catch {
                finish(true);
                return false;
            }
            return true;
        },
        move(member, pointer, x) {
            if (!owns(member, pointer) || !drag)
                return;
            drag.latest = {
                ...member.adapter.snapshot(),
                [drag.id]: clampSize(drag.width + x - drag.x, member.adapter.bounds(drag.id)),
            };
            const applied = member.adapter.apply(drag.latest);
            if (member.adapter.coupled)
                drag.latest = { ...(applied ?? member.adapter.snapshot()) };
        },
        end(member, pointer) {
            if (owns(member, pointer))
                finish(member.options.enabled === false || environment.isCompact(drag?.query));
        },
        cancel(member, pointer) {
            if (owns(member, pointer))
                finish(true);
        },
        reset: resetMember,
        key(member, id, key, shift = false) {
            if (!members.has(member) || member.options.enabled === false || drag)
                return false;
            if (key === 'Enter') {
                return resetMember(member, id);
            }
            const widths = member.adapter.snapshot();
            const bounds = member.adapter.bounds(id);
            const step = shift ? 40 : 16;
            const next = key === 'ArrowLeft'
                ? widths[id] - step
                : key === 'ArrowRight'
                    ? widths[id] + step
                    : key === 'Home'
                        ? bounds.minSize
                        : key === 'End'
                            ? bounds.maxSize
                            : undefined;
            if (next === undefined)
                return false;
            const committed = { ...widths, [id]: clampSize(next, bounds) };
            const applied = member.adapter.apply(committed);
            persist(member, member.adapter.coupled ? (applied ?? member.adapter.snapshot()) : committed);
            return true;
        },
    };
}
