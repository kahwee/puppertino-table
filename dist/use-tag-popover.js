'use client';
import { useLayoutEffect } from 'react';
/** Keep the native top-layer panel anchored without losing inherited theme variables. */
export function useTagPopover(open, anchor, panel, input) {
    useLayoutEffect(() => {
        const element = panel.current;
        if (!element)
            return;
        if (!open) {
            if (element.matches(':popover-open'))
                element.hidePopover();
            return;
        }
        element.showPopover();
        const fit = () => {
            const rect = anchor.current?.getBoundingClientRect();
            if (!rect)
                return;
            const width = element.getBoundingClientRect().width;
            const below = window.innerHeight - rect.bottom - 20;
            const above = rect.top - 20;
            const flip = (element.firstElementChild?.scrollHeight ?? element.scrollHeight) + 16 > below &&
                above > below;
            element.style.setProperty('--pt-tag-max-height', `${Math.max(40, flip ? above : below)}px`);
            element.style.maxHeight = `${Math.max(40, flip ? above : below)}px`;
            const height = element.getBoundingClientRect().height;
            const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
            element.style.left = `${left}px`;
            const desiredTop = flip ? rect.top - height - 12 : rect.bottom + 12;
            element.style.top = `${Math.max(8, Math.min(desiredTop, window.innerHeight - height - 8))}px`;
            element.style.setProperty('--p-popover-arrow-x', `${Math.max(20, Math.min(width - 20, rect.left + rect.width / 2 - left))}px`);
            element.dataset.pPopoverPlace = flip ? 'top' : 'bottom';
        };
        fit();
        input.current?.focus();
        const observer = new ResizeObserver(fit);
        observer.observe(element);
        if (anchor.current)
            observer.observe(anchor.current);
        window.addEventListener('resize', fit);
        window.addEventListener('scroll', fit, true);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', fit);
            window.removeEventListener('scroll', fit, true);
        };
    }, [open, anchor, panel, input]);
}
