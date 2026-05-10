/**
 * AchievementsView — SPEC-070
 *
 * Lista todos achievements + progresso atual baseado em engine state.
 * Tier groups: Common (Bronze) / Uncommon (Silver) / Rare (Gold) / Legendary (Platinum).
 */

import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, MILESTONES } from '../engine/systems/AchievementsSystem';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';

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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgTrophyRoom})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🏆 CONQUISTAS — {stats.unlocked}/{stats.total} ({stats.percent}%)</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <EfPanel variant="elev" padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Pontos totais: <strong>{stats.totalReward}</strong></span>
                        <div style={{
                            flex: 1,
                            height: '12px',
                            margin: '0 1rem',
                            background: 'var(--bg-elevated, var(--ef-color-bg-input))',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, var(--ef-color-border-subtle))',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${stats.percent}%`,
                                background: '#6ABC3A',
                                transition: 'width 300ms ease-out'
                            }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', minWidth: '60px', textAlign: 'right' }}><strong>{stats.percent}%</strong></span>
                    </div>
                </EfPanel>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {sorted.map(ach => {
                        const colors = RARITY_COLORS[ach.rarity];
                        return (
                            <EfPanel
                                variant={ach.unlocked ? 'elev' : 'sunk'}
                                padding="sm"
                                key={ach.id}
                                style={{
                                    border: `2px solid ${ach.unlocked ? colors.bg : 'var(--border-subtle)'}`,
                                    background: ach.unlocked ? colors.bg : 'var(--bg-panel-hover)',
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
                                        background: 'var(--bg-elevated)',
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
                            </EfPanel>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AchievementsView;
