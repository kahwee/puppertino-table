import { useEffect } from 'react';
/** Delegate focus so composed controls, disabled commands and expanded search stay in sync. */
export function useFinderToolbarNavigation(ref, enabled) {
    useEffect(() => {
        const root = ref.current;
        if (!root || !enabled)
            return;
        const original = new Map();
        let entry;
        const items = () => Array.from(root.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea')).filter((item) => !item.matches(':disabled') &&
            !item.closest('[hidden], [inert]') &&
            item.getClientRects().length > 0 &&
            getComputedStyle(item).visibility !== 'hidden');
        const sync = () => {
            const controls = items();
            const focused = controls.find((item) => item === document.activeElement);
            entry = focused ?? (entry && controls.includes(entry) ? entry : controls[0]);
            for (const item of root.querySelectorAll('button, a[href], input, select, textarea')) {
                if (!original.has(item))
                    original.set(item, item.getAttribute('tabindex'));
                item.tabIndex = item === entry ? 0 : -1;
            }
        };
        const keyDown = (event) => {
            if (event.defaultPrevented ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey)
                return;
            const target = event.target;
            if (!(target instanceof HTMLElement) ||
                target.closest('input, textarea, select, [contenteditable]'))
                return;
            const controls = items();
            const index = controls.findIndex((item) => item === target || item.contains(target));
            if (index < 0)
                return;
            const rtl = getComputedStyle(root).direction === 'rtl';
            const next = event.key === 'Home'
                ? 0
                : event.key === 'End'
                    ? controls.length - 1
                    : event.key === 'ArrowRight'
                        ? (index + (rtl ? -1 : 1) + controls.length) % controls.length
                        : event.key === 'ArrowLeft'
                            ? (index + (rtl ? 1 : -1) + controls.length) % controls.length
                            : null;
            if (next === null)
                return;
            event.preventDefault();
            controls[next]?.focus();
        };
        sync();
        root.addEventListener('focusin', sync);
        root.addEventListener('keydown', keyDown);
        const mutations = new MutationObserver(sync);
        mutations.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'hidden', 'inert', 'style', 'class'],
        });
        const resize = new ResizeObserver(sync);
        resize.observe(root);
        return () => {
            mutations.disconnect();
            resize.disconnect();
            root.removeEventListener('focusin', sync);
            root.removeEventListener('keydown', keyDown);
            for (const [item, tabIndex] of original) {
                if (tabIndex === null)
                    item.removeAttribute('tabindex');
                else
                    item.setAttribute('tabindex', tabIndex);
            }
        };
    }, [ref, enabled]);
}
