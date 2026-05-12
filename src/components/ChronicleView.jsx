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

    // Fallback service for lifetime view
    const chronicle = new ChronicleService({
        narrativeService: engine?._narrativeService,
        mythService: engine?._mythService,
        relationshipService: engine?._relationshipService,
        careerService: engine?._careerService
    });

    // BUG-081 (SPEC-158): aceitável — content derivado de engine.chronicles + view.
    // Engine é external store; chronicle.generateSeasonChronicle pode ter efeitos.
    // Effect (não useMemo) preserva async safety. Mudança de view ou chronicles dispara.
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */

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
            ctx.fillStyle = '#161B22';
            ctx.fillRect(0, 0, width, height);

            // Border
            ctx.strokeStyle = '#2D3748';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);

            // Text
            ctx.fillStyle = '#FDFBF7';
            ctx.font = '16px monospace';
            let y = 40;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText(line.slice(2), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = '#FDFBF7';
                    y += 10;
                } else if (line.startsWith('## ')) {
                    ctx.fillStyle = '#39FF14';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(line.slice(3), 30, y);
                    ctx.font = '16px monospace';
                    ctx.fillStyle = '#FDFBF7';
                } else {
                    ctx.fillText(line, 30, y);
                }
                y += lineHeight;
            }

            // Footer
            ctx.fillStyle = '#8E9E94';
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
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgNewspaper})` }}>
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #40BAF7' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Article size={28} color="#40BAF7" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">CRÔNICA DO SAVE</h2>
                            <span className="ef-view-header__subtitle">REGISTROS HISTÓRICOS DA CARREIRA</span>
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
                            style={view === 'lifetime' ? { backgroundColor: '#FFD700', color: '#000', borderColor: '#FFD700' } : {}}
                        >
                            <InfinityIcon size={16} /> SAVE INTEIRO
                        </EfButton>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <EfButton
                            variant="secondary"
                            onClick={handleExportPNG}
                            className="ef-text-primary"
                            style={{ borderColor: '#2D3748' }}
                        >
                            <ImageIcon size={16} /> EXPORTAR PNG
                        </EfButton>
                        <EfButton
                            variant="secondary"
                            onClick={handleExportJSON}
                            className="ef-text-info"
                            style={{ borderColor: '#2D3748' }}
                        >
                            <FileCode size={16} /> EXPORTAR JSON
                        </EfButton>
                    </div>
                </div>

                {/* CHRONICLE CONTENT */}
                <EfPanel padding="lg" className="ef-anim-slide-down" style={{ minHeight: '400px' }}>
                    <div className="ef-mono ef-text-main" style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.9rem',
                        lineHeight: 1.8
                    }}>
                        {content || 'CARREGANDO CRÔNICA...'}
                    </div>
                </EfPanel>
            </div>
        </div>
    );
}

export default ChronicleView;
