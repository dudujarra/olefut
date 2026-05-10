/**
 * AchievementsView — SPEC-070
 *
 * Lista todos achievements + progresso atual baseado em engine state.
 * Tier groups: Common (Bronze) / Uncommon (Silver) / Rare (Gold) / Legendary (Platinum).
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 */

import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, MILESTONES } from '../engine/systems/AchievementsSystem';
import { EfButton } from './ui/EfButton';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
const RARITY_COLORS = {
    Common:    { bg: '#CD7F32', border: '#8B5A2B', label: 'BRONZE' },
    Uncommon:  { bg: '#C0C0C0', border: '#808080', label: 'PRATA' },
    Rare:      { bg: '#FFD700', border: '#AA8800', label: 'OURO' },
    Legendary: { bg: '#E040FB', border: '#9C27B0', label: 'PLATINA' }
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

    // Render HP-bar style progress
    const renderProgressBar = (percent, color) => {
        const blocks = 10;
        const filled = Math.round((percent / 100) * blocks);
        return (
            <div style={{display:'flex', gap:'2px'}}>
                {Array.from({length: blocks}).map((_, i) => (
                    <div key={i} style={{
                        width: '8px',
                        height: '10px',
                        backgroundColor: i < filled ? color : '#222',
                        border: '1px solid #000',
                        boxShadow: i < filled ? `inset 1px 1px 0 rgba(255,255,255,0.3)` : 'none'
                    }} />
                ))}
            </div>
        );
    };

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
            color: '#E2E8F0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* HEADER */}
                <div style={{
                    background: '#1E2124',
                    border: '4px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 8px 0 rgba(0,0,0,0.8)'
                }}>
                    <div>
                        <h2 style={{fontFamily: "'Press Start 2P', monospace", color: '#FFD700', margin: '0 0 8px 0', fontSize: '1rem', textShadow: '3px 3px 0 #000'}}>
                            CONQUISTAS
                        </h2>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888'}}>
                            {stats.unlocked}/{stats.total} DESBLOQUEADAS ({stats.percent}%)
                        </span>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>SAIR</EfButton>
                </div>

                {/* OVERALL PROGRESS */}
                <div style={{
                    background: '#111',
                    border: '4px solid',
                    borderColor: '#333 #000 #000 #333',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{textAlign: 'center'}}>
                        <span style={{display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888', marginBottom: '8px'}}>PONTOS</span>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.2rem', color: '#FFD700', textShadow: '2px 2px 0 #000'}}>
                            {stats.totalReward}
                        </span>
                    </div>
                    <div style={{flex: 1, margin: '0 24px'}}>
                        <div style={{
                            height: '16px',
                            background: '#222',
                            border: '4px solid',
                            borderColor: '#000 #333 #333 #000',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${stats.percent}%`,
                                background: 'linear-gradient(to bottom, #39FF14 0%, #1A8A0A 100%)',
                                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)',
                                transition: 'width 300ms ease-out'
                            }} />
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <span style={{display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#888', marginBottom: '8px'}}>PROGRESSO</span>
                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '1.2rem', color: '#39FF14', textShadow: '2px 2px 0 #000'}}>
                            {stats.percent}%
                        </span>
                    </div>
                </div>

                {/* ACHIEVEMENT CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {sorted.map(ach => {
                        const colors = RARITY_COLORS[ach.rarity];
                        return (
                            <div
                                key={ach.id}
                                className={ach.unlocked ? 'ef-anim-fade-in' : ''}
                                style={{
                                    background: '#1E2124',
                                    border: '4px solid',
                                    borderColor: ach.unlocked ? `${colors.bg} ${colors.border} ${colors.border} ${colors.bg}` : '#333 #111 #111 #333',
                                    padding: '16px',
                                    opacity: ach.unlocked ? 1 : 0.6,
                                    boxShadow: ach.unlocked ? `0 4px 0 ${colors.border}` : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', minWidth: '40px',
                                        background: ach.unlocked ? colors.bg : '#222',
                                        border: '3px solid #000',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        filter: ach.unlocked ? 'none' : 'grayscale(1)',
                                        boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3)'
                                    }}>
                                        {ach.badge}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#FFF', marginBottom: '4px'}}>
                                            {ach.name.toUpperCase()}
                                        </div>
                                        <div style={{
                                            fontFamily: "'Press Start 2P', monospace",
                                            fontSize: '0.5rem',
                                            color: colors.bg
                                        }}>
                                            {colors.label} • {ach.reward}PTS
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#888',
                                    marginBottom: '8px',
                                    lineHeight: '1.4'
                                }}>
                                    {ach.desc}
                                </div>

                                {!ach.unlocked && ach.progress > 0 && (
                                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        {renderProgressBar(ach.progress, colors.bg)}
                                        <span style={{fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: colors.bg}}>
                                            {Math.round(ach.progress)}%
                                        </span>
                                    </div>
                                )}

                                {ach.unlocked && (
                                    <div style={{
                                        fontFamily: "'Press Start 2P', monospace",
                                        fontSize: '0.55rem',
                                        color: '#39FF14',
                                        textShadow: '1px 1px 0 #000'
                                    }}>
                                        ✓ DESBLOQUEADA
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AchievementsView;
