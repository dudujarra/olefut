import React from 'react';

/**
 * Format string for star impact changes.
 * @param {string} name 
 * @param {object} changes { moral: {before, after}, xp: {before, after} }
 * @returns {string}
 */
export function formatStarImpactText(name, changes) {
    if (!name) return '';

    const parts = [];

    if (changes.moral) {
        const delta = changes.moral.after - changes.moral.before;
        if (delta > 0) parts.push(`Moral +${delta}`);
        if (delta < 0) parts.push(`Moral ${delta}`);
    }

    if (changes.xp) {
        const delta = changes.xp.after - changes.xp.before;
        if (delta > 0) parts.push(`+${delta} XP`);
        if (delta < 0) parts.push(`${delta} XP`);
    }

    if (changes.energy) {
        const delta = changes.energy.after - changes.energy.before;
        if (delta > 0) parts.push(`Energia +${delta}`);
        if (delta < 0) parts.push(`Energia ${delta}`);
    }

    if (parts.length === 0) return '';

    return `${name}: ${parts.join(' · ')}`;
}

export default function StarImpactToast({ impact }) {
    if (!impact) return null;
    
    return (
        <div className="star-impact-toast">
            {formatStarImpactText(impact.name, impact.changes)}
        </div>
    );
}
