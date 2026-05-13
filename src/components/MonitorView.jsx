import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MonitorService, CATEGORIES } from '../services/MonitorService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';
import '../styles/monitor-view.css';

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

function severityKey(s) {
    if (s === 'critical') return 'critical';
    if (s === 'error') return 'error';
    if (s === 'warning') return 'warning';
    if (s === 'info') return 'info';
    return 'default';
}

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
        a.download = `olefut-monitor-${Date.now()}.json`;
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
        <div className="ef-anim-fade-in ef-scene-shell ef-mon" style={{ backgroundImage: `url(${bgManagerOffice})` }}>
            <div className="ef-view-container">

                <EfPanel padding="lg" className="ef-view-header ef-mon__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <HardDrives size={28} className="ef-mon__header-icon" />
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
                    <EfPanel padding="lg" className="ef-mon__stats-panel">
                        <div className="ef-mon__stats-row">
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">TOTAL</div>
                                <div className="ef-mono ef-mon__stat-value">{stats.total}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label"><Bug size={12} /> BUGS</div>
                                <div className={`ef-mono ef-mon__stat-value ${stats.bugs > 0 ? 'ef-mon__stat-value--alert' : 'ef-mon__stat-value--neutral'}`}>{stats.bugs}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label"><GameController size={12} /> GAMEPLAY</div>
                                <div className="ef-mono ef-mon__stat-value">{stats.gameplay}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label"><ChatCircleText size={12} /> FEEDBACK</div>
                                <div className="ef-mono ef-mon__stat-value">{stats.feedback}</div>
                            </div>
                        </div>
                        {stats.firstEntry && (
                            <div className="ef-mono ef-text-muted ef-mon__since">
                                DESDE {formatTs(stats.firstEntry)}
                            </div>
                        )}
                    </EfPanel>
                )}

                <EfPanel padding="lg" className="ef-mon__toolbar">
                    <div className="ef-mon__filter-group">
                        {['all', ...Object.values(CATEGORIES)].map(cat => (
                            <EfButton
                                key={cat}
                                variant={filter === cat ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setFilter(cat)}
                                className="ef-mon__filter-btn"
                            >
                                {cat !== 'all' && CATEGORY_ICONS[cat]}
                                {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
                            </EfButton>
                        ))}
                    </div>

                    <div className="ef-mon__action-group">
                        <EfButton variant="secondary" size="sm" onClick={refresh}>
                            <ArrowsClockwise size={16} /> ATUALIZAR
                        </EfButton>
                        <EfButton variant="secondary" size="sm" onClick={handleExport} className="ef-text-info ef-mon__export-btn">
                            <DownloadSimple size={16} /> EXPORTAR JSON
                        </EfButton>
                        <EfButton variant="danger" size="sm" onClick={handleClear} className="ef-text-danger ef-mon__clear-btn">
                            <Trash size={16} /> LIMPAR
                        </EfButton>
                    </div>
                </EfPanel>

                {entries.length === 0 ? (
                    <EfPanel padding="lg" className="ef-text-muted ef-mon__empty">
                        <Info size={48} />
                        <div>Nenhum registro encontrado. O sistema está limpo.</div>
                    </EfPanel>
                ) : (
                    <div className="ef-mon__entries">
                        {entries.map(e => {
                            const sevKey = severityKey(e.severity);
                            return (
                                <EfPanel key={e.id} padding="lg" className={`ef-mon__entry ef-mon__entry--${sevKey}`}>
                                    <div className="ef-mon__entry-header">
                                        <div className="ef-mon__entry-left">
                                            <div className="ef-mon-cat-tag">
                                                {CATEGORY_ICONS[e.category]} {CATEGORY_LABELS[e.category] || e.category}
                                            </div>
                                            <div className={`ef-mon-sev ef-mon__sev--${sevKey}`}>
                                                {e.severity === 'critical' || e.severity === 'error' ? <WarningCircle weight="fill" /> : <Info weight="fill" />}
                                                {e.severity}
                                            </div>
                                        </div>
                                        <span className="ef-mono ef-text-muted ef-mon__entry-ts">
                                            {formatTs(e.ts)}
                                        </span>
                                    </div>

                                    <div className="ef-text-main ef-mon__entry-msg">
                                        {e.message || e.text || e.action || '(sem conteúdo)'}
                                    </div>

                                    {e.action && e.ctx && (
                                        <div className="ef-mon-codeblock">
                                            {JSON.stringify(e.ctx)}
                                        </div>
                                    )}

                                    {e.stack && (
                                        <details className="ef-mon__entry-details">
                                            <summary className="ef-text-info ef-mon__entry-summary">Ver Stack Trace</summary>
                                            <div className="ef-mon-codeblock ef-mon-codeblock--stack">
                                                {e.stack}
                                            </div>
                                        </details>
                                    )}

                                    {e.url && (
                                        <div className="ef-mono ef-text-info ef-mon__entry-url">
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
