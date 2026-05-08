import tooltips from './tooltips.json';

/**
 * Tooltip resolver — locale-aware lookup
 *
 * @param {string} id — tooltip key (e.g., 'stat.ovr')
 * @param {string} locale — pt|en|es (default: pt)
 * @returns {string|null} — tooltip text or null if not found
 */
export function getTooltip(id, locale = 'pt') {
    if (!id) return null;
    const dict = tooltips[locale] || tooltips[tooltips.default_locale] || tooltips.pt || {};
    return dict[id] || null;
}

/**
 * Returns the count of tooltips defined for a locale.
 */
export function tooltipCount(locale = 'pt') {
    return Object.keys(tooltips[locale] || {}).length;
}

/**
 * Lists all defined tooltip IDs (useful for audit/dev gallery).
 */
export function allTooltipIds(locale = 'pt') {
    return Object.keys(tooltips[locale] || {});
}
