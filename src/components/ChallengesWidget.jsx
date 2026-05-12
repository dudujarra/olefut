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

    const handleClaim = (id) => {
        const result = claimChallenge(engine, id);
        if (result.success) {
            forceUpdate();
        }
    };

    return (
        <EfPanel padding="md" style={{ marginBottom: '16px', border: `1px solid ${colors.secondary}` }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0', fontFamily: 'var(--font-mono)', color: colors.secondary }}>
                <Lightning size={16} weight="fill" /> DESAFIOS DA SEMANA
                <span style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 400, marginLeft: 'auto' }}>
                    (OPCIONAL)
                </span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {challenges.map(c => {
                    const isCompleted = c.completed;
                    const canClaim = c.progress >= 100 && !c.completed;
                    
                    return (
                        <div key={c.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            backgroundColor: isCompleted ? '#1B4332' : colors.panelElevated,
                            border: `1px solid ${isCompleted ? colors.accent : canClaim ? colors.warning : colors.border}`,
                            transition: 'all 0.2s ease',
                            opacity: isCompleted ? 0.7 : 1
                        }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                    color: isCompleted ? colors.accent : canClaim ? colors.warning : colors.textMuted,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {isCompleted ? <CheckCircle size={20} weight="fill" /> : canClaim ? <Gift size={20} weight="fill" className="ef-anim-pulse-glow" /> : <Trophy size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: isCompleted ? colors.textMuted : colors.text }}>
                                        {c.title}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                        {c.desc}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ 
                                    fontSize: '0.7rem', 
                                    color: colors.warning, 
                                    fontFamily: 'var(--font-mono)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: '#1B4332',
                                    padding: '2px 6px',
                                    }}>
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
                                            fontFamily: 'var(--font-mono)',
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
