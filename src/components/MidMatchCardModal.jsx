/**
 * MidMatchCardModal — SPEC-B2.2
 *
 * Overlay pausa-style com carta de decisão mid-match.
 * Pronto para wiring no MatchView quando shouldTriggerMidMatch dispara.
 */

import { useCallback, useEffect } from 'react';
import { ChatCircle, X } from '@phosphor-icons/react';

// ─── helpers exportados para teste ───

export function formatEffectChip(effect) {
    if (!effect || typeof effect !== 'object') return '';
    const parts = [];
    if (typeof effect.moralDelta === 'number') {
        parts.push(`Moral ${effect.moralDelta > 0 ? '+' : ''}${effect.moralDelta}`);
    }
    if (typeof effect.energyDelta === 'number') {
        parts.push(`Energia ${effect.energyDelta > 0 ? '+' : ''}${effect.energyDelta}`);
    }
    if (typeof effect.tacticShift === 'string' && effect.tacticShift.length > 0) {
        parts.push(`Tática: ${effect.tacticShift}`);
    }
    return parts.join(' · ');
}

export function MidMatchCardModal({ card, onChoose, onClose }) {
    const handleChoose = useCallback((opt, idx) => {
        if (typeof onChoose === 'function') onChoose(opt, idx);
        if (typeof onClose === 'function') onClose();
    }, [onChoose, onClose]);

    const handleClose = useCallback(() => {
        if (typeof onClose === 'function') onClose();
    }, [onClose]);

    useEffect(() => {
        if (!card) return;
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [card, handleClose]);

    if (!card) return null;

    return (
        <div
            className="ef-midmatch-card-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ef-midmatch-title"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(5, 10, 15, 0.92)',
                zIndex: 950,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
            }}
        >
            <div style={{
                maxWidth: '560px',
                width: '100%',
                backgroundColor: '#0E1418',
                border: '2px solid #FFD700',
                padding: '24px',
                position: 'relative',
            }}>
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Fechar carta"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'transparent',
                        border: '1px solid #2D3748',
                        color: '#FDFBF7',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                    }}
                >
                    <X size={14} weight="bold" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <ChatCircle size={20} color="#FFD700" weight="fill" />
                    <span id="ef-midmatch-title" style={{
                        fontSize: '0.75rem',
                        color: '#FFD700',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                    }}>
                        DECISÃO DO TÉCNICO
                    </span>
                </div>

                <p style={{
                    color: '#FDFBF7',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    margin: '0 0 20px 0',
                }}>
                    {card.text}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {card.options.map((opt, idx) => {
                        const chip = formatEffectChip(opt.effect);
                        return (
                            <button
                                key={`${card.id}-opt-${idx}`}
                                type="button"
                                onClick={() => handleChoose(opt, idx)}
                                className="ef-midmatch-option-btn"
                                style={{
                                    backgroundColor: '#161B22',
                                    border: '1px solid #2D3748',
                                    padding: '12px 16px',
                                    fontFamily: 'var(--font-sans)',
                                    color: '#FDFBF7',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <div style={{ fontWeight: 'bold', marginBottom: chip ? '4px' : 0 }}>{opt.label}</div>
                                {chip && (
                                    <div style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-mono)' }}>
                                        {chip}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MidMatchCardModal;
