/**
import '../styles/autoplay-lab-view.css';
 * AutoPlayLabView — F1 UI
 *
 * Single view: dropdown preset + config + RUN + results + export.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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
    // Bug-fix V11: track mount pra skip setState após unmount
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

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
                    if (!mountedRef.current) return;
                    setProgress(done / total);
                    const elapsedMs = Date.now() - startTs;
                    const eta_ms = elapsedMs / done * (total - done);
                    setEta(`${Math.ceil(eta_ms / 1000)}s`);
                },
            });
            if (!mountedRef.current) return;
            setResults(batchResults);
            try {
                const ana = preset.analyze(batchResults, preset);
                setAnalysis(ana);
            } catch (e) {
                setAnalysis({ error: e.message });
            }
        } finally {
            if (mountedRef.current) {
                setRunning(false);
                setEta('');
            }
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
        <div className="ef-aplab__scene">
            <div className="ef-aplab__container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-aplab__panel-gold-bottom">
                    <div className="ef-aplab__inline">
                        <Flask size={28} color="var(--color-gold-arcade)" weight="fill" />
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                                AUTOPLAY LAB
                            </h2>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                Simula N saves headless. Valida engine, balance, IA, conteúdo.
                            </div>
                        </div>
                        <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                            <ArrowLeft size={16} /> SAIR
                        </EfButton>
                    </div>
                </EfPanel>

                {/* CONFIG */}
                <EfPanel padding="md" className="ef-aplab__panel-mb">
                    <div className="ef-aplab__grid-2">
                        <label className="ef-aplab__label-col">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>PRESET</span>
                            <select
                                value={presetId}
                                onChange={e => setPresetId(e.target.value)}
                                disabled={running}
                                style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--color-soft-border)',
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
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
                                    {preset.description}
                                </div>
                            )}
                        </label>

                        <label className="ef-aplab__label-col">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SAVES</span>
                            <input
                                type="number"
                                value={saves}
                                onChange={e => setSaves(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={running}
                                min="1"
                                max="1000"
                                style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--color-soft-border)',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>

                        <label className="ef-aplab__label-col">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SEMANAS/SAVE</span>
                            <input
                                type="number"
                                value={weeks}
                                onChange={e => setWeeks(Math.max(1, parseInt(e.target.value) || 38))}
                                disabled={running}
                                min="1"
                                max="380"
                                style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--color-soft-border)',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>

                        <label className="ef-aplab__label-col">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>SEED START</span>
                            <input
                                type="number"
                                value={seedStart}
                                onChange={e => setSeedStart(parseInt(e.target.value) || 1000)}
                                disabled={running}
                                style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--color-soft-border)',
                                    padding: '8px',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </label>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                        <input
                            type="checkbox"
                            checked={useRandomSeeds}
                            onChange={e => setUseRandomSeeds(e.target.checked)}
                            disabled={running}
                        />
                        Random seeds (crash hunting)
                    </label>

                    <div className="ef-aplab__action-row">
                        <EfButton variant="primary" size="lg" onClick={handleRun} disabled={running}>
                            <Play size={16} weight="fill" /> {running ? 'RODANDO...' : 'RODAR'}
                        </EfButton>
                        {running && (
                            <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Progress: {Math.round(progress * 100)}% · ETA {eta}
                                <div style={{
                                    marginTop: '4px',
                                    height: '6px',
                                    backgroundColor: 'var(--color-soft-border)',
                                    width: '100%',
                                }}>
                                    <div style={{
                                        height: '6px',
                                        width: `${progress * 100}%`,
                                        backgroundColor: 'var(--color-gold-arcade)',
                                        transition: 'width 0.2s',
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </EfPanel>

                {/* RESULTS */}
                {analysis && (
                    <EfPanel padding="md" className="ef-aplab__panel-mb">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gold-arcade)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                                RESULTADOS — {preset?.label?.toUpperCase()}
                            </div>
                        </div>
                        <pre style={{
                            backgroundColor: 'var(--color-bg-deep)',
                            border: '1px solid var(--color-soft-border)',
                            padding: '12px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            color: 'var(--text-main)',
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
                            <div style={{ flex: 1, textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>
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
