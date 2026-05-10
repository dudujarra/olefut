/**
 * ChronicleView — v1.5 (AKITA-056)
 *
 * Tela prosa do save + botões export PNG/JSON.
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChronicleService } from '../services/ChronicleService';
import { EfButton } from './ui/EfButton';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

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
            const lineHeight = 22;
            const lines = content.split('\n');
            const height = Math.max(600, lines.length * lineHeight + 80);
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background — dark arcade metal
            ctx.fillStyle = '#111417';
            ctx.fillRect(0, 0, width, height);

            // Border — heavy bevel
            ctx.strokeStyle = '#4A5059';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, width - 4, height - 4);
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2;
            ctx.strokeRect(6, 6, width - 12, height - 12);

            // Text
            ctx.fillStyle = '#E2E8F0';
            ctx.font = '14px monospace';
            let y = 30;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 20px monospace';
                    ctx.fillText(line.slice(2), 20, y);
                    ctx.font = '14px monospace';
                    ctx.fillStyle = '#E2E8F0';
                } else if (line.startsWith('## ')) {
                    ctx.fillStyle = '#39FF14';
                    ctx.font = 'bold 16px monospace';
                    ctx.fillText(line.slice(3), 20, y);
                    ctx.font = '14px monospace';
                    ctx.fillStyle = '#E2E8F0';
                } else {
                    ctx.fillText(line, 30, y);
                }
                y += lineHeight;
            }

            // Footer
            ctx.fillStyle = '#555';
            ctx.font = '11px monospace';
            ctx.fillText(`OLÉ FUT · gerado em ${new Date().toLocaleString('pt-BR')}`, 20, height - 15);

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
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: 0, fontSize: '1rem', textShadow: '3px 3px 0 #000'}}>
                        CRÔNICA DO SAVE
                    </h2>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* VIEW TABS + EXPORT */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    <div
                        onClick={() => setView('season')}
                        style={{
                            background: view === 'season' ? '#1E2124' : '#111',
                            border: '4px solid',
                            borderColor: view === 'season' ? '#FFD700 #AA8800 #AA8800 #FFD700' : '#333 #000 #000 #333',
                            padding: '10px 20px',
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.6rem',
                            color: view === 'season' ? '#FFD700' : '#888',
                            cursor: 'pointer'
                        }}
                    >
                        TEMPORADA
                    </div>
                    <div
                        onClick={() => setView('lifetime')}
                        style={{
                            background: view === 'lifetime' ? '#1E2124' : '#111',
                            border: '4px solid',
                            borderColor: view === 'lifetime' ? '#FFD700 #AA8800 #AA8800 #FFD700' : '#333 #000 #000 #333',
                            padding: '10px 20px',
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.6rem',
                            color: view === 'lifetime' ? '#FFD700' : '#888',
                            cursor: 'pointer'
                        }}
                    >
                        SAVE INTEIRO
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <div
                            onClick={handleExportPNG}
                            style={{
                                background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333',
                                padding: '10px 16px', cursor: 'pointer',
                                fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#39FF14'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#39FF14 #1A8A0A #1A8A0A #39FF14'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333 #000 #000 #333'}
                        >
                            🖼️ PNG
                        </div>
                        <div
                            onClick={handleExportJSON}
                            style={{
                                background: '#111', border: '4px solid', borderColor: '#333 #000 #000 #333',
                                padding: '10px 16px', cursor: 'pointer',
                                fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#40BAF7'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#40BAF7 #2070A0 #2070A0 #40BAF7'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333 #000 #000 #333'}
                        >
                            📄 JSON
                        </div>
                    </div>
                </div>

                {/* CHRONICLE CONTENT */}
                <div className="ef-anim-slide-down" style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '24px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.6rem',
                        lineHeight: 2.2,
                        color: '#E2E8F0'
                    }}>
                        {content || 'CARREGANDO CRÔNICA...'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChronicleView;
