import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { ACHIEVEMENTS } from '../engine/systems/AchievementsSystem';
import { EfPanel, EfButton } from './ui';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';

import {
    Trophy, ArrowLeft, Star, LockKey, CheckCircle
} from '@phosphor-icons/react';

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
const RARITY_COLORS = {
    Common:    { bg: '#CD7F32', border: '#8B5A2B', label: 'BRONZE', text: '#FFF' },
    Uncommon:  { bg: '#C0C0C0', border: '#808080', label: 'PRATA', text: '#000' },
    Rare:      { bg: '#FFD700', border: '#AA8800', label: 'OURO', text: '#000' },
    Legendary: { bg: '#E040FB', border: '#9C27B0', label: 'PLATINA', text: '#FFF' }
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

    // Render continuous progress bar
    const renderProgressBar = (percent, color) => (
        <div className="ef-pbar ef-pbar--sm" style={{ flex: 1 }}>
            <div className="ef-pbar__fill" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
    );

    return (
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgTrophyRoom})` }}>
            <ViewOnboarding viewId="achievements" />
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #40BAF7' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Trophy size={28} color="#40BAF7" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">CONQUISTAS</h2>
                            <span className="ef-view-header__subtitle">DESAFIOS E MARCOS DA CARREIRA</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* OVERALL PROGRESS */}
                <EfPanel padding="lg" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px'
                }}>
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <span className="ef-mono ef-text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold' }}>PONTOS</span>
                        <div className="ef-mono ef-text-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '1.5rem', fontWeight: '800' }}>
                            <Star weight="fill" /> {stats.totalReward}
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div className="ef-mono" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                            <span className="ef-text-muted" style={{ fontWeight: 'bold' }}>PROGRESSO GERAL</span>
                            <span className="ef-text-info" style={{ fontWeight: 'bold' }}>{stats.unlocked} / {stats.total}</span>
                        </div>
                        <div className="ef-pbar ef-pbar--md">
                            <div className="ef-pbar__fill" style={{ width: `${stats.percent}%`, backgroundColor: '#40BAF7' }} />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <span className="ef-mono ef-text-muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 'bold' }}>COMPLETO</span>
                        <span className="ef-mono ef-text-primary" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                            {stats.percent}%
                        </span>
                    </div>
                </EfPanel>

                {/* ACHIEVEMENT CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {sorted.map(ach => {
                        const rarityColors = RARITY_COLORS[ach.rarity];
                        return (
                            <EfPanel
                                key={ach.id}
                                className={ach.unlocked ? 'ef-anim-fade-in' : ''}
                                style={{
                                    borderLeft: `4px solid ${ach.unlocked ? rarityColors.bg : '#2D3748'}`,
                                    opacity: ach.unlocked ? 1 : 0.6,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                    <div
                                        className="ef-ach-badge"
                                        style={ach.unlocked ? {
                                            backgroundColor: rarityColors.bg,
                                            color: rarityColors.text,
                                            borderColor: rarityColors.border
                                        } : undefined}
                                    >
                                        {ach.badge}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="ef-sans ef-text-main" style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 'bold' }}>
                                            {ach.name}
                                        </div>
                                        <div className="ef-mono" style={{
                                            fontSize: '0.75rem',
                                            color: ach.unlocked ? rarityColors.bg : '#8E9E94',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>{rarityColors.label}</span>
                                            <span style={{ color: '#2D3748' }}>•</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: ach.unlocked ? '#FFD700' : '#8E9E94' }}>
                                                <Star weight="fill" /> {ach.reward} PTS
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {ach.unlocked ? (
                                            <CheckCircle size={24} color="#39FF14" weight="fill" />
                                        ) : (
                                            <LockKey size={24} color="#2D3748" />
                                        )}
                                    </div>
                                </div>

                                <div className="ef-sans ef-text-muted" style={{
                                    fontSize: '0.85rem',
                                    marginBottom: '16px',
                                    lineHeight: '1.5',
                                    flex: 1
                                }}>
                                    {ach.desc}
                                </div>

                                {!ach.unlocked && ach.progress > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                                        {renderProgressBar(ach.progress, rarityColors.bg)}
                                        <span className="ef-mono" style={{ fontSize: '0.8rem', color: rarityColors.bg, fontWeight: 'bold' }}>
                                            {Math.round(ach.progress)}%
                                        </span>
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
