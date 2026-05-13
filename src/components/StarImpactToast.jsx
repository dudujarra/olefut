/**
 * StarImpactToast — SPEC-F1.3
 *
 * Toast curto top-right que aparece quando decisão mid-match
 * afeta o Star Player. Fade in/out 2s.
 */

import { useEffect, useState } from 'react';
import { Star } from '@phosphor-icons/react';

export function formatStarImpactText(starName, changes) {
    if (!starName || !changes) return '';
    const parts = [];
    if (changes.moral) {
        const d = changes.moral.after - changes.moral.before;
        if (d !== 0) parts.push(`Moral ${d > 0 ? '+' : ''}${d}`);
    }
    if (changes.xp) {
        const d = changes.xp.after - changes.xp.before;
        if (d > 0) parts.push(`+${d} XP`);
    }
    if (parts.length === 0) return '';
    return `${starName}: ${parts.join(' · ')}`;
}

export function StarImpactToast({ starName, changes, visible, onDismiss, durationMs = 2400 }) {
    const [visibleNow, setVisibleNow] = useState(visible);

    useEffect(() => {
        setVisibleNow(visible);
        if (!visible) return;
        const t = setTimeout(() => {
            setVisibleNow(false);
            if (typeof onDismiss === 'function') onDismiss();
        }, durationMs);
        return () => clearTimeout(t);
    }, [visible, durationMs, onDismiss]);

    if (!visibleNow || !starName) return null;
    const text = formatStarImpactText(starName, changes);
    if (!text) return null;

    return (
        <div
            className="ef-star-impact-toast"
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                top: '88px',
                right: '24px',
                backgroundColor: 'var(--color-bg-deep)',
                border: '1px solid var(--accent)',
                padding: '10px 14px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                zIndex: 990,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                animation: 'ef-toast-fade 2.4s ease-in-out forwards',
            }}
        >
            <Star size={16} color="var(--accent)" weight="fill" />
            <span>{text}</span>
        </div>
    );
}

export default StarImpactToast;
