/**
 * AutoPlayLabView — F1 UI
 *
 * Single view: dropdown preset + config + RUN + results + export.
 */

import { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel, EfButton } from './ui';
import { runBatch, seedRange, randomSeeds } from '../services/AutoPlayLab/BatchRunner';
import { PRESETS, PRESET_CATEGORIES } from '../services/AutoPlayLab/presets';
import { toCSV, toJSON, downloadFile, timestampedFilename } from '../services/AutoPlayLab/Exporter';
import { ArrowLeft, Play, Download, Flask } from '@phosphor-icons/react';

export function AutoPlayLabView() {
    const { changeView, getDashboardView } = useGame();
    const [presetId, setPresetId] = useState('balance_winrate');
    const [saves, setSaves] = useState(20);
    const [weeks, setWeeks] = useState(38);
    const [seedStart, setSeedStart] = useState(1000);
    const [useRandomSeeds, setUseRandomSeeds] = useState(false);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [eta, setEta] = useState('');

    const preset = PRESETS[presetId];

    const handleRun = useCallback(async () => {
        if (running || !preset) return;
        setRunning(true);
        setProgress(0);
        setResults(null);
        setAnalysis(null);
        const startTs = Date.now();
        const seeds = useRandomSeeds
            ? randomSeeds(saves, seedStart)
            : seedRange(seedStart, seedStart + saves);
        try {
            const batchResults = await runBatch({
                seeds,
                weeks,
                onProgress: (done, total) => {
                    setProgress(done / total);
                    const elapsedMs = Date.now() - startTs;
                    const eta_ms = elapsedMs / done * (total - done);
                    setEta(`${Math.ceil(eta_ms / 1000)}s`);
                },
            });
            setResults(batchResults);
            try {
                const ana = preset.analyze(batchResults, preset);
                setAnalysis(ana);
            } catch (e) {
                setAnalysis({ error: e.message });
            }
        } finally {
            setRunning(false);
            setEta('');
        }
    }, [running, preset, saves, weeks, seedStart, useRandomSeeds]);

    const handleExportCSV = useCallback(() => {
        if (!results) return;
        downloadFile(timestampedFilename(presetId, 'csv'), toCSV(results));
    }, [results, presetId]);

    const handleExportJSON = useCallback(() => {
        if (!results) return;
        downloadFile(timestampedFilename(presetId, 'json'), toJSON({ analysis, results }), 'application/json');
    }, [results, analysis, presetId]);

    // Group presets by category
    const presetsByCategory = {};
    Object.values(PRESETS).forEach(p => {
        if (!presetsByCategory[p.category]) presetsByCategory[p.category] = [];
        presetsByCategory[p.category].push(p);
    });

    return (
        <div className="ef-anim-fade-in ef-scene-shell" style={{ minHeight: '100dvh', backgroundColor: '#0D1117' }}>
            <div className="ef-view-container" style={{ maxWidth: '1100px', padding: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{ marginBottom: '20px', borderBottom: '2px solid #C7A75D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Flask size={28} color="#C7A75D" weight="fill" />
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#FDFBF7', fontFamily: 'var(--font-sans)' }}>
                                AUTOPLAY LAB
                            </h2>
                            <div style={{ fontSize: '0.85rem', color: '#8E9E94', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                Simula N saves headless. Valida engine, balance, IA, conteúdo.
                            </div>
                        </div>
                        <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                            <ArrowLeft size={16} /> SAIR
                        </EfButton>
                    </div>
                </EfPanel>

                {/* CONFIG */}
                <EfPanel padding="md" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>PRESET</span>
                            <select
                                value={presetId}
                                onChange={e => setPresetId(e.target.value)}
                                disabled={running}
                                style={{
                                    backgroundColor: '#161B22',
                                    color: '#FDFBF7',
                                    border: '1px solid #2D3748',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                {Object.entries(presetsByCategory).map(([cat, list]) => (
                                    <optgroup key={cat} label={PRESET_CATEGORIES[cat] || cat}>
                                        {list.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {preset && (
                                <div style={{ fontSize: '0.7rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
                                    {preset.description}
                                </div>
                            )}
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SAVES</span>
                            <input
                                type="number"
                                value={saves}
                                onChange={e => setSaves(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={running}
                                min="1"
                                max="1000"
                                style={{
                                    backgroundColor: '#161B22',
                                    color: '#FDFBF7',
                                    border: '1px solid #2D3748',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SEMANAS/SAVE</span>
                            <input
                                type="number"
                                value={weeks}
                                onChange={e => setWeeks(Math.max(1, parseInt(e.target.value) || 38))}
                                disabled={running}
                                min="1"
                                max="380"
                                style={{
                                    backgroundColor: '#161B22',
                                    color: '#FDFBF7',
                                    border: '1px solid #2D3748',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SEED START</span>
                            <input
                                type="number"
                                value={seedStart}
                                onChange={e => setSeedStart(parseInt(e.target.value) || 1000)}
                                disabled={running}
                                style={{
                                    backgroundColor: '#161B22',
                                    color: '#FDFBF7',
                                    border: '1px solid #2D3748',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.8rem', color: '#FDFBF7', fontFamily: 'var(--font-sans)' }}>
                        <input
                            type="checkbox"
                            checked={useRandomSeeds}
                            onChange={e => setUseRandomSeeds(e.target.checked)}
                            disabled={running}
                        />
                        Random seeds (crash hunting)
                    </label>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <EfButton variant="primary" size="lg" onClick={handleRun} disabled={running}>
                            <Play size={16} weight="fill" /> {running ? 'RODANDO...' : 'RODAR'}
                        </EfButton>
                        {running && (
                            <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8E9E94' }}>
                                Progress: {Math.round(progress * 100)}% · ETA {eta}
                                <div style={{
                                    marginTop: '4px',
                                    height: '6px',
                                    backgroundColor: '#2D3748',
                                    width: '100%',
                                }}>
                                    <div style={{
                                        height: '6px',
                                        width: `${progress * 100}%`,
                                        backgroundColor: '#C7A75D',
                                        transition: 'width 0.2s',
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </EfPanel>

                {/* RESULTS */}
                {analysis && (
                    <EfPanel padding="md" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#C7A75D', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                                RESULTADOS — {preset?.label?.toUpperCase()}
                            </div>
                        </div>
                        <pre style={{
                            backgroundColor: '#0E1418',
                            border: '1px solid #2D3748',
                            padding: '12px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            color: '#FDFBF7',
                            overflow: 'auto',
                            maxHeight: '500px',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {JSON.stringify(analysis, null, 2)}
                        </pre>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                            <EfButton variant="secondary" size="md" onClick={handleExportCSV}>
                                <Download size={14} /> EXPORT CSV
                            </EfButton>
                            <EfButton variant="secondary" size="md" onClick={handleExportJSON}>
                                <Download size={14} /> EXPORT JSON
                            </EfButton>
                            <div style={{ flex: 1, textAlign: 'right', fontSize: '0.75rem', color: '#8E9E94', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>
                                {results?.length || 0} saves · {results?.filter(r => !r.crash).length || 0} OK · {results?.filter(r => r.crash).length || 0} crashes
                            </div>
                        </div>
                    </EfPanel>
                )}

            </div>
        </div>
    );
}

export default AutoPlayLabView;
