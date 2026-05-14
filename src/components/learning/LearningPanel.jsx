/**
 * LearningPanel — SPEC-123
 *
 * Real-time visualization of bot learning state.
 * Embedded in AutoPlayView. Polls controller every 1s.
 *
 * Sections:
 * - Q-table top actions (color-coded)
 * - Episodic memory log (scrollable)
 * - Win rate sparkline per season
 * - Brain stats (states, updates, total memory)
 */
import { useState, useEffect } from 'react';
import { EfPanel } from '../ui/EfPanel';
import { TrendUp } from '@phosphor-icons/react';

function Sparkline({ data, width = 200, height = 40, color = 'var(--color-success-mid)' }) {
    if (!Array.isArray(data) || data.length < 2) {
        return <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>need ≥2 data points</div>;
    }
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const points = data.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={width} height={height} style={{ background: 'var(--color-shadow-deep)', }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
    );
}

function ActionBar({ action, q, max }) {
    const positive = q >= 0;
    const widthPct = Math.min(100, (Math.abs(q) / Math.max(1, max)) * 100);
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            marginBottom: '2px'
        }}>
            <div style={{ minWidth: '120px', fontFamily: 'var(--font-mono)' }}>{action}</div>
            <div style={{
                flex: 1,
                background: 'var(--color-shadow-deep)',
                height: '12px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: positive ? 'var(--color-success-mid)' : 'var(--danger)',
                    transition: 'width 300ms'
                }} />
            </div>
            <div style={{
                minWidth: '50px',
                textAlign: 'right',
                color: positive ? 'var(--color-success-mid)' : 'var(--danger)',
                fontFamily: 'var(--font-mono)'
            }}>
                {positive ? '+' : ''}{q.toFixed(1)}
            </div>
        </div>
    );
}

function MemoryEntry({ entry }) {
    const reward = entry.reward;
    const color = reward > 0 ? 'var(--color-success-mid)' : reward < 0 ? 'var(--danger)' : 'var(--text-muted)';
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            padding: '2px 4px',
            borderBottom: '1px solid var(--color-bg-deep)',
            fontFamily: 'var(--font-mono)'
        }}>
            <span>
                <strong>wk{entry.week ?? '?'}/s{entry.season ?? '?'}</strong>{' '}
                {entry.action || entry.decision || '—'}
            </span>
            <span style={{ color }}>
                {entry.result || ''} {reward != null && (
                    <strong>{reward >= 0 ? '+' : ''}{reward.toFixed(1)}</strong>
                )}
            </span>
        </div>
    );
}

export default function LearningPanel({ controllerRef }) {
    const [snapshot, setSnapshot] = useState({
        brainSummary: null,
        memory: [],
        seasonHistory: []
    });
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            const c = controllerRef.current;
            if (!c) return;
            const stats = c.getStats?.();
            setSnapshot({
                brainSummary: c.brain?.summary?.() || null,
                memory: c.brain?.memory?.slice?.(-20) || [],
                seasonHistory: stats?.seasonHistory || []
            });
        }, 1000);
        return () => clearInterval(id);
    }, [controllerRef]);

    if (!snapshot.brainSummary) return null;

    const { brainSummary, memory, seasonHistory } = snapshot;
    const topActions = brainSummary.topActions || [];
    const maxAbsQ = topActions.reduce((m, a) => Math.max(m, Math.abs(a.totalQ || 0)), 1);
    const winSeries = seasonHistory.map(s => s.seasonWins || 0);
    const transferSeries = seasonHistory.map(s => s.seasonTransfers || 0);

    return (
        <EfPanel variant="sunk" padding="md" style={{
            marginTop: '0.5rem',
            background: 'var(--color-forest-pulse)',
            border: '1px solid var(--color-success-mid)',
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: 'var(--color-success-mid)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span><TrendUp size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'6px'}} />LEARNING REAL-TIME (SPEC-123) {open ? '▼' : '▶'}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {brainSummary.states} states · {brainSummary.totalUpdates} upd · {memory.length} mem
                    {brainSummary.replayBuffer > 0 && ` · ${brainSummary.replayBuffer} replay`}
                    {brainSummary.activeTraces > 0 && ` · ${brainSummary.activeTraces} traces`}
                </span>
            </div>

            {open && (
                <>
                    {/* Win/Transfer sparklines */}
                    {seasonHistory.length >= 2 && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                    Wins per season ({seasonHistory.length} samples)
                                </div>
                                <Sparkline data={winSeries} color="var(--color-success-mid)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                                    Transfers per season
                                </div>
                                <Sparkline data={transferSeries} color="var(--accent)" />
                            </div>
                        </div>
                    )}

                    {/* Top Q-actions */}
                    {topActions.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Top actions Q-values:
                            </div>
                            {topActions.slice(0, 5).map((a, i) => (
                                <ActionBar key={i} action={a.action} q={a.totalQ || 0} max={maxAbsQ} />
                            ))}
                        </div>
                    )}

                    {/* Episodic memory */}
                    {memory.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Recent memories (last {memory.length}):
                            </div>
                            <div style={{
                                maxHeight: '160px',
                                overflowY: 'auto',
                                background: 'var(--color-shadow-deep)',
                                padding: '4px'
                            }}>
                                {memory.slice().reverse().map((m, i) => (
                                    <MemoryEntry key={i} entry={m} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </EfPanel>
    );
}
