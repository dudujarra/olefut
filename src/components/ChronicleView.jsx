/**
 * ChronicleView — v1.5 (AKITA-056)
 *
 * Tela prosa do save + botões export PNG/JSON.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChronicleService } from '../services/ChronicleService';
import { EfPanel } from './ui/EfPanel';
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

            // Background
            ctx.fillStyle = '#0B0F19';
            ctx.fillRect(0, 0, width, height);

            // Border
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, width - 4, height - 4);

            // Text
            ctx.fillStyle = '#F1F5F9';
            ctx.font = '14px monospace';
            let y = 30;
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    ctx.fillStyle = '#10B981';
                    ctx.font = 'bold 20px monospace';
                    ctx.fillText(line.slice(2), 20, y);
                    ctx.font = '14px monospace';
                    ctx.fillStyle = '#F1F5F9';
                } else if (line.startsWith('## ')) {
                    ctx.fillStyle = '#F59E0B';
                    ctx.font = 'bold 16px monospace';
                    ctx.fillText(line.slice(3), 20, y);
                    ctx.font = '14px monospace';
                    ctx.fillStyle = '#F1F5F9';
                } else {
                    ctx.fillText(line, 30, y);
                }
                y += lineHeight;
            }

            // Footer
            ctx.fillStyle = '#64748B';
            ctx.font = 'italic 11px monospace';
            ctx.fillText(`ELIFOOT WEB · gerado em ${new Date().toLocaleString('pt-BR')}`, 20, height - 15);

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
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📜 CRÔNICA DO SAVE</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <EfButton
                        variant={view === 'season' ? 'primary' : 'secondary'}
                        onClick={() => setView('season')}
                    >
                        TEMPORADA
                    </EfButton>
                    <EfButton
                        variant={view === 'lifetime' ? 'primary' : 'secondary'}
                        onClick={() => setView('lifetime')}
                    >
                        SAVE INTEIRO
                    </EfButton>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <EfButton variant="secondary" onClick={handleExportPNG}>
                            🖼️ EXPORTAR PNG
                        </EfButton>
                        <EfButton variant="secondary" onClick={handleExportJSON}>
                            📄 EXPORTAR JSON
                        </EfButton>
                    </div>
                </div>

                <EfPanel variant="sunk" padding="md" className="ef-anim-slide-down">
                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {content || '*Carregando crônica...*'}
                    </div>
                </EfPanel>
            </div>
        </div>
    );
}

export default ChronicleView;
