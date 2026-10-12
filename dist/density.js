import { jsx as _jsx } from "react/jsx-runtime";
export function densityStyle(metrics = {}) {
    const properties = {
        rowHeight: '--pt-row-height',
        rowPaddingBlock: '--pt-row-padding-block',
        rowPaddingInline: '--pt-row-padding-inline',
        iconSize: '--pt-icon-size',
    };
    return Object.fromEntries(Object.entries(properties).flatMap(([key, property]) => {
        const value = metrics[key];
        if (value === undefined)
            return [];
        if (!Number.isFinite(value) ||
            value < 0 ||
            ((key === 'rowHeight' || key === 'iconSize') && value === 0))
            throw new RangeError(`Invalid density metric: ${key}.`);
        return [[property, `${value}px`]];
    }));
}
/** The same scoped metrics apply to complete tables, custom layouts and browser items. */
export function DensityScope({ density = 'native', metrics, className = '', style, ...props }) {
    return (_jsx("div", { ...props, className: `pt-density ${className}`, "data-pt-density": density, "data-pt-metrics": metrics ? 'custom' : undefined, style: { ...densityStyle(metrics), ...style } }));
}
