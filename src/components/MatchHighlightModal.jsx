/**
 * MatchHighlightModal — SPEC-F1.1
 *
 * Overlay rapido (3s auto-dismiss) que destaca eventos críticos
 * (gol, vermelho) durante partida live. Pausa ticker via prop.
 */

import { useEffect, useCallback } from 'react';
import { CheckCircle, Warning, SoccerBall } from '@phosphor-icons/react';

// ─── pure helpers exportados pra teste ───

export function getHighlightIcon(eventType) {
    if (eventType === 'goal') return SoccerBall;
    if (eventType === 'red' || eventType === 'red-card') return Warning;
    return CheckCircle;
}

export function getHighlightColor(eventType) {
    if (eventType === 'goal') return '#FFD700';
    if (eventType === 'red' || eventType === 'red-card') return '#FF3333';
    return '#FDFBF7';
}

export function extractHighlightContext(narrationEntry) {
    if (!narrationEntry) return null;
    const text = narrationEntry.text || '';
    let type = 'other';
    if (text.includes('⚽') || text.toLowerCase().includes('goool')) type = 'goal';
    else if (text.includes('🟥') || text.toLowerCase().includes('vermelho')) type = 'red';
    else return null; // não é highlight
    return {
        type,
        minute: narrationEntry.minute || 0,
        text,
    };
}

export function MatchHighlightModal({ context, onDismiss, autoDismissMs = 3000 }) {
    const handleDismiss = useCallback(() => {
        if (typeof onDismiss === 'function') onDismiss();
    }, [onDismiss]);

    useEffect(() => {
        if (!context) return;
        const t = setTimeout(handleDismiss, autoDismissMs);
        const onKey = (e) => { if (e.key === 'Escape') handleDismiss(); };
        window.addEventListener('keydown', onKey);
        return () => {
            clearTimeout(t);
            window.removeEventListener('keydown', onKey);
        };
    }, [context, handleDismiss, autoDismissMs]);

    if (!context) return null;

    const Icon = getHighlightIcon(context.type);
    const color = getHighlightColor(context.type);

    return (
        <div
            className="ef-match-highlight-modal"
            role="alert"
            aria-live="assertive"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(5, 10, 15, 0.92)',
                zIndex: 980,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none',
            }}
        >
            <div style={{
                maxWidth: '600px',
                width: '90%',
                backgroundColor: 'var(--color-bg-deep)',
                border: `3px solid ${color}`,
                padding: '32px',
                textAlign: 'center',
                pointerEvents: 'auto',
                animation: 'ef-highlight-pulse 0.4s ease-out',
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={64} color={color} weight="fill" />
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    color,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'bold',
                    letterSpacing: '0.15em',
                    marginBottom: '8px',
                }}>
                    MINUTO {context.minute}
                </div>
                <div style={{
                    fontSize: '1.4rem',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'bold',
                    lineHeight: 1.3,
                }}>
                    {context.text}
                </div>
            </div>
        </div>
    );
}

export default MatchHighlightModal;
