/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
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

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

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
        if (window.confirm(`Apagar ${entries.length} registros do monitor? Esta ação é irreversível.`)) {
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
            backgroundColor: colors.bg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '24px',
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: colors.panelElevated, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${colors.border}` }}>
                            <HardDrives size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                MONITOR DO SISTEMA
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                TELEMETRIA E DIAGNÓSTICO
                            </span>
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
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>TOTAL</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{stats.total}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '4px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}><Bug size={12} /> BUGS</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: stats.bugs > 0 ? colors.danger : colors.text }}>{stats.bugs}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '4px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}><GameController size={12} /> GAMEPLAY</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{stats.gameplay}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '4px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}><ChatCircleText size={12} /> FEEDBACK</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{stats.feedback}</div>
                            </div>
                        </div>
                        {stats.firstEntry && (
                            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
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
                        <EfButton variant="secondary" size="sm" onClick={handleExport} style={{ color: colors.secondary, borderColor: colors.secondary }}>
                            <DownloadSimple size={16} /> EXPORTAR JSON
                        </EfButton>
                        <EfButton variant="danger" size="sm" onClick={handleClear} style={{ color: colors.danger, borderColor: colors.danger }}>
                            <Trash size={16} /> LIMPAR
                        </EfButton>
                    </div>
                </EfPanel>

                {entries.length === 0 ? (
                    <EfPanel padding="lg" style={{ textAlign: 'center', color: colors.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Info size={48} />
                        <div>Nenhum registro encontrado. O sistema está limpo.</div>
                    </EfPanel>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {entries.map(e => {
                            const sevColor = SEVERITY_COLORS[e.severity] || colors.textMuted;
                            return (
                                <EfPanel key={e.id} padding="lg" style={{
                                    borderLeft: `4px solid ${sevColor}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                backgroundColor: '#0E1F14', 
                                                padding: '4px 8px', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.75rem',
                                                color: colors.text
                                            }}>
                                                {CATEGORY_ICONS[e.category]} {CATEGORY_LABELS[e.category] || e.category}
                                            </div>
                                            <div style={{ 
                                                color: sevColor, 
                                                fontSize: '0.75rem', 
                                                fontFamily: 'var(--font-mono)', 
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {e.severity === 'critical' || e.severity === 'error' ? <WarningCircle weight="fill" /> : <Info weight="fill" />}
                                                {e.severity}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
                                            {formatTs(e.ts)}
                                        </span>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: colors.text }}>
                                        {e.message || e.text || e.action || '(sem conteúdo)'}
                                    </div>
                                    
                                    {e.action && e.ctx && (
                                        <div style={{ 
                                            backgroundColor: colors.bg, 
                                            padding: '12px', 
                                            fontSize: '0.8rem', 
                                            color: colors.textMuted, 
                                            fontFamily: 'var(--font-mono)', 
                                            overflowX: 'auto',
                                            border: `1px solid ${colors.border}`
                                        }}>
                                            {JSON.stringify(e.ctx)}
                                        </div>
                                    )}
                                    
                                    {e.stack && (
                                        <details style={{ marginTop: '4px' }}>
                                            <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: colors.secondary, fontWeight: 'bold', outline: 'none' }}>Ver Stack Trace</summary>
                                            <div style={{ 
                                                backgroundColor: colors.bg, 
                                                padding: '12px', 
                                                fontSize: '0.75rem', 
                                                color: colors.danger, 
                                                fontFamily: 'var(--font-mono)', 
                                                overflowX: 'auto',
                                                marginTop: '8px',
                                                border: `1px solid ${colors.border}`
                                            }}>
                                                {e.stack}
                                            </div>
                                        </details>
                                    )}
                                    
                                    {e.url && (
                                        <div style={{ fontSize: '0.8rem', color: colors.secondary, fontFamily: 'var(--font-mono)' }}>
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
