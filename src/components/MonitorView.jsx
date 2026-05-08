/**
 * MonitorView — v1.6
 *
 * UI pra ver todos entries do MonitorService + filter + export.
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MonitorService, CATEGORIES } from '../services/MonitorService';

const CATEGORY_LABELS = {
    bug: '🐛 Bug',
    gameplay: '🎮 Gameplay',
    feedback: '💬 Feedback',
    note: '📝 Nota'
};

const SEVERITY_COLORS = {
    critical: 'var(--danger)',
    error: 'var(--danger)',
    warning: 'var(--accent)',
    info: 'var(--text-muted)'
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
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>📊 Monitor</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            {stats && (
                <div className="card" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <span>Total: <strong>{stats.total}</strong></span>
                        <span>🐛 {stats.bugs}</span>
                        <span>🎮 {stats.gameplay}</span>
                        <span>💬 {stats.feedback}</span>
                        <span>📝 {stats.notes}</span>
                        {stats.firstEntry && (
                            <span style={{ color: 'var(--text-muted)' }}>
                                Desde {formatTs(stats.firstEntry)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', ...Object.values(CATEGORIES)].map(cat => (
                    <button
                        key={cat}
                        className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={refresh}>🔄</button>
                    <button className="btn btn-sm btn-secondary" onClick={handleExport}>📄 Export JSON</button>
                    <button className="btn btn-sm btn-danger" onClick={handleClear}>🗑️ Limpar</button>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum entry registrado. Clique no 🐛 (canto inferior direito) pra reportar algo.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {entries.map(e => (
                        <div key={e.id} className="card" style={{
                            padding: '0.75rem',
                            borderLeft: `3px solid ${SEVERITY_COLORS[e.severity] || 'var(--text-muted)'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                    {CATEGORY_LABELS[e.category] || e.category}
                                    <span style={{ marginLeft: '0.5rem', color: SEVERITY_COLORS[e.severity], fontSize: '0.75rem' }}>
                                        {e.severity}
                                    </span>
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {formatTs(e.ts)}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                {e.message || e.text || e.action || '(sem conteúdo)'}
                            </div>
                            {e.action && e.ctx && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                                    {JSON.stringify(e.ctx)}
                                </div>
                            )}
                            {e.stack && (
                                <details style={{ marginTop: '0.4rem' }}>
                                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stack</summary>
                                    <pre style={{ fontSize: '0.7rem', overflow: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '3px' }}>
                                        {e.stack}
                                    </pre>
                                </details>
                            )}
                            {e.url && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                    URL: {e.url}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MonitorView;
