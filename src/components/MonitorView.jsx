import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MonitorService, CATEGORIES } from '../services/MonitorService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';

import {
    Bug, GameController, ChatCircleText, Note, ArrowLeft,
    WarningCircle, Info, DownloadSimple, Trash, ArrowsClockwise, HardDrives
} from '@phosphor-icons/react';

const CATEGORY_ICONS = {
    bug: <Bug size={16} />,
    gameplay: <GameController size={16} />,
    feedback: <ChatCircleText size={16} />,
    note: <Note size={16} />
};

const CATEGORY_LABELS = {
    bug: 'Bug',
    gameplay: 'Gameplay',
    feedback: 'Feedback',
    note: 'Nota'
};

const SEVERITY_COLORS = {
    critical: '#FF3333',
    error: '#FF3333',
    warning: '#FFD700',
    info: '#40BAF7'
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

    // BUG-081 (SPEC-158): aceitável — refresh lê de external monitor singleton.
    // monitor.getAll() / getStats() são side-effectful (snapshot externo).
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        refresh();
    }, [filter]);
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

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
        if (window.confirm(`Apagar ${entries.length} registros do monitor? Esta ação é irreversível.`)) {
            monitor.clear();
            refresh();
        }
    }

    function formatTs(ts) {
        return new Date(ts).toLocaleString('pt-BR');
    }

    return (
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgManagerOffice})` }}>
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #40BAF7' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <HardDrives size={28} color="#40BAF7" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">MONITOR DO SISTEMA</h2>
                            <span className="ef-view-header__subtitle">TELEMETRIA E DIAGNÓSTICO</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {stats && (
                    <EfPanel padding="lg" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ef-mono ef-text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>TOTAL</div>
                                <div className="ef-mono" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ef-mono ef-text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Bug size={12} /> BUGS</div>
                                <div className="ef-mono" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.bugs > 0 ? '#FF3333' : '#FDFBF7' }}>{stats.bugs}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ef-mono ef-text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><GameController size={12} /> GAMEPLAY</div>
                                <div className="ef-mono" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.gameplay}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="ef-mono ef-text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><ChatCircleText size={12} /> FEEDBACK</div>
                                <div className="ef-mono" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.feedback}</div>
                            </div>
                        </div>
                        {stats.firstEntry && (
                            <div className="ef-mono ef-text-muted" style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                                DESDE {formatTs(stats.firstEntry)}
                            </div>
                        )}
                    </EfPanel>
                )}

                <EfPanel padding="lg" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['all', ...Object.values(CATEGORIES)].map(cat => (
                            <EfButton
                                key={cat}
                                variant={filter === cat ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setFilter(cat)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {cat !== 'all' && CATEGORY_ICONS[cat]}
                                {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
                            </EfButton>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <EfButton variant="secondary" size="sm" onClick={refresh}>
                            <ArrowsClockwise size={16} /> ATUALIZAR
                        </EfButton>
                        <EfButton variant="secondary" size="sm" onClick={handleExport} className="ef-text-info" style={{ borderColor: '#40BAF7' }}>
                            <DownloadSimple size={16} /> EXPORTAR JSON
                        </EfButton>
                        <EfButton variant="danger" size="sm" onClick={handleClear} className="ef-text-danger" style={{ borderColor: '#FF3333' }}>
                            <Trash size={16} /> LIMPAR
                        </EfButton>
                    </div>
                </EfPanel>

                {entries.length === 0 ? (
                    <EfPanel padding="lg" className="ef-text-muted" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Info size={48} />
                        <div>Nenhum registro encontrado. O sistema está limpo.</div>
                    </EfPanel>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {entries.map(e => {
                            const sevColor = SEVERITY_COLORS[e.severity] || '#8E9E94';
                            return (
                                <EfPanel key={e.id} padding="lg" style={{
                                    borderLeft: `4px solid ${sevColor}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="ef-mon-cat-tag">
                                                {CATEGORY_ICONS[e.category]} {CATEGORY_LABELS[e.category] || e.category}
                                            </div>
                                            <div className="ef-mon-sev" style={{ color: sevColor }}>
                                                {e.severity === 'critical' || e.severity === 'error' ? <WarningCircle weight="fill" /> : <Info weight="fill" />}
                                                {e.severity}
                                            </div>
                                        </div>
                                        <span className="ef-mono ef-text-muted" style={{ fontSize: '0.8rem' }}>
                                            {formatTs(e.ts)}
                                        </span>
                                    </div>

                                    <div className="ef-text-main" style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                        {e.message || e.text || e.action || '(sem conteúdo)'}
                                    </div>

                                    {e.action && e.ctx && (
                                        <div className="ef-mon-codeblock">
                                            {JSON.stringify(e.ctx)}
                                        </div>
                                    )}

                                    {e.stack && (
                                        <details style={{ marginTop: '4px' }}>
                                            <summary className="ef-text-info" style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}>Ver Stack Trace</summary>
                                            <div className="ef-mon-codeblock ef-mon-codeblock--stack">
                                                {e.stack}
                                            </div>
                                        </details>
                                    )}

                                    {e.url && (
                                        <div className="ef-mono ef-text-info" style={{ fontSize: '0.8rem' }}>
                                            URL: {e.url}
                                        </div>
                                    )}
                                </EfPanel>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MonitorView;
