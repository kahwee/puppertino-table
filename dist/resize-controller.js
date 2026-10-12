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
        active.member.adapter.apply(cancel ? active.before : active.member.adapter.snapshot());
        if (!cancel)
            persist(active.member);
        return true;
    };
    const owns = (member, pointer) => drag?.member === member && drag.pointer === pointer;
    const cancelMember = (member) => {
        if (drag?.member === member)
            finish(true);
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
            member.adapter.apply({
                ...member.adapter.snapshot(),
                [drag.id]: clampSize(drag.width + x - drag.x, member.adapter.bounds(drag.id)),
            });
        },
        end(member, pointer) {
            if (owns(member, pointer))
                finish(member.options.enabled === false || environment.isCompact(drag?.query));
        },
        cancel(member, pointer) {
            if (owns(member, pointer))
                finish(true);
        },
        reset(member, id) {
            if (!members.has(member) || member.options.enabled === false || drag)
                return false;
            member.adapter.reset(id);
            persist(member);
            return true;
        },
        key(member, id, key, shift = false) {
            if (!members.has(member) || member.options.enabled === false || drag)
                return false;
            if (key === 'Enter') {
                member.adapter.reset(id);
                persist(member);
                return true;
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
            member.adapter.apply({ ...widths, [id]: clampSize(next, bounds) });
            persist(member);
            return true;
        },
    };
}
