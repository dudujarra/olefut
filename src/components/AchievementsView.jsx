/**
 * AchievementsView — SPEC-070
 *
 * Lista todos achievements + progresso atual baseado em engine state.
 * Tier groups: Common (Bronze) / Uncommon (Silver) / Rare (Gold) / Legendary (Platinum).
 */

import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, MILESTONES } from '../engine/systems/AchievementsSystem';

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
const RARITY_COLORS = {
    Common:    { bg: '#6ABC3A', label: 'BRONZE' },
    Uncommon:  { bg: '#3A7DCE', label: 'PRATA' },
    Rare:      { bg: '#FFD700', label: 'OURO' },
    Legendary: { bg: '#7B2CBF', label: 'PLATINA' }
};

function computeProgress(id, engine) {
    if (!engine) return 0;
    const stats = engine.managerStats || {};
    const matchesPlayed = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
    const titles = engine.legacy?.titles?.length || 0;
    const seasons = engine.seasonNumber || 1;

    switch (id) {
        case 'Champion': return titles >= 1 ? 100 : 0;
        case 'Cup_winner': return engine.legacy?.cupTitles ? 100 : 0;
        case 'Back_to_back': return titles >= 2 ? 100 : (titles >= 1 ? 50 : 0);
        case 'Unbeaten': return Math.min(100, ((stats.streak || 0) / 20) * 100);
        case 'Rookie': return matchesPlayed >= 1 ? 100 : 0;
        case 'Iron_man': return Math.min(100, (matchesPlayed / 50) * 100);
        case 'Veteran_15': return Math.min(100, (seasons / 15) * 100);
        case '100_goals': {
            const goals = engine.proPlayer?.career?.totalGoals || 0;
            return Math.min(100, (goals / 100) * 100);
        }
        case 'Hat_trick': return engine.proPlayer?.career?.hatTricks > 0 ? 100 : 0;
        case 'Survivor': return seasons >= 1 ? 100 : 0; // simplified
        case 'Legend_tier': {
            const prestige = engine.legacy?.prestige || 0;
            return Math.min(100, (prestige / 1000) * 100);
        }
        default: return 0;
    }
}

export function AchievementsView() {
    const { changeView, getEngine, getDashboardView } = useGame();
    const engine = getEngine();

    const sorted = useMemo(() => {
        return Object.entries(ACHIEVEMENTS)
            .map(([id, ach]) => ({
                id,
                ...ach,
                progress: computeProgress(id, engine),
                unlocked: computeProgress(id, engine) >= 100
            }))
            .sort((a, b) => {
                if (b.unlocked !== a.unlocked) return b.unlocked - a.unlocked;
                return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
            });
    }, [engine]);

    const stats = useMemo(() => {
        const total = sorted.length;
        const unlocked = sorted.filter(a => a.unlocked).length;
        const totalReward = sorted.filter(a => a.unlocked).reduce((s, a) => s + a.reward, 0);
        return { total, unlocked, percent: Math.round((unlocked / total) * 100), totalReward };
    }, [sorted]);

    return (
        <div className="main-content fade-in ef-art-bg ef-art-trophy-room">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2>🏆 Conquistas — {stats.unlocked}/{stats.total} ({stats.percent}%)</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>Pontos totais: <strong>{stats.totalReward}</strong></span>
                    <div style={{
                        flex: 1,
                        height: '12px',
                        margin: '0 1rem',
                        background: '#1a2520',
                        borderRadius: '6px',
                        border: '1px solid #2a3530',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${stats.percent}%`,
                            background: 'linear-gradient(90deg, #6ABC3A, #FFD700)',
                            transition: 'width 300ms ease-out'
                        }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', minWidth: '60px', textAlign: 'right' }}><strong>{stats.percent}%</strong></span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {sorted.map(ach => {
                    const colors = RARITY_COLORS[ach.rarity];
                    return (
                        <div
                            key={ach.id}
                            style={{
                                border: `2px solid ${ach.unlocked ? colors.bg : '#2a3530'}`,
                                borderRadius: '4px',
                                padding: '0.6rem',
                                background: ach.unlocked ? `linear-gradient(135deg, ${colors.bg}22, transparent)` : 'transparent',
                                opacity: ach.unlocked ? 1 : 0.65
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.5rem', filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>{ach.badge}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ach.name}</div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        color: colors.bg,
                                        fontWeight: 600,
                                        letterSpacing: '0.05em'
                                    }}>
                                        {colors.label} • {ach.reward}pts
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                {ach.desc}
                            </div>
                            {!ach.unlocked && ach.progress > 0 && (
                                <div style={{
                                    height: '4px',
                                    background: '#1a2520',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${ach.progress}%`,
                                        background: colors.bg
                                    }} />
                                </div>
                            )}
                            {ach.unlocked && (
                                <div style={{ fontSize: '0.7rem', color: colors.bg, fontWeight: 700 }}>
                                    ✓ DESBLOQUEADA
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AchievementsView;
