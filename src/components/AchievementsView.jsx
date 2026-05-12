import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, MILESTONES } from '../engine/systems/AchievementsSystem';
import { EfPanel, EfButton } from './ui';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';

import { 
    Trophy, ArrowLeft, Star, LockKey, LockOpen, CheckCircle
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
    const renderProgressBar = (percent, color) => {
        return (
            <div style={{
                height: '8px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                flex: 1
            }}>
                <div style={{
                    height: '100%',
                    width: `${percent}%`,
                    backgroundColor: color,
                    transition: 'width 300ms ease-out'
                }} />
            </div>
        );
    };

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgTrophyRoom})`,
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
                            <Trophy size={28} color={colors.secondary} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                CONQUISTAS
                            </h2>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted }}>
                                DESAFIOS E MARCOS DA CARREIRA
                            </span>
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
                        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>PONTOS</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: colors.warning, fontWeight: '800' }}>
                            <Star weight="fill" /> {stats.totalReward}
                        </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            <span style={{ color: colors.textMuted, fontWeight: 'bold' }}>PROGRESSO GERAL</span>
                            <span style={{ color: colors.secondary, fontWeight: 'bold' }}>{stats.unlocked} / {stats.total}</span>
                        </div>
                        <div style={{
                            height: '12px',
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${stats.percent}%`,
                                backgroundColor: colors.secondary,
                                transition: 'width 300ms ease-out'
                            }} />
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px', fontWeight: 'bold' }}>COMPLETO</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: colors.accent, fontWeight: '800' }}>
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
                                    borderLeft: `4px solid ${ach.unlocked ? rarityColors.bg : colors.border}`,
                                    opacity: ach.unlocked ? 1 : 0.6,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', minWidth: '48px',
                                        backgroundColor: ach.unlocked ? rarityColors.bg : colors.bg,
                                        color: ach.unlocked ? rarityColors.text : colors.textMuted,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        border: `2px solid ${ach.unlocked ? rarityColors.border : colors.border}`
                                    }}>
                                        {ach.badge}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: colors.text, marginBottom: '4px', fontWeight: 'bold' }}>
                                            {ach.name}
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.75rem',
                                            color: ach.unlocked ? rarityColors.bg : colors.textMuted,
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>{rarityColors.label}</span>
                                            <span style={{ color: colors.border }}>•</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: ach.unlocked ? colors.warning : colors.textMuted }}>
                                                <Star weight="fill" /> {ach.reward} PTS
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {ach.unlocked ? (
                                            <CheckCircle size={24} color={colors.accent} weight="fill" />
                                        ) : (
                                            <LockKey size={24} color={colors.border} />
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: '0.85rem',
                                    color: colors.textMuted,
                                    marginBottom: '16px',
                                    lineHeight: '1.5',
                                    fontFamily: 'var(--font-sans)',
                                    flex: 1
                                }}>
                                    {ach.desc}
                                </div>

                                {!ach.unlocked && ach.progress > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                                        {renderProgressBar(ach.progress, rarityColors.bg)}
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: rarityColors.bg, fontWeight: 'bold' }}>
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
