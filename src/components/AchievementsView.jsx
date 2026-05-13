import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../engine/systems/AchievementsSystem';
import { EfPanel, EfButton } from './ui';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';
import '../styles/achievements-view.css';

import {
    Trophy, ArrowLeft, Star, LockKey, CheckCircle
} from '@phosphor-icons/react';

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
const RARITY_META = {
    Common:    { key: 'bronze',   label: 'BRONZE' },
    Uncommon:  { key: 'silver',   label: 'PRATA' },
    Rare:      { key: 'gold',     label: 'OURO' },
    Legendary: { key: 'platinum', label: 'PLATINA' }
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

    const renderProgressBar = (percent, rarityKey) => (
        <div className="ef-pbar ef-pbar--sm ef-ach__progress-bar">
            <div className={`ef-pbar__fill ef-ach__progress-fill--${rarityKey}`} style={{ width: `${percent}%` }} />
        </div>
    );

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-ach" style={{ backgroundImage: `url(${bgTrophyRoom})` }}>
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header ef-ach__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Trophy size={28} className="ef-ach__header-icon" />
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
                <EfPanel padding="lg" className="ef-ach__overall">
                    <div className="ef-ach__overall-col">
                        <span className="ef-mono ef-text-muted ef-ach__overall-label">PONTOS</span>
                        <div className="ef-mono ef-text-accent ef-ach__overall-points">
                            <Star weight="fill" /> {stats.totalReward}
                        </div>
                    </div>

                    <div className="ef-ach__overall-bar-wrap">
                        <div className="ef-mono ef-ach__overall-bar-header">
                            <span className="ef-text-muted"><strong>PROGRESSO GERAL</strong></span>
                            <span className="ef-text-info"><strong>{stats.unlocked} / {stats.total}</strong></span>
                        </div>
                        <div className="ef-pbar ef-pbar--md">
                            <div className="ef-pbar__fill ef-ach__pbar-fill--info" style={{ width: `${stats.percent}%` }} />
                        </div>
                    </div>

                    <div className="ef-ach__overall-col">
                        <span className="ef-mono ef-text-muted ef-ach__overall-label">COMPLETO</span>
                        <span className="ef-mono ef-text-primary ef-ach__overall-percent">
                            {stats.percent}%
                        </span>
                    </div>
                </EfPanel>

                {/* ACHIEVEMENT CARDS */}
                <div className="ef-ach__grid">
                    {sorted.map(ach => {
                        const rarity = RARITY_META[ach.rarity];
                        const cardClasses = [
                            'ef-ach__card',
                            `ef-ach__card--${rarity.key}`,
                            ach.unlocked ? 'ef-ach__card--unlocked' : '',
                            ach.unlocked ? 'ef-anim-fade-in' : ''
                        ].filter(Boolean).join(' ');
                        const badgeClasses = [
                            'ef-ach-badge',
                            `ef-ach__badge--${rarity.key}`,
                            ach.unlocked ? 'ef-ach__card--unlocked-badge' : ''
                        ].filter(Boolean).join(' ');

                        return (
                            <EfPanel key={ach.id} className={cardClasses}>
                                <div className="ef-ach__card-header">
                                    <div className={badgeClasses}>
                                        {ach.badge}
                                    </div>
                                    <div className="ef-ach__card-body">
                                        <div className="ef-sans ef-text-main ef-ach__card-name">
                                            {ach.name}
                                        </div>
                                        <div className="ef-mono ef-ach__card-meta">
                                            <span>{rarity.label}</span>
                                            <span className="ef-ach__card-meta-sep">•</span>
                                            <span className="ef-ach__card-reward">
                                                <Star weight="fill" /> {ach.reward} PTS
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {ach.unlocked ? (
                                            <CheckCircle size={24} weight="fill" className="ef-ach__check-icon" />
                                        ) : (
                                            <LockKey size={24} className="ef-ach__lock-icon" />
                                        )}
                                    </div>
                                </div>

                                <div className="ef-sans ef-text-muted ef-ach__card-desc">
                                    {ach.desc}
                                </div>

                                {!ach.unlocked && ach.progress > 0 && (
                                    <div className="ef-ach__progress-row">
                                        {renderProgressBar(ach.progress, rarity.key)}
                                        <span className={`ef-mono ef-ach__progress-percent ef-ach__progress-percent--${rarity.key}`}>
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
