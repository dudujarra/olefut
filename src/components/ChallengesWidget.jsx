/**
 * ChallengesWidget — SPEC-103
 *
 * Dashboard widget mostrando 3 desafios ativos da semana.
 */

import { useGame } from '../context/GameContext';
import { getActiveChallenges, claimChallenge } from '../services/ChallengesService';
import { EfPanel, EfButton } from './ui';
import { Lightning, CheckCircle, Gift, Trophy, Star } from '@phosphor-icons/react';

export function ChallengesWidget() {
    const { getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    if (!engine) return null;

    const challenges = getActiveChallenges(engine);
    if (!challenges || challenges.length === 0) return null;

    const handleClaim = (id) => {
        const result = claimChallenge(engine, id);
        if (result.success) {
            forceUpdate();
        }
    };

    return (
        <EfPanel padding="md" style={{ marginBottom: '16px', border: '1px solid var(--info)' }}>
            <h3 className="ef-widget-title">
                <Lightning size={16} weight="fill" /> DESAFIOS DA SEMANA
                <span className="ef-widget-title__hint">
                    (OPCIONAL)
                </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {challenges.map(c => {
                    const isCompleted = c.completed;
                    const canClaim = c.progress >= 100 && !c.completed;
                    const cardClass = `ef-challenge-card ${isCompleted ? 'ef-challenge-card--completed' : ''} ${canClaim ? 'ef-challenge-card--claimable' : ''}`.trim();

                    return (
                        <div key={c.id} className={cardClass}>
                            <div className="ef-challenge-card__body">
                                <div className="ef-challenge-card__icon">
                                    {isCompleted ? <CheckCircle size={20} weight="fill" /> : canClaim ? <Gift size={20} weight="fill" className="ef-anim-pulse-glow" /> : <Trophy size={20} />}
                                </div>
                                <div>
                                    <div className="ef-challenge-card__title">
                                        {c.title}
                                    </div>
                                    <div className="ef-challenge-card__desc">
                                        {c.desc}
                                    </div>
                                </div>
                            </div>

                            <div className="ef-challenge-card__aside">
                                <div className="ef-challenge-card__reward">
                                    <Star size={10} weight="fill" /> +{c.reward.prestige}P · R${(c.reward.money / 1000).toFixed(0)}k
                                </div>

                                {canClaim && (
                                    <EfButton
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleClaim(c.id)}
                                        style={{
                                            fontSize: '0.65rem',
                                            padding: '4px 12px',
                                            fontWeight: 700,
                                            marginTop: '4px'
                                        }}
                                    >
                                        RESGATAR
                                    </EfButton>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

export default ChallengesWidget;
