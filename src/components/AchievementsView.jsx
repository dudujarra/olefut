import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../engine/systems/AchievementsSystem';
import { EfPanel, EfButton } from './ui';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';
import '../styles/achievements-view.css';

import {
    Trophy, ArrowLeft, Star, LockKey, CheckCircle, Clock
} from '@phosphor-icons/react';

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
const RARITY_META = {
    Common:    { key: 'bronze',   label: 'BRONZE' },
    Uncommon:  { key: 'silver',   label: 'PRATA' },
    Rare:      { key: 'gold',     label: 'OURO' },
    Legendary: { key: 'platinum', label: 'PLATINA' }
};

// Stitch reference (83) uses subtle badge rotations for unlocked variety
const BADGE_ROTATIONS = ['rot3', 'rot-neg3', 'rot6', 'rot0'];

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

/**
 * Renders blocky 20-segment progress matching Stitch v1.1 reference (83).
 */
function BlockyProgress({ percent }) {
    const totalBlocks = 20;
    const filled = Math.round((percent / 100) * totalBlocks);
    return (
        <div className="ef-ach__blocky-track">
            {Array.from({ length: totalBlocks }, (_, i) => (
                <span
                    key={i}
                    className={i < filled ? 'ef-ach__blocky-cell' : 'ef-ach__blocky-cell ef-ach__blocky-cell--empty'}
                />
            ))}
        </div>
    );
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
        <div
            className="ef-anim-fade-in ef-scene-shell ef-ach"
            /* eslint-disable-next-line no-restricted-syntax -- dynamic per-instance bg image */
            style={{ backgroundImage: `url(${bgTrophyRoom})` }}
        >
            <div className="ef-view-container">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header ef-ach__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Trophy size={28} className="ef-ach__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">HALL OF FAME</h2>
                            <span className="ef-view-header__subtitle">CONQUISTAS DA CARREIRA</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* HALL OF FAME DASHBOARD — points + blocky completion */}
                <EfPanel padding="lg" className="ef-ach__dashboard">
                    <div className="ef-ach__dashboard-points">
                        <h3 className="ef-ach__dashboard-title">HALL OF FAME</h3>
                        <div className="ef-ach__dashboard-score">
                            <span className="ef-ach__dashboard-points-num">{stats.totalReward.toLocaleString()}</span>
                            <span className="ef-mono ef-text-muted ef-ach__dashboard-points-label">
                                TOTAL CAREER POINTS
                            </span>
                        </div>
                    </div>
                    <div className="ef-ach__dashboard-progress">
                        <div className="ef-ach__dashboard-progress-header">
                            <span>COMPLETION</span>
                            <span>{stats.percent}%</span>
                        </div>
                        <BlockyProgress percent={stats.percent} />
                        <div className="ef-ach__dashboard-progress-footer">
                            <span className="ef-mono ef-text-muted">
                                {stats.unlocked} / {stats.total} DESBLOQUEADAS
                            </span>
                        </div>
                    </div>
                </EfPanel>

                {/* ACHIEVEMENT CARDS GRID */}
                <div className="ef-ach__grid">
                    {sorted.map((ach, idx) => {
                        const rarity = RARITY_META[ach.rarity];
                        const isInProgress = !ach.unlocked && ach.progress > 0;
                        const isLocked = !ach.unlocked && ach.progress === 0;

                        const cardClasses = [
                            'ef-ach__card',
                            `ef-ach__card--${rarity.key}`,
                            ach.unlocked ? 'ef-ach__card--unlocked' : '',
                            isLocked ? 'ef-ach__card--locked' : '',
                            isInProgress ? 'ef-ach__card--progress' : '',
                            ach.unlocked ? 'ef-anim-fade-in' : ''
                        ].filter(Boolean).join(' ');

                        const badgeClasses = [
                            'ef-ach-badge',
                            `ef-ach__badge--${rarity.key}`,
                            `ef-ach__badge--${BADGE_ROTATIONS[idx % BADGE_ROTATIONS.length]}`,
                            ach.unlocked ? 'ef-ach__card--unlocked-badge' : ''
                        ].filter(Boolean).join(' ');

                        return (
                            <EfPanel key={ach.id} className={cardClasses}>
                                <div className="ef-ach__card-top">
                                    <div className={badgeClasses}>
                                        <span className="ef-ach__badge-emoji">{ach.badge}</span>
                                    </div>
                                    <div className="ef-ach__card-status">
                                        {ach.unlocked && (
                                            <CheckCircle size={28} weight="fill" className="ef-ach__check-icon" />
                                        )}
                                        {isInProgress && (
                                            <Clock size={28} className="ef-ach__pending-icon" />
                                        )}
                                        {isLocked && (
                                            <LockKey size={28} className="ef-ach__lock-icon" />
                                        )}
                                    </div>
                                </div>

                                <div className="ef-ach__card-body">
                                    <h3 className={`ef-ach__card-name ef-ach__card-name--${rarity.key}`}>
                                        {ach.name}
                                    </h3>
                                    <p className="ef-sans ef-ach__card-desc">
                                        {ach.desc}
                                    </p>
                                </div>

                                <div className="ef-ach__card-footer">
                                    <div className="ef-mono ef-ach__reward-row">
                                        <span className="ef-ach__reward-label">REWARD</span>
                                        <span className="ef-ach__reward-value">
                                            <Star size={12} weight="fill" /> {ach.reward} PTS
                                        </span>
                                    </div>

                                    {ach.unlocked && (
                                        <div className="ef-ach__status-banner ef-ach__status-banner--completed">
                                            COMPLETED 100%
                                        </div>
                                    )}

                                    {isInProgress && (
                                        <div className="ef-ach__progress-block">
                                            <div className="ef-mono ef-ach__progress-meta">
                                                <span>PROGRESS</span>
                                                <span>{Math.round(ach.progress)}%</span>
                                            </div>
                                            <div className="ef-ach__progress-bar">
                                                <div
                                                    className={`ef-ach__progress-fill ef-ach__progress-fill--${rarity.key}`}
                                                    /* eslint-disable-next-line no-restricted-syntax -- dynamic per-instance progress width */
                                                    style={{ width: `${ach.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isLocked && (
                                        <div className="ef-ach__status-banner ef-ach__status-banner--locked">
                                            LOCKED 0%
                                        </div>
                                    )}
                                </div>
                            </EfPanel>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AchievementsView;
