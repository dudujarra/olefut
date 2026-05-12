import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChronicleService } from '../services/ChronicleService';
import { EfPanel, EfButton } from './ui';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

import { 
    Article, ArrowLeft, Image as ImageIcon, FileCode, 
    CalendarBlank, Infinity as InfinityIcon
} from '@phosphor-icons/react';

export function ChronicleView() {
    const { gameState, getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();
    const [view, setView] = useState('season'); // 'season' | 'lifetime'
    const [content, setContent] = useState('');

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    // Fallback service for lifetime view
    const chronicle = new ChronicleService({
        narrativeService: engine?._narrativeService,
        mythService: engine?._mythService,
        relationshipService: engine?._relationshipService,
        careerService: engine?._careerService
    });

    React.useEffect(() => {
        if (!engine) return;
        if (view === 'season') {
            // AKITA-142: use engine.chronicles[] from ChronicleSystem (SPEC-082)
            const chronicles = engine.chronicles || [];
            if (chronicles.length > 0) {
                const lines = chronicles.map(c =>
                    `## Temporada ${c.season} — ${c.mood === 'triumph' ? '🏆' : c.mood === 'despair' ? '😢' : '📖'}\n${c.chronicle}`
                );
                setContent(`# 📜 Crônicas de ${engine.manager?.name || 'Anônimo'}\n\n${lines.join('\n\n')}`);
            } else {
                setContent(chronicle.generateSeasonChronicle(engine));
            }
        } else {
            setContent(chronicle.generateLifetimeChronicle(engine));
        }
    }, [view, engine]);

    function handleExportJSON() {
        const json = chronicle.exportSaveJSON(engine);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elifoot-save-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleExportPNG() {
        // Render content to canvas → PNG
        try {
            const canvas = document.createElement('canvas');
            const width = 800;
            const lineHeight = 26;
            const lines = content.split('\n');
            const height = Math.max(600, lines.length * lineHeight + 80);
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background — Bento Grid Theme
            ctx.fillStyle = colors.panelBg;
            ctx.fillRect(0, 0, width, height);

            // Border
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);

            // Text
            ctx.fillStyle = colors.text;
            ctx.font = '16px monospace';
            let y = 40;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    ctx.fillStyle = colors.warning;
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText(line.slice(2), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = colors.text;
                    y += 10;
                } else if (line.startsWith('## ')) {
                    ctx.fillStyle = colors.accent;
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(line.slice(3), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = colors.text;
                } else {
                    ctx.fillText(line, 30, y);
                }
                y += lineHeight;
            }

            // Footer
            ctx.fillStyle = colors.textMuted;
            ctx.font = '12px monospace';
            ctx.fillText(`ELIFOOT · gerado em ${new Date().toLocaleString('pt-BR')}`, 30, height - 20);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cronica-${view}-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });
        } catch (e) {
            console.error('PNG export failed:', e);
        }
    }

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgNewspaper})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: colors.bg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '24px',
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <Article size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                CRÔNICA DO SAVE
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                REGISTROS HISTÓRICOS DA CARREIRA
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* VIEW TABS + EXPORT */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <EfButton 
                            variant={view === 'season' ? 'primary' : 'secondary'}
                            onClick={() => setView('season')}
                        >
                            <CalendarBlank size={16} /> TEMPORADA
                        </EfButton>
                        <EfButton 
                            variant={view === 'lifetime' ? 'primary' : 'secondary'}
                            onClick={() => setView('lifetime')}
                            style={view === 'lifetime' ? { backgroundColor: colors.warning, color: '#000', borderColor: colors.warning } : {}}
                        >
                            <InfinityIcon size={16} /> SAVE INTEIRO
                        </EfButton>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <EfButton
                            variant="secondary"
                            onClick={handleExportPNG}
                            style={{ color: colors.accent, borderColor: colors.border }}
                        >
                            <ImageIcon size={16} /> EXPORTAR PNG
                        </EfButton>
                        <EfButton
                            variant="secondary"
                            onClick={handleExportJSON}
                            style={{ color: colors.secondary, borderColor: colors.border }}
                        >
                            <FileCode size={16} /> EXPORTAR JSON
                        </EfButton>
                    </div>
                </div>

                {/* CHRONICLE CONTENT */}
                <EfPanel padding="lg" className="ef-anim-slide-down" style={{ 
                    minHeight: '400px'
                }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                        lineHeight: 1.8,
                        color: colors.text
                    }}>
                        {content || 'CARREGANDO CRÔNICA...'}
                    </div>
                </EfPanel>
            </div>
        </div>
    );
}

export default ChronicleView;
