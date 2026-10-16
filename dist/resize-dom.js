const activeClasses = new Map();
function markDrag(name, delta) {
    const count = Math.max(0, (activeClasses.get(name) || 0) + delta);
    if (count)
        activeClasses.set(name, count);
    else
        activeClasses.delete(name);
    document.documentElement.classList.toggle(name, count > 0);
}
/** Browser effects are installed only when a mounted hook retains a controller. */
export const resizeEnvironment = {
    schedulePreview(flush) {
        const frame = requestAnimationFrame(flush);
        return () => cancelAnimationFrame(frame);
    },
    listenCancel(cancel) {
        const onEscape = (event) => {
            if (event.key === 'Escape' && cancel())
                event.preventDefault();
        };
        const blur = () => {
            cancel();
        };
        window.addEventListener('keydown', onEscape);
        window.addEventListener('blur', blur);
        return () => {
            window.removeEventListener('keydown', onEscape);
            window.removeEventListener('blur', blur);
        };
    },
    isCompact: (query) => !!(query && window.matchMedia(query).matches),
    startGesture(target, pointer, className, query, cancel) {
        target.focus();
        target.setPointerCapture(pointer);
        markDrag(className, 1);
        const compact = query ? window.matchMedia(query) : undefined;
        const change = () => {
            if (compact?.matches)
                cancel();
        };
        compact?.addEventListener('change', change);
        let released = false;
        return () => {
            if (released)
                return;
            released = true;
            compact?.removeEventListener('change', change);
            markDrag(className, -1);
            if (target.hasPointerCapture(pointer))
                target.releasePointerCapture(pointer);
        };
    },
};
