/**
 * BrainDashboard — Visual ML Dashboard for AutoPlay
 *
 * Shows what the AdaptiveBrain is learning:
 * - Personality traits (OCEAN-derived)
 * - Q-Table stats
 * - Learning curve (reward sparkline)
 * - Action distribution (bar chart)
 * - State exploration map
 * - Episodic memory timeline
 */

import React, { useState, useMemo, useEffect } from 'react';
import { EfPanel } from '../ui/EfPanel';

// Colors for bar visualization
const BAR_COLORS = [
    '#6ABC3A', '#3b82f6', '#f59e0b', '#ef4444', '#a78bfa',
    '#14b8a6', '#f97316', '#ec4899', '#22d3ee', '#84cc16'
];

const EMPTY = {
    qTable: {}, visitCount: {}, totalUpdates: 0,
    memory: [], traits: {}, archetypeLabel: 'Bot',
    topActions: [], decisions: [],
};

export function BrainDashboard({ controllerRef }) {
    const [expanded, setExpanded] = useState(true);
    const [brainData, setBrainData] = useState(EMPTY);

    // Poll brain data every 500ms (safe ref access inside effect)
    useEffect(() => {
        const interval = setInterval(() => {
            const ctrl = controllerRef?.current;
            if (!ctrl?.brain) return;
            const b = ctrl.brain;
            setBrainData({
                qTable: b.qTable || {},
                visitCount: b.visitCount || {},
                totalUpdates: b.totalUpdates || 0,
                memory: b.memory || [],
                traits: b.personality?.traits || b.personality?.ocean || {},
                archetypeLabel: b.personality?.label || b.personality?.id || 'Bot',
                topActions: typeof b.topActions === 'function' ? b.topActions(10) : [],
                decisions: ctrl.stats?.decisions || [],
            });
        }, 500);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ALL hooks MUST be called before any early return (Rules of Hooks)
    const { qTable, visitCount, totalUpdates, memory, traits, archetypeLabel, topActions, decisions } = brainData;
    const stateKeys = Object.keys(qTable);

    const actionFreq = useMemo(() => {
        const freq = {};
        (decisions || []).forEach(d => {
            freq[d.action] = (freq[d.action] || 0) + 1;
        });
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);
    }, [decisions]);

    const totalDecisions = actionFreq.reduce((s, [, n]) => s + n, 0);

    const stateVisits = useMemo(() => {
        return stateKeys
            .map(k => ({ state: k, visits: visitCount[k] || 0 }))
            .sort((a, b) => b.visits - a.visits);
    }, [stateKeys.length, totalUpdates]); // eslint-disable-line react-hooks/exhaustive-deps

    const rewardHistory = useMemo(() => {
        return (memory || [])
            .filter(m => m.reward != null)
            .map((m, i) => ({ idx: i, reward: m.reward, action: m.action || m.decision || '?', week: m.week }));
    }, [memory]);

    const cumulativeReward = useMemo(() => {
        let total = 0;
        return rewardHistory.map(r => { total += r.reward; return total; });
    }, [rewardHistory]);

    const allQValues = stateKeys.flatMap(s => Object.values(qTable[s] || {}));
    const qMin = allQValues.length > 0 ? Math.min(...allQValues) : 0;
    const qMax = allQValues.length > 0 ? Math.max(...allQValues) : 1;
    const allActions = [...new Set(stateKeys.flatMap(s => Object.keys(qTable[s] || {})))].sort();

    // Now safe to early return — all hooks called above
    if (totalUpdates === 0 && stateKeys.length === 0 && decisions.length === 0) return null;

    return (
        <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', userSelect: 'none'
                }}
            >
                <h3 style={{ fontSize: '0.9rem', margin: 0 }}>
                    🧠 Brain ML Dashboard
                    <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: '8px' }}>
                        {totalUpdates} updates • {stateKeys.length} states • {allActions.length} actions
                    </span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {expanded ? '▼' : '▶'}
                </span>
            </div>

            {expanded && (
                <div style={{ marginTop: '0.75rem' }}>
                    {/* Row 1: Personality + Overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        {/* Personality */}
                        <div style={cardStyle}>
                            <div style={titleStyle}>🎭 Personalidade — {String(archetypeLabel)}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {Object.entries(traits).map(([trait, val]) => {
                                    if (typeof val !== 'number') return null;
                                    const pct = Math.round(val * 100);
                                    return (
                                        <div key={trait} style={{ fontSize: '0.7rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ textTransform: 'capitalize' }}>{String(trait)}</span>
                                                <span style={{ color: '#6ABC3A', fontWeight: 700 }}>{pct}%</span>
                                            </div>
                                            <div style={barBg}>
                                                <div style={{ ...barFill, width: `${pct}%`, background: traitColor(trait) }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Learning Overview */}
                        <div style={cardStyle}>
                            <div style={titleStyle}>📊 Aprendizado</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.72rem' }}>
                                <MiniStat label="Q Updates" value={totalUpdates} />
                                <MiniStat label="States" value={stateKeys.length} />
                                <MiniStat label="Actions" value={allActions.length} />
                                <MiniStat label="Memórias" value={memory.length} />
                                <MiniStat label="Q min" value={qMin.toFixed(1)} color="#ef4444" />
                                <MiniStat label="Q max" value={qMax.toFixed(1)} color="#6ABC3A" />
                                <MiniStat label="Reward média"
                                    value={rewardHistory.length > 0
                                        ? (rewardHistory.reduce((s, r) => s + r.reward, 0) / rewardHistory.length).toFixed(1)
                                        : '—'}
                                    color="#3b82f6" />
                                <MiniStat label="Reward acum."
                                    value={cumulativeReward.length > 0
                                        ? cumulativeReward[cumulativeReward.length - 1].toFixed(0)
                                        : '0'}
                                    color={cumulativeReward.length > 0 && cumulativeReward[cumulativeReward.length - 1] > 0 ? '#6ABC3A' : '#ef4444'} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Action Distribution (visual bar chart) */}
                    <div style={{ ...cardStyle, marginBottom: '10px' }}>
                        <div style={titleStyle}>📐 Distribuição de Ações ({totalDecisions} total)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {actionFreq.map(([action, count], i) => {
                                const pct = totalDecisions > 0 ? (count / totalDecisions) * 100 : 0;
                                return (
                                    <div key={action} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ minWidth: '110px', color: '#888', textAlign: 'right' }}>
                                            {String(action)}
                                        </span>
                                        <div style={{ flex: 1, ...barBg, height: '14px' }}>
                                            <div style={{
                                                ...barFill,
                                                width: `${pct}%`,
                                                background: BAR_COLORS[i % BAR_COLORS.length],
                                                height: '14px',
                                                borderRadius: '3px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                paddingLeft: '4px',
                                                fontSize: '0.6rem',
                                                color: '#fff',
                                                fontWeight: 700,
                                                minWidth: pct > 5 ? 'auto' : '0'
                                            }}>
                                                {pct > 8 ? `${pct.toFixed(0)}%` : ''}
                                            </div>
                                        </div>
                                        <span style={{ minWidth: '32px', fontWeight: 700, textAlign: 'right' }}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 3: Q-Value Rankings + Reward Curve */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        {/* Top Q-Value Actions */}
                        <div style={cardStyle}>
                            <div style={titleStyle}>🏆 Top Ações (Q-value total)</div>
                            {topActions.length === 0 && <div style={{ fontSize: '0.7rem', color: '#888' }}>Sem dados — rode o autoplay</div>}
                            {topActions.map((a, i) => (
                                <div key={String(a.action)} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '0.7rem', padding: '2px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <span>{i + 1}. {String(a.action)}</span>
                                    <strong style={{ color: a.totalQ >= 0 ? '#6ABC3A' : '#ef4444' }}>
                                        {a.totalQ >= 0 ? '+' : ''}{Number(a.totalQ).toFixed(1)}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        {/* Reward Sparkline */}
                        <div style={cardStyle}>
                            <div style={titleStyle}>📈 Reward Curve (últimas {rewardHistory.length} decisões)</div>
                            {rewardHistory.length === 0 && <div style={{ fontSize: '0.7rem', color: '#888' }}>Sem dados — rode o autoplay</div>}
                            {rewardHistory.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '1px' }}>
                                    {rewardHistory.slice(-30).map((r, i) => {
                                        const maxAbs = Math.max(1, ...rewardHistory.slice(-30).map(x => Math.abs(x.reward)));
                                        const normalized = r.reward / maxAbs;
                                        const height = Math.abs(normalized) * 50;
                                        return (
                                            <div
                                                key={i}
                                                title={`wk${r.week}: ${r.action} → ${Number(r.reward).toFixed(1)}`}
                                                style={{
                                                    flex: 1,
                                                    height: `${height}px`,
                                                    minHeight: '2px',
                                                    background: r.reward >= 0 ? '#6ABC3A' : '#ef4444',
                                                    borderRadius: '1px',
                                                    opacity: 0.8
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 4: State Exploration */}
                    <div style={{ ...cardStyle, marginBottom: '10px' }}>
                        <div style={titleStyle}>🗺️ States Explorados ({stateVisits.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                            {stateVisits.slice(0, 30).map(sv => {
                                const maxVisits = stateVisits.length > 0 ? stateVisits[0].visits : 1;
                                const intensity = Math.min(1, sv.visits / Math.max(1, maxVisits));
                                return (
                                    <div
                                        key={sv.state}
                                        title={`${sv.state} — ${sv.visits} visitas`}
                                        style={{
                                            padding: '3px 6px',
                                            fontSize: '0.6rem',
                                            fontFamily: 'monospace',
                                            borderRadius: '4px',
                                            background: `rgba(59, 130, 246, ${0.1 + intensity * 0.4})`,
                                            border: `1px solid rgba(59, 130, 246, ${0.2 + intensity * 0.5})`,
                                            color: intensity > 0.5 ? '#fff' : '#888'
                                        }}
                                    >
                                        {String(sv.state)} <strong>({sv.visits})</strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 5: Episodic Memory Timeline */}
                    <div style={cardStyle}>
                        <div style={titleStyle}>💭 Memória Episódica (últimas {Math.min(10, memory.length)})</div>
                        <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                            {memory.slice(-10).reverse().map((m, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', gap: '8px',
                                    padding: '3px 0', fontSize: '0.68rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)'
                                }}>
                                    <span style={{ color: '#888' }}>wk{m.week ?? '?'}</span>
                                    <span style={{ flex: 1 }}>{String(m.action || m.decision || '?')}</span>
                                    <span style={{ color: m.result === 'W' ? '#6ABC3A' : m.result === 'L' ? '#ef4444' : '#f59e0b' }}>
                                        {String(m.result || '')}
                                    </span>
                                    {m.reward != null && (
                                        <strong style={{ color: m.reward >= 0 ? '#6ABC3A' : '#ef4444', minWidth: '35px', textAlign: 'right' }}>
                                            {m.reward >= 0 ? '+' : ''}{Number(m.reward).toFixed(1)}
                                        </strong>
                                    )}
                                </div>
                            ))}
                            {memory.length === 0 && (
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                    Sem memórias — rode o autoplay
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </EfPanel>
    );
}

// Helper components
function MiniStat({ label, value, color }) {
    return (
        <div style={{ textAlign: 'center', padding: '4px' }}>
            <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>{String(label)}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color || '#E2E8F0' }}>{String(value)}</div>
        </div>
    );
}

// Styles
const cardStyle = {
    padding: '8px 10px',
    background: 'rgba(45,90,61,0.12)',
    border: '1px solid rgba(45,90,61,0.25)',
    borderRadius: '6px',
};

const titleStyle = {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#FFD700',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const barBg = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    height: '6px',
    overflow: 'hidden',
};

const barFill = {
    height: '6px',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
};

function traitColor(trait) {
    const map = {
        ambition: '#f59e0b',
        riskAversion: '#ef4444',
        riskAppetite: '#ef4444',
        loyalty: '#3b82f6',
        creativity: '#a78bfa',
        patience: '#14b8a6',
        temperament: '#14b8a6',
        tacticalFlex: '#a78bfa',
        O: '#f59e0b',
        C: '#3b82f6',
        E: '#ef4444',
        A: '#14b8a6',
        N: '#a78bfa',
    };
    return map[trait] || '#6ABC3A';
}

export default BrainDashboard;
