/**
 * ChronicleSeasonEndModal — SPEC-B3
 *
 * Modal full-screen mostrado automaticamente ao fim de temporada.
 * Render quando engine.pendingChronicleSeason e truthy.
 */

import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Scroll, Download, X, Trophy, CloudRain } from '@phosphor-icons/react';

// ─── pure helpers exportados pra teste ───

export function buildChronicleMarkdown(chronicle) {
    if (!chronicle) return '';
    const moodHeader = chronicle.mood === 'triumph'
        ? 'TRIUNFO'
        : chronicle.mood === 'despair'
        ? 'TRAGEDIA'
        : 'CRONICA';
    return [
        `# Cronica — Temporada ${chronicle.season}`,
        ``,
        `**${moodHeader}** — ${chronicle.clubName || ''}`,
        `Tecnico: ${chronicle.managerName || ''}`,
        ``,
        chronicle.chronicle || '',
    ].join('\n');
}

export function buildChronicleFilename(chronicle) {
    if (!chronicle) return 'cronica.md';
    const club = (chronicle.clubName || 'clube').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const season = chronicle.season || 1;
    return `cronica-temp-${season}-${club}.md`;
}

const MOOD_META = {
    triumph: { icon: Trophy,    color: '#FFD700', label: 'TRIUNFO' },
    despair: { icon: CloudRain, color: '#FF3333', label: 'TRAGÉDIA' },
    normal:  { icon: Scroll,    color: '#FDFBF7', label: 'CRÔNICA' },
};

export function ChronicleSeasonEndModal() {
    const { getEngine, forceUpdate } = useGame();
    const engine = getEngine?.();
    const chronicle = engine?.pendingChronicleSeason || null;

    const close = useCallback(() => {
        if (!engine) return;
        engine.pendingChronicleSeason = null;
        if (typeof forceUpdate === 'function') forceUpdate();
    }, [engine, forceUpdate]);

    const handleExport = useCallback(() => {
        if (!chronicle) return;
        const md = buildChronicleMarkdown(chronicle);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = buildChronicleFilename(chronicle);
        a.click();
        URL.revokeObjectURL(url);
    }, [chronicle]);

    useEffect(() => {
        if (!chronicle) return;
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [chronicle, close]);

    if (!chronicle) return null;

    const moodKey = chronicle.mood || 'normal';
    const meta = MOOD_META[moodKey] || MOOD_META.normal;
    const Icon = meta.icon;

    return (
        <div
            className="ef-chronicle-season-modal"
            role="dialog"
            aria-labelledby="ef-chronicle-title"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(5, 10, 15, 0.95)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                overflowY: 'auto',
            }}
        >
            <div style={{
                maxWidth: '720px',
                width: '100%',
                backgroundColor: '#0E1418',
                border: `2px solid ${meta.color}`,
                padding: '32px',
                position: 'relative',
            }}>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar crônica"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'transparent',
                        border: '1px solid #2D3748',
                        color: '#FDFBF7',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                    }}
                >
                    <X size={16} weight="bold" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Icon size={32} color={meta.color} weight="fill" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: meta.color, fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                            {meta.label}
                        </div>
                        <h2 id="ef-chronicle-title" style={{ margin: 0, fontSize: '1.4rem', color: '#FDFBF7', fontFamily: 'var(--font-sans)' }}>
                            Temporada {chronicle.season} — {chronicle.clubName}
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: '#8E9E94', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            Técnico: {chronicle.managerName}
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#161B22',
                    border: '1px solid #2D3748',
                    padding: '20px',
                    marginBottom: '20px',
                    fontFamily: 'var(--font-sans)',
                    color: '#FDFBF7',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                }}>
                    {chronicle.chronicle}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={handleExport}
                        style={{
                            backgroundColor: 'transparent',
                            color: meta.color,
                            border: `1px solid ${meta.color}`,
                            padding: '10px 18px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <Download size={16} weight="bold" /> EXPORTAR MD
                    </button>
                    <button
                        type="button"
                        onClick={close}
                        style={{
                            backgroundColor: meta.color,
                            color: '#0E1418',
                            border: 'none',
                            padding: '10px 18px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                        }}
                    >
                        CONTINUAR
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChronicleSeasonEndModal;
