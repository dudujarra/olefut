/**
 * ChronicleView — v1.5 (AKITA-056)
 *
 * Tela prosa do save + botões export PNG/JSON.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChronicleService } from '../services/ChronicleService';

export function ChronicleView() {
    const { gameState, getEngine, changeView } = useGame();
    const engine = getEngine();
    const [view, setView] = useState('season'); // 'season' | 'lifetime'
    const [content, setContent] = useState('');

    const chronicle = new ChronicleService({
        narrativeService: engine?._narrativeService,
        mythService: engine?._mythService,
        relationshipService: engine?._relationshipService,
        careerService: engine?._careerService
    });

    React.useEffect(() => {
        if (!engine) return;
        const text = view === 'season'
            ? chronicle.generateSeasonChronicle(engine)
            : chronicle.generateLifetimeChronicle(engine);
        setContent(text);
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
        <div className="main-content fade-in ef-art-bg ef-art-newspaper">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>📜 Crônica do Save</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView('dashboard')}>← Voltar</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    className={`btn btn-sm ${view === 'season' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('season')}
                >
                    Temporada
                </button>
                <button
                    className={`btn btn-sm ${view === 'lifetime' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('lifetime')}
                >
                    Save Inteiro
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={handleExportPNG}>
                        🖼️ PNG
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={handleExportJSON}>
                        📄 JSON
                    </button>
                </div>
            </div>

            <div key={view} className="card ef-anim-slide-down" style={{ padding: '1.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {content || '*Carregando crônica...*'}
            </div>
        </div>
    );
}

export default ChronicleView;
