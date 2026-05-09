/**
 * AutoPlayView — Soak Test UI
 *
 * Roda bot continuamente, mostra stats live + anomalies catalog.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getAutoPlay } from '../services/AutoPlayService';

const SPEED_PRESETS = [
    { label: '🐢 Slow', delay: 500 },
    { label: '🚶 1×',   delay: 200 },
    { label: '🏃 5×',    delay: 50 },
    { label: '🚀 20×',   delay: 10 },
    { label: '⚡ Max',   delay: 1 }
];

export function AutoPlayView() {
    const { changeView, getEngine, getDashboardView, forceUpdate } = useGame();
    const engine = getEngine();
    const controllerRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [speed, setSpeed] = useState(50);
    const [anomalyFilter, setAnomalyFilter] = useState('all');
    const [telemetryOpen, setTelemetryOpen] = useState(false);
    const [expandedSpec, setExpandedSpec] = useState(null);

    useEffect(() => {
        if (!engine) return;
        controllerRef.current = getAutoPlay(engine);
        const interval = setInterval(() => {
            if (controllerRef.current) {
                setStats(controllerRef.current.getStats());
            }
        }, 250);
        return () => clearInterval(interval);
    }, [engine]);

    if (!engine || !engine.manager?.teamId) {
        return (
            <div className="main-content fade-in">
                <div className="card-header">
                    <h2>🤖 AutoPlay Soak Test</h2>
                    <button className="btn btn-secondary btn-sm" onClick={() => changeView('start')}>← Voltar</button>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                    <p>Inicie um jogo primeiro pra usar o AutoPlay.</p>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        if (controllerRef.current) {
            controllerRef.current.start(speed);
        }
    };

    const handlePause = () => {
        if (controllerRef.current) {
            controllerRef.current.pause();
            forceUpdate();
        }
    };

    const handleStop = () => {
        if (controllerRef.current) {
            controllerRef.current.stop();
            forceUpdate();
        }
    };

    const handleSpeedChange = (newDelay) => {
        setSpeed(newDelay);
        if (controllerRef.current) {
            controllerRef.current.weekDelay = newDelay;
        }
    };

    const handleExport = () => {
        if (controllerRef.current) {
            controllerRef.current.exportReport();
        }
    };

    const handleExportTelemetry = () => {
        if (controllerRef.current) {
            controllerRef.current.exportTelemetryReport();
        }
    };

    const scoreColor = (score) => {
        if (score >= 70) return 'var(--ef-color-func-success, #6ABC3A)';
        if (score >= 40) return 'var(--ef-color-accent-gold, #FFD700)';
        return 'var(--danger)';
    };

    const elapsedSec = stats ? (stats.elapsedMs / 1000).toFixed(1) : 0;
    const wps = stats ? stats.weeksPerSecond?.toFixed(1) : '0';

    const filteredAnomalies = stats?.anomalies?.filter(a => {
        if (anomalyFilter === 'all') return true;
        return a.type === anomalyFilter;
    }) || [];

    const anomalyTypes = stats?.anomalies?.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
    }, {}) || {};

    const successTypes = stats?.successes?.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
    }, {}) || {};

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>🤖 AutoPlay — Soak Test</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            {/* Controls */}
            <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {!stats?.running ? (
                        <button className="btn btn-primary" onClick={handleStart}>
                            ▶️ Iniciar
                        </button>
                    ) : (
                        <button className="btn btn-secondary" onClick={handlePause}>
                            ⏸️ Pausar
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={handleStop}>
                        ⏹️ Parar
                    </button>
                    <button className="btn btn-secondary" onClick={handleExport}>
                        📥 Exportar Relatório JSON
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportTelemetry}>
                        📊 Export Telemetry JSON
                    </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    VELOCIDADE: {speed}ms/week
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {SPEED_PRESETS.map(p => (
                        <button
                            key={p.delay}
                            onClick={() => handleSpeedChange(p.delay)}
                            className="btn btn-sm"
                            style={{
                                background: speed === p.delay ? 'var(--ef-color-accent-gold, #FFD700)' : 'transparent',
                                color: speed === p.delay ? '#0F1A14' : 'var(--text)',
                                border: '1px solid var(--ef-color-accent-gold, #FFD700)',
                                fontSize: '0.7rem',
                                padding: '4px 8px'
                            }}
                        >{p.label}</button>
                    ))}
                </div>
            </div>

            {/* Live stats grid */}
            {stats && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📊 Estatísticas Live</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                        <Stat label="Status" value={stats.running ? '🟢 Rodando' : '⏸️ Pausado'} />
                        <Stat label="Semanas" value={stats.weeksPlayed} />
                        <Stat label="Temporadas" value={stats.seasonsPlayed} />
                        <Stat label="Semana atual" value={`${stats.currentWeek || 0}/${(stats.currentSeason || 1) * 38}`} />
                        <Stat label="Tempo (s)" value={elapsedSec} />
                        <Stat label="Weeks/sec" value={wps} />
                        <Stat label="Matches" value={stats.matchesPlayed} />
                        <Stat label="V/E/D" value={`${stats.wins}/${stats.draws}/${stats.losses}`} />
                        <Stat label="Transfers" value={stats.transfers} />
                        <Stat label="Decisions" value={stats.decisions?.length || 0} />
                        <Stat label="Errors" value={stats.errorCount} color={stats.errorCount > 0 ? 'var(--danger)' : 'var(--primary)'} />
                        <Stat label="Anomalies" value={stats.anomalies?.length || 0} color={(stats.anomalies?.length || 0) > 0 ? 'var(--accent)' : 'var(--text)'} />
                    </div>
                </div>
            )}

            {/* Insights summary */}
            {stats?.insights && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📈 Insights da Carreira</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
                        <Stat label="Títulos" value={stats.insights.titlesWon} color="var(--ef-color-accent-gold, #FFD700)" />
                        <Stat label="Promoções" value={stats.insights.promotionsWon} color="var(--primary)" />
                        <Stat label="Rebaixamentos" value={stats.insights.relegationsTaken} color="var(--danger)" />
                        <Stat label="Hat-tricks" value={stats.insights.hatTricks} />
                        <Stat label="Clean sheets" value={stats.insights.cleanSheets} />
                        <Stat label="Maior streak V" value={stats.insights.longestWinStreak} color="var(--primary)" />
                        <Stat label="Maior streak D" value={Math.abs(stats.insights.longestLossStreak || 0)} color="var(--danger)" />
                        <Stat label="Peak posição" value={stats.insights.peakStanding === Infinity ? '-' : stats.insights.peakStanding + 'º'} />
                        <Stat label="Pior posição" value={stats.insights.worstStanding ? stats.insights.worstStanding + 'º' : '-'} />
                        <Stat label="Pico R$" value={`${(stats.insights.peakBalance / 1e6).toFixed(0)}M`} color="var(--accent)" />
                        <Stat label="Maior goleada" value={stats.insights.biggestWin?.score || '-'} />
                        <Stat label="Pior derrota" value={stats.insights.worstLoss?.score || '-'} color="var(--danger)" />
                    </div>
                </div>
            )}

            {/* Telemetria — SPEC-100..114 (15 detectores) */}
            {stats?.telemetry?.results && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <div
                        onClick={() => setTelemetryOpen(!telemetryOpen)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
                            📊 Telemetria ({Object.keys(stats.telemetry.results).length} detectores)
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: scoreColor(stats.telemetry.overallScore) }}>
                                Score Geral: {stats.telemetry.overallScore}
                            </span>
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {telemetryOpen ? '▼ Recolher' : '▶ Expandir'}
                        </span>
                    </div>
                    {telemetryOpen && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '8px',
                            marginTop: '0.75rem'
                        }}>
                            {Object.entries(stats.telemetry.results).map(([spec, res]) => (
                                <div
                                    key={spec}
                                    onClick={() => setExpandedSpec(expandedSpec === spec ? null : spec)}
                                    style={{
                                        padding: '0.5rem',
                                        background: 'rgba(45,90,61,0.2)',
                                        border: `1px solid ${scoreColor(res.score)}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '0.72rem' }}>{spec}</strong>
                                        <span style={{ fontWeight: 700, color: scoreColor(res.score) }}>{res.score}</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        {res.name}
                                    </div>
                                    {res.signals?.[0] && (
                                        <div style={{
                                            fontSize: '0.68rem',
                                            color: scoreColor(100 - (res.signals[0].severity * 100))
                                        }}>
                                            ⚠ {res.signals[0].id}
                                        </div>
                                    )}
                                    {expandedSpec === spec && res.signals?.length > 0 && (
                                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                            {res.signals.slice(0, 5).map((s, i) => (
                                                <div key={i} style={{ marginBottom: '3px', fontSize: '0.65rem' }}>
                                                    <strong>{s.id}</strong> ({(s.severity * 100).toFixed(0)}%): {s.msg}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Successes catalog */}
            {stats?.successes && stats.successes.length > 0 && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>✅ Successes ({stats.successes.length})</h3>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Por tipo: {Object.entries(successTypes).map(([t, n]) => `${t}(${n})`).join(' • ')}
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {stats.successes.slice(-20).reverse().map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.4rem 0.5rem',
                                    borderLeft: '3px solid var(--ef-color-func-success, #6ABC3A)',
                                    background: 'rgba(106,188,58,0.06)',
                                    fontSize: '0.75rem',
                                    marginBottom: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ color: 'var(--ef-color-func-success, #6ABC3A)' }}>{s.type}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                        Sem {s.week} • Temp {s.season}
                                    </span>
                                </div>
                                <div style={{ marginTop: '2px' }}>{s.msg}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Anomalies catalog */}
            {stats?.anomalies && stats.anomalies.length > 0 && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>⚠️ Anomalies ({stats.anomalies.length})</h3>
                        <select
                            value={anomalyFilter}
                            onChange={e => setAnomalyFilter(e.target.value)}
                            className="btn btn-sm"
                            style={{ fontSize: '0.7rem' }}
                        >
                            <option value="all">Todas</option>
                            {Object.entries(anomalyTypes).map(([type, count]) => (
                                <option key={type} value={type}>{type} ({count})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredAnomalies.slice(-30).reverse().map((a, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.4rem 0.5rem',
                                    borderLeft: '3px solid var(--danger)',
                                    background: 'rgba(214,40,40,0.06)',
                                    fontSize: '0.75rem',
                                    marginBottom: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ color: 'var(--danger)' }}>{a.type}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                        Sem {a.week} • Temp {a.season}
                                    </span>
                                </div>
                                <div style={{ marginTop: '2px' }}>{a.msg}</div>
                                {a.ctx && Object.keys(a.ctx).length > 0 && (
                                    <pre style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(a.ctx, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent decisions */}
            {stats?.decisions && stats.decisions.length > 0 && (
                <div className="card" style={{ padding: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📋 Últimas Decisões (20)</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {stats.decisions.slice(-20).reverse().map((d, i) => (
                            <div key={i} style={{ padding: '2px 4px', borderBottom: '1px solid rgba(45,90,61,0.3)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>W{d.week}</span>{' '}
                                <strong style={{ color: 'var(--accent)' }}>{d.action}</strong>{' '}
                                <span>{JSON.stringify(d.args)}</span>
                                {d.elapsedMs > 0 && <span style={{ color: 'var(--text-muted)' }}> ({d.elapsedMs.toFixed(0)}ms)</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div style={{
            padding: '0.4rem 0.5rem',
            background: 'rgba(45,90,61,0.2)',
            borderRadius: '4px',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: color || 'var(--text)' }}>
                {value}
            </div>
        </div>
    );
}

export default AutoPlayView;
