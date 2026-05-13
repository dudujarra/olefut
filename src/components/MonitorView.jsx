/**
 * MonitorView — Telemetria e Diagnóstico OléFUT
 * Stitch v1.1 port (AKITA-393): match docs/stitch-designs/v1.1-all/65-monitor-telemetria-ol-fut.html
 * Tokens-only — zero raw hex (token vars + isolated --ef-mon-* fallbacks).
 * Brand fonts: Press Start 2P / Pixelify Sans / IBM Plex Mono via tokens.
 */

import { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { MonitorService, CATEGORIES } from '../services/MonitorService';
import { EfPanel, EfButton } from './ui';
import bgManagerOffice from '../assets/environments/bg_manager_office.png';
import '../styles/monitor-view.css';

import {
    Bug, GameController, ChatCircleText, Note, ArrowLeft,
    WarningCircle, Info, DownloadSimple, Trash, ArrowsClockwise,
    Terminal, Pulse, Lightning, ChartLineUp, HardDrives, Database
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

function severityTagLabel(s) {
    if (s === 'critical') return 'CRIT';
    if (s === 'error') return 'ERROR';
    if (s === 'warning') return 'WARN';
    if (s === 'info') return 'INFO';
    return 'NOTE';
}

function formatTs(ts) {
    return new Date(ts).toLocaleString('pt-BR');
}

function formatLogTs(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
}

function formatUptime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hrs = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    return `${pad(days, 3)}:${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function MonitorView() {
    const { changeView, getDashboardView, getEngine } = useGame();
    const engine = getEngine?.() ?? null;
    const [filter, setFilter] = useState('all');
    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [tick, setTick] = useState(0);
    const [sessionStart] = useState(() => Date.now());

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

    // Uptime tick — refresh every 1s for the live clock display.
    useEffect(() => {
        const id = setInterval(() => setTick(t => (t + 1) % 1000000), 1000);
        return () => clearInterval(id);
    }, []);

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

    // Telemetry derived from real state — NOT mocked.
    void tick; // re-render every second
    const uptimeMs = Date.now() - sessionStart;
    const uptimeStr = formatUptime(uptimeMs);

    const critCount = useMemo(() => {
        if (!stats) return 0;
        return monitor.getAll().filter(
            e => e.severity === 'critical' || e.severity === 'error'
        ).length;
    }, [monitor, stats, entries.length]);

    const engineWeek = engine?.currentWeek ?? 0;
    const engineSeason = engine?.seasonNumber ?? 1;
    const engineStatus = engine ? 'STABLE' : 'OFFLINE';

    // Engine load flux — last 18 buckets of monitor activity per minute.
    const loadBars = useMemo(() => {
        const all = monitor.getAll();
        const buckets = new Array(18).fill(0);
        const now = Date.now();
        const stepMs = 5_000; // 5s buckets => 90s window
        for (const e of all) {
            const ageMs = now - (e.ts || 0);
            if (ageMs < 0) continue;
            const idx = 17 - Math.floor(ageMs / stepMs);
            if (idx >= 0 && idx < 18) buckets[idx] += 1;
        }
        const max = Math.max(1, ...buckets);
        return buckets.map(b => Math.min(95, Math.round((b / max) * 90) + 5));
    }, [monitor, entries.length]);

    // System Health = inverse of recent error rate.
    const healthPct = useMemo(() => {
        if (!stats || stats.total === 0) return 100;
        const all = monitor.getAll();
        const recent = all.slice(0, 50);
        const errs = recent.filter(
            e => e.severity === 'critical' || e.severity === 'error'
        ).length;
        return Math.max(0, 100 - Math.round((errs / Math.max(1, recent.length)) * 100));
    }, [monitor, stats, entries.length]);

    return (
        <div
            className="ef-anim-fade-in ef-scene-shell ef-mon"
            style={{ backgroundImage: `url(${bgManagerOffice})` }}
        >
            <div className="ef-mon__scanlines" aria-hidden="true" />
            <div className="ef-view-container ef-view-container--wide">

                {/* ============ HEADER ============ */}
                <EfPanel padding="lg" className="ef-view-header ef-mon__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box ef-mon__icon-box">
                            <Terminal size={28} className="ef-mon__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title ef-mon__title">
                                MONITOR &middot; TELEMETRIA OléFUT
                            </h2>
                            <span className="ef-view-header__subtitle ef-mon__subtitle">
                                FM_CORE_v2.0 // SESSION {engineSeason} // WEEK {engineWeek}
                            </span>
                        </div>
                    </div>
                    <div className="ef-mon__header-right">
                        <div className="ef-mon__uptime">
                            <span className="ef-mon__uptime-label">UPTIME</span>
                            <span className="ef-mon__uptime-value">{uptimeStr}</span>
                        </div>
                        <div className="ef-mon__sys-active">
                            <div className="ef-mon__sys-dot" />
                            <span>SYS_ACTIVE</span>
                        </div>
                        <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                            <ArrowLeft size={16} /> SAIR
                        </EfButton>
                    </div>
                </EfPanel>

                {/* ============ METRIC CARDS ============ */}
                <div className="ef-mon__metrics-grid">
                    <div className="ef-mon__metric ef-mon__metric--info">
                        <div className="ef-mon__metric-head">
                            <span className="ef-mon__metric-label">TOTAL_CALLS</span>
                            <ChartLineUp size={18} weight="bold" />
                        </div>
                        <div className="ef-mon__metric-value">{stats?.total ?? 0}</div>
                        <div className="ef-mon__metric-bar">
                            <div
                                className="ef-mon__metric-bar-fill"
                                style={{ width: `${Math.min(100, ((stats?.total ?? 0) / 500) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div
                        className={`ef-mon__metric ${critCount > 0 ? 'ef-mon__metric--danger' : 'ef-mon__metric--ok'}`}
                    >
                        <div className="ef-mon__metric-head">
                            <span className="ef-mon__metric-label">CRITICAL_BUGS</span>
                            <WarningCircle size={18} weight="fill" />
                        </div>
                        <div className="ef-mon__metric-value">
                            {String(critCount).padStart(2, '0')}
                        </div>
                        <div className="ef-mon__metric-status">
                            {critCount > 0 ? 'STATUS: ATTENTION' : 'STATUS: NOMINAL'}
                        </div>
                    </div>

                    <div className="ef-mon__metric ef-mon__metric--engine">
                        <div className="ef-mon__metric-head">
                            <span className="ef-mon__metric-label">GAME_ENGINE</span>
                            <Lightning size={18} weight="fill" />
                        </div>
                        <div className="ef-mon__metric-value">{engineStatus}</div>
                        <div className="ef-mon__metric-bars">
                            <span
                                className={`ef-mon__metric-pip ${healthPct >= 25 ? 'ef-mon__metric-pip--on' : ''}`}
                            />
                            <span
                                className={`ef-mon__metric-pip ${healthPct >= 50 ? 'ef-mon__metric-pip--on' : ''}`}
                            />
                            <span
                                className={`ef-mon__metric-pip ${healthPct >= 75 ? 'ef-mon__metric-pip--on' : ''}`}
                            />
                            <span
                                className={`ef-mon__metric-pip ${healthPct >= 95 ? 'ef-mon__metric-pip--on' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="ef-mon__metric ef-mon__metric--warn">
                        <div className="ef-mon__metric-head">
                            <span className="ef-mon__metric-label">FEEDBACK_LOOP</span>
                            <Pulse size={18} weight="bold" />
                        </div>
                        <div className="ef-mon__metric-value">
                            {stats?.feedback ?? 0}
                        </div>
                        <div className="ef-mon__metric-status">
                            REPORTS: USER_SIGNAL
                        </div>
                    </div>
                </div>

                {/* ============ CATEGORY STAT ROW ============ */}
                {stats && (
                    <EfPanel padding="lg" className="ef-mon__stats-panel">
                        <div className="ef-mon__stats-row">
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">TOTAL</div>
                                <div className="ef-mono ef-mon__stat-value">{stats.total}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">
                                    <Bug size={12} /> BUGS
                                </div>
                                <div
                                    className={`ef-mono ef-mon__stat-value ${stats.bugs > 0 ? 'ef-mon__stat-value--alert' : 'ef-mon__stat-value--neutral'}`}
                                >
                                    {stats.bugs}
                                </div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">
                                    <GameController size={12} /> GAMEPLAY
                                </div>
                                <div className="ef-mono ef-mon__stat-value">{stats.gameplay}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">
                                    <ChatCircleText size={12} /> FEEDBACK
                                </div>
                                <div className="ef-mono ef-mon__stat-value">{stats.feedback}</div>
                            </div>
                            <div className="ef-mon__stat-col">
                                <div className="ef-mono ef-text-muted ef-mon__stat-label">
                                    <Note size={12} /> NOTES
                                </div>
                                <div className="ef-mono ef-mon__stat-value">{stats.notes ?? 0}</div>
                            </div>
                        </div>
                        {stats.firstEntry && (
                            <div className="ef-mono ef-text-muted ef-mon__since">
                                DESDE {formatTs(stats.firstEntry)}
                            </div>
                        )}
                    </EfPanel>
                )}

                {/* ============ TOOLBAR ============ */}
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
                        <EfButton
                            variant="secondary"
                            size="sm"
                            onClick={handleExport}
                            className="ef-text-info ef-mon__export-btn"
                        >
                            <DownloadSimple size={16} /> EXPORTAR JSON
                        </EfButton>
                        <EfButton
                            variant="danger"
                            size="sm"
                            onClick={handleClear}
                            className="ef-text-danger ef-mon__clear-btn"
                        >
                            <Trash size={16} /> LIMPAR
                        </EfButton>
                    </div>
                </EfPanel>

                {/* ============ KERNEL LOG TABLE ============ */}
                <div className="ef-mon__kernel-panel">
                    <div className="ef-mon__kernel-head">
                        <h3 className="ef-mon__kernel-title">SYSTEM_KERNEL_LOGS</h3>
                        <div className="ef-mon__kernel-dots">
                            <span className="ef-mon__kernel-dot" />
                            <span className="ef-mon__kernel-dot" />
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <div className="ef-mon__empty">
                            <Info size={40} />
                            <div>Nenhum registro encontrado. O sistema está limpo.</div>
                        </div>
                    ) : (
                        <div className="ef-mon__kernel-body">
                            <table className="ef-mon__kernel-table">
                                <thead>
                                    <tr>
                                        <th>TIMESTAMP</th>
                                        <th>SEVERITY</th>
                                        <th>CATEGORY</th>
                                        <th>TECHNICAL_MESSAGE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.slice(0, 30).map(e => {
                                        const sevKey = severityKey(e.severity);
                                        return (
                                            <tr
                                                key={e.id}
                                                className={`ef-mon__kernel-row ef-mon__kernel-row--${sevKey}`}
                                            >
                                                <td className="ef-mon__kernel-ts">
                                                    {formatLogTs(e.ts)}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`ef-mon__sev-pill ef-mon__sev-pill--${sevKey}`}
                                                    >
                                                        {severityTagLabel(e.severity)}
                                                    </span>
                                                </td>
                                                <td className="ef-mon__kernel-cat">
                                                    <span className="ef-mon-cat-tag">
                                                        {CATEGORY_ICONS[e.category]}{' '}
                                                        {CATEGORY_LABELS[e.category] || e.category}
                                                    </span>
                                                </td>
                                                <td className={`ef-mon__kernel-msg ef-mon__kernel-msg--${sevKey}`}>
                                                    {(e.message || e.text || e.action || '(sem conteúdo)')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ============ ENGINE LOAD FLUX + HEALTH GAUGE ============ */}
                <div className="ef-mon__flux-row">
                    <div className="ef-mon__flux">
                        <div className="ef-mon__flux-head">
                            <h3 className="ef-mon__panel-title">ENGINE_LOAD_FLUX</h3>
                            <div className="ef-mon__flux-legend">
                                <span className="ef-mon__flux-legend-dot" />
                                <span>EVENTS / 5s</span>
                            </div>
                        </div>
                        <div className="ef-mon__bars">
                            {loadBars.map((h, i) => (
                                <div
                                    key={i}
                                    className={`ef-mon__bar ${h > 70 ? 'ef-mon__bar--peak' : ''}`}
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                        <div className="ef-mon__flux-axis">
                            <span>T - 90s</span>
                            <span>T - 60s</span>
                            <span>T - 30s</span>
                            <span>NOW</span>
                        </div>
                    </div>

                    <div className="ef-mon__health">
                        <h3 className="ef-mon__panel-title">SYSTEM_HEALTH_INDEX</h3>
                        <div className="ef-mon__gauge">
                            <svg viewBox="0 0 160 160" className="ef-mon__gauge-svg">
                                <circle
                                    className="ef-mon__gauge-track"
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    strokeWidth="8"
                                />
                                <circle
                                    className="ef-mon__gauge-arc"
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="transparent"
                                    strokeWidth="8"
                                    strokeDasharray={`${(healthPct / 100) * 440} 440`}
                                    transform="rotate(-90 80 80)"
                                />
                            </svg>
                            <div className="ef-mon__gauge-center">
                                <span className="ef-mon__gauge-value">{healthPct}%</span>
                                <span className="ef-mon__gauge-label">
                                    {healthPct >= 90 ? 'OPTIMAL' : healthPct >= 60 ? 'STABLE' : 'DEGRADED'}
                                </span>
                            </div>
                        </div>
                        <div className="ef-mon__health-grid">
                            <div className="ef-mon__health-cell">
                                <div className="ef-mon__health-cell-label">SESSION</div>
                                <div className="ef-mon__health-cell-value">S{engineSeason}</div>
                            </div>
                            <div className="ef-mon__health-cell">
                                <div className="ef-mon__health-cell-label">WEEK</div>
                                <div className="ef-mon__health-cell-value">{engineWeek}/38</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ NODE INFO STRIP ============ */}
                <div className="ef-mon__node-strip">
                    <div className="ef-mon__node-left">
                        <div className="ef-mon__node-icon">
                            <Database size={28} />
                        </div>
                        <div>
                            <div className="ef-mon__node-name">ENGINE_NODE_01</div>
                            <div className="ef-mon__node-status">
                                STATUS: {engine ? 'RUNNING AT PEAK EFFICIENCY' : 'NO ENGINE'}
                            </div>
                        </div>
                    </div>
                    <div className="ef-mon__node-right">
                        <div className="ef-mon__node-addr">0x7FFC2A800000</div>
                        <div className="ef-mon__node-addr-label">PRIMARY_ADDR_MAPPING</div>
                    </div>
                </div>

                {/* ============ DETAILED ENTRIES (preserve original) ============ */}
                {entries.length > 0 && (
                    <div className="ef-mon__entries">
                        <h3 className="ef-mon__panel-title ef-mon__entries-title">
                            EVENT_DETAILS &middot; {entries.length}
                        </h3>
                        {entries.slice(0, 20).map(e => {
                            const sevKey = severityKey(e.severity);
                            return (
                                <EfPanel
                                    key={e.id}
                                    padding="lg"
                                    className={`ef-mon__entry ef-mon__entry--${sevKey}`}
                                >
                                    <div className="ef-mon__entry-header">
                                        <div className="ef-mon__entry-left">
                                            <div className="ef-mon-cat-tag">
                                                {CATEGORY_ICONS[e.category]}{' '}
                                                {CATEGORY_LABELS[e.category] || e.category}
                                            </div>
                                            <div className={`ef-mon-sev ef-mon__sev--${sevKey}`}>
                                                {e.severity === 'critical' || e.severity === 'error' ? (
                                                    <WarningCircle weight="fill" />
                                                ) : (
                                                    <Info weight="fill" />
                                                )}
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
                                            <summary className="ef-text-info ef-mon__entry-summary">
                                                Ver Stack Trace
                                            </summary>
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

                {/* Spacer */}
                <div className="ef-mon__footer">
                    <HardDrives size={14} />
                    <span>OléFUT-SYS_32BIT &middot; ROOT_USER &middot; LOCAL_DB</span>
                </div>

            </div>
        </div>
    );
}

export default MonitorView;
