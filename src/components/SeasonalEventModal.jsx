/**
 * SeasonalEventModal — SPEC-C6.2
 *
 * Modal automático mostrado quando engine.pendingSeasonalEvent existe
 * (setado por WeekProcessor em weeks 1/13/26/38). Player escolhe opção,
 * effect aplicado em team, flag limpa.
 */

import { useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CalendarBlank, X } from '@phosphor-icons/react';

// ─── pure helpers exportados pra teste ───

export function applyEventEffectToTeam(effect, team) {
    if (!effect || !team) return { applied: false };
    const changes = {};
    if (typeof effect.moralDelta === 'number') {
        const before = team.moral ?? 50;
        const after = Math.max(0, Math.min(100, before + effect.moralDelta));
        team.moral = after;
        changes.moral = { before, after };
    }
    if (typeof effect.energyDelta === 'number' && Array.isArray(team.squad)) {
        team.squad.forEach(p => {
            if (typeof p.energy === 'number') {
                p.energy = Math.max(0, Math.min(100, p.energy + effect.energyDelta));
            }
        });
        changes.energyApplied = effect.energyDelta;
    }
    return { applied: true, changes };
}

export function formatSeasonalChip(effect) {
    if (!effect || typeof effect !== 'object') return '';
    const parts = [];
    if (typeof effect.moralDelta === 'number') {
        parts.push(`Moral ${effect.moralDelta > 0 ? '+' : ''}${effect.moralDelta}`);
    }
    if (typeof effect.energyDelta === 'number') {
        parts.push(`Energia ${effect.energyDelta > 0 ? '+' : ''}${effect.energyDelta}`);
    }
    return parts.join(' · ');
}

export function SeasonalEventModal() {
    const { getEngine, forceUpdate } = useGame();
    const engine = getEngine?.();
    const event = engine?.pendingSeasonalEvent || null;

    const close = useCallback(() => {
        if (!engine) return;
        engine.pendingSeasonalEvent = null;
        if (typeof forceUpdate === 'function') forceUpdate();
    }, [engine, forceUpdate]);

    const handleChoose = useCallback((opt) => {
        if (!engine || !opt) return close();
        try {
            const team = engine.getTeam(engine.manager?.teamId);
            applyEventEffectToTeam(opt.effect, team);
            if (engine.weekEvents) {
                engine.weekEvents.push(`📅 ${opt.resultText || ''}`);
            }
        } catch { /* defensive */ }
        close();
    }, [engine, close]);

    useEffect(() => {
        if (!event) return;
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [event, close]);

    if (!event) return null;

    return (
        <div
            className="ef-seasonal-event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ef-seasonal-title"
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
                border: '2px solid #39FF14',
                padding: '24px',
                position: 'relative',
            }}>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar evento"
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
                    <CalendarBlank size={20} color="#39FF14" weight="fill" />
                    <span id="ef-seasonal-title" style={{
                        fontSize: '0.75rem',
                        color: '#39FF14',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                    }}>
                        {event.title}
                    </span>
                </div>

                <p style={{
                    color: '#FDFBF7',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    margin: '0 0 20px 0',
                }}>
                    {event.text}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {event.options.map((opt, idx) => {
                        const chip = formatSeasonalChip(opt.effect);
                        return (
                            <button
                                key={`${event.id}-opt-${idx}`}
                                type="button"
                                onClick={() => handleChoose(opt)}
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

export default SeasonalEventModal;
