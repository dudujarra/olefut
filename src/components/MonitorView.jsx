/**
 * MonitorView — v1.6
 *
 * UI pra ver todos entries do MonitorService + filter + export.
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MonitorService, CATEGORIES } from '../services/MonitorService';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

const CATEGORY_LABELS = {
    bug: '🐛 Bug',
    gameplay: '🎮 Gameplay',
    feedback: '💬 Feedback',
    note: '📝 Nota'
};

const SEVERITY_COLORS = {
    critical: '#FF3333',
    error: '#FF3333',
    warning: '#FFD700',
    info: '#888'
};

export function MonitorView() {
    const { changeView, getDashboardView } = useGame();
    const [filter, setFilter] = useState('all');
    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);

    const monitor = MonitorService.getInstance();

    function refresh() {
        const all = monitor.getAll();
        setEntries(filter === 'all' ? all : all.filter(e => e.category === filter));
        setStats(monitor.getStats());
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    function handleExport() {
        const json = monitor.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elifoot-monitor-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleClear() {
        if (window.confirm(`Apagar ${entries.length} entries do monitor? Não tem como recuperar.`)) {
            monitor.clear();
            refresh();
        }
    }

    function formatTs(ts) {
        return new Date(ts).toLocaleString('pt-BR');
    }

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgManagerOffice})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📊 MONITOR DO SISTEMA</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                {stats && (
                    <EfPanel variant="elev" padding="md">
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                            <span>Total: <strong>{stats.total}</strong></span>
                            <span>🐛 {stats.bugs}</span>
                            <span>🎮 {stats.gameplay}</span>
                            <span>💬 {stats.feedback}</span>
                            <span>📝 {stats.notes}</span>
                            {stats.firstEntry && (
                                <span style={{ color: '#888' }}>
                                    Desde {formatTs(stats.firstEntry)}
                                </span>
                            )}
                        </div>
                    </EfPanel>
                )}

                <EfPanel variant="sunk" padding="md" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['all', ...Object.values(CATEGORIES)].map(cat => (
                        <EfButton
                            key={cat}
                            variant={filter === cat ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter(cat)}
                        >
                            {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
                        </EfButton>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                        <EfButton variant="secondary" size="sm" onClick={refresh}>🔄</EfButton>
                        <EfButton variant="secondary" size="sm" onClick={handleExport}>📄 EXPORTAR JSON</EfButton>
                        <EfButton variant="danger" size="sm" onClick={handleClear} style={{ background: '#FF3333', color: '#fff', borderColor: '#FF3333' }}>🗑️ LIMPAR</EfButton>
                    </div>
                </EfPanel>

                {entries.length === 0 ? (
                    <EfPanel variant="elev" padding="lg" style={{ textAlign: 'center', color: '#888' }}>
                        Nenhum entry registrado. Clique no 🐛 (canto inferior direito) pra reportar algo.
                    </EfPanel>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entries.map(e => (
                            <EfPanel key={e.id} variant="elev" padding="md" style={{
                                borderLeft: `4px solid ${SEVERITY_COLORS[e.severity] || '#888'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                        {CATEGORY_LABELS[e.category] || e.category}
                                        <span style={{ marginLeft: '0.5rem', color: SEVERITY_COLORS[e.severity], fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                            {e.severity}
                                        </span>
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#888' }}>
                                        {formatTs(e.ts)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                    {e.message || e.text || e.action || '(sem conteúdo)'}
                                </div>
                                {e.action && e.ctx && (
                                    <EfPanel variant="sunk" padding="sm" style={{ fontSize: '0.75rem', color: '#888', marginTop: '8px', fontFamily: 'monospace', overflowX: 'auto' }}>
                                        {JSON.stringify(e.ctx)}
                                    </EfPanel>
                                )}
                                {e.stack && (
                                    <details style={{ marginTop: '8px' }}>
                                        <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>Mostrar Stack Trace</summary>
                                        <EfPanel variant="sunk" padding="sm" style={{ fontSize: '0.7rem', overflowX: 'auto', marginTop: '4px', fontFamily: 'monospace' }}>
                                            {e.stack}
                                        </EfPanel>
                                    </details>
                                )}
                                {e.url && (
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>
                                        URL: {e.url}
                                    </div>
                                )}
                            </EfPanel>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MonitorView;
