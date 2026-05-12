import { useEffect, useState } from 'react';
import { EfButton, EfPanel } from './ui';
import bgTrophyCeremony from '../assets/environments/bg_trophy_ceremony.png';
import { 
    Trophy, Medal, SoccerBall, Check, HandsClapping, ArrowRight
} from '@phosphor-icons/react';

import imgWorldCup from '../assets/trophies/continental.png'; // world cup uses continental as placeholder until dedicated asset
import imgContinentalCup from '../assets/trophies/continental.png';
import imgSerieA from '../assets/trophies/serie_a.png';
import imgGoldCup from '../assets/trophies/cup.png';
import imgSilverCup from '../assets/trophies/serie_b.png';
import imgShield from '../assets/trophies/supercopa.png';
import imgScorer from '../assets/trophies/golden_boot.png';
import imgAssist from '../assets/trophies/golden_boot.png'; // shares golden_boot until dedicated assist asset
import imgManager from '../assets/trophies/best_manager.png';

/**
 * §16.2: TrophyCeremony — Full-screen overlay for season-ending celebrations.
 *
 * Triggered by SeasonProcessor when manager wins a title.
 * Shows trophy animation, season stats, and hall-of-fame entry.
 *
 * Props:
 *   - trophy: { type: 'league'|'cup'|'continental'|'world', name: 'Brasileirão', tier: 1 }
 *   - season: { year, wins, draws, losses, goalsFor, goalsAgainst, topScorer }
 *   - onDismiss: callback to close ceremony
 *   - visible: boolean
 */
export default function TrophyCeremony({ trophy, season, onDismiss, visible }) {
    const [phase, setPhase] = useState(0); // 0=enter, 1=trophy, 2=stats, 3=hall

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

    // BUG-081 (SPEC-158): aceitável — animation timeline com setTimeouts encadeados.
    // Phase progression é side effect temporal puro; useMemo não modela tempo.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!visible) { setPhase(0); return; }
        // Phase progression: 0→1 (500ms) → 2 (2000ms) → 3 (4000ms)
        const t1 = setTimeout(() => setPhase(1), 500);
        const t2 = setTimeout(() => setPhase(2), 2500);
        const t3 = setTimeout(() => setPhase(3), 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [visible]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!visible || !trophy) return null;

    const getTrophyImage = (t) => {
        if (!t) return imgShield;
        const name = (t.name || '').toLowerCase();
        const type = t.type || 'league';
        const tier = t.tier || 1;

        if (name.includes('mundial') || type === 'world') return imgWorldCup;
        if (name.includes('continental') || name.includes('libertadores') || type === 'continental') return imgContinentalCup;
        
        if (type === 'cup') {
            return tier === 1 ? imgGoldCup : imgSilverCup;
        }

        if (type === 'league') {
            if (tier === 1) return imgSerieA;
            if (tier === 2) return imgSilverCup;
            return imgShield;
        }

        if (type === 'top_scorer') return imgScorer;
        if (type === 'top_assist') return imgAssist;
        if (type === 'manager_year') return imgManager;

        return imgGoldCup;
    };

    return (
        <div className="trophy-ceremony-overlay ef-art-champion-celebration"
             role="dialog" aria-label="Cerimônia de troféu"
             style={{ 
                 background: `url(${bgTrophyCeremony})`,
                 backgroundColor: '#111417',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 imageRendering: 'pixelated',
                 position: 'fixed',
                 top: 0, left: 0, right: 0, bottom: 0,
                 zIndex: 9999,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 padding: '24px',
                 fontFamily: 'var(--font-sans)',
                 color: colors.text
             }}>
            {/* Phase 0-1: Trophy reveal */}
            {phase >= 1 && (
                <div className="trophy-reveal ef-anim-pop-in" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            position: 'absolute',
                            width: '300px', height: '300px',
                            background: '#1B4332',
                            zIndex: -1,
                            animation: 'pulse-glow 2s infinite alternate'
                        }} />
                        <img 
                            src={getTrophyImage(trophy)} 
                            alt={trophy.name}
                            className="ef-anim-shake"
                            style={{ 
                                width: '240px', 
                                height: '240px', 
                                objectFit: 'contain', 
                                imageRendering: 'pixelated',
                                filter: 'drop-shadow(0 10px 20px #1B4332)'
                            }} 
                        />
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#111417',
                        padding: '16px 32px',
                        border: `1px solid ${colors.warning}`,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Trophy size={32} color={colors.warning} weight="fill" />
                            <h1 style={{ margin: 0, fontSize: '2rem', color: colors.warning, fontWeight: '900', textTransform: 'uppercase' }}>
                                {trophy.name}
                            </h1>
                            <Trophy size={32} color={colors.warning} weight="fill" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: colors.text, fontWeight: 'bold' }}>
                            CAMPEÃO — TEMPORADA {season?.year || '—'}
                        </div>
                    </div>
                </div>
            )}

            {/* Phase 2: Season stats */}
            {phase >= 2 && season && (
                <div className="trophy-stats ef-anim-slide-up" style={{ marginTop: '32px', width: '100%', maxWidth: '600px' }}>
                    <EfPanel padding="lg" style={{ 
                        border: `1px solid ${colors.border}`,
                        backgroundColor: '#111417',
                        }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px', fontFamily: 'var(--font-mono)', color: colors.secondary, fontWeight: 'bold' }}>
                            ESTATÍSTICAS DA CAMPANHA
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <div style={{ backgroundColor: colors.bg, padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>VITÓRIAS</div>
                                <div style={{ fontSize: '1.5rem', color: colors.accent, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{season.wins || 0}</div>
                            </div>
                            <div style={{ backgroundColor: colors.bg, padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>EMPATES</div>
                                <div style={{ fontSize: '1.5rem', color: colors.warning, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{season.draws || 0}</div>
                            </div>
                            <div style={{ backgroundColor: colors.bg, padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>DERROTAS</div>
                                <div style={{ fontSize: '1.5rem', color: colors.danger, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{season.losses || 0}</div>
                            </div>
                            <div style={{ backgroundColor: colors.bg, padding: '12px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>GOLS</div>
                                <div style={{ fontSize: '1.2rem', color: colors.text, fontWeight: 'bold', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '36px' }}>
                                    <span style={{ color: colors.accent }}>{season.goalsFor || 0}</span>
                                    <span style={{ margin: '0 4px', color: colors.border }}>:</span>
                                    <span style={{ color: colors.danger }}>{season.goalsAgainst || 0}</span>
                                </div>
                            </div>
                        </div>
                        
                        {season.topScorer && (
                            <div style={{ 
                                marginTop: '16px', 
                                backgroundColor: '#1B4332', 
                                border: `1px dashed ${colors.warning}`, 
                                padding: '12px', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: colors.warning,
                                fontWeight: 'bold'
                            }}>
                                <SoccerBall size={20} weight="fill" /> ARTILHEIRO DO TIME: {season.topScorer.name} ({season.topScorer.goals} GOLS)
                            </div>
                        )}
                    </EfPanel>
                </div>
            )}

            {/* Phase 3: Hall of Fame entry + dismiss */}
            {phase >= 3 && (
                <div className="trophy-hall ef-anim-fade-in" style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontFamily: 'var(--font-mono)', 
                        color: colors.warning, 
                        fontSize: '0.9rem',
                        backgroundColor: '#040805',
                        padding: '8px 16px',
                        }}>
                        <Medal size={20} weight="fill" /> REGISTRADO NO HALL DA FAMA DA SUA CARREIRA
                    </div>
                    <EfButton
                        variant="primary"
                        size="lg"
                        onClick={onDismiss}
                        aria-label="Fechar cerimônia"
                        style={{ padding: '16px 48px', fontSize: '1.2rem', display: 'flex', gap: '12px' }}
                    >
                        CONTINUAR <ArrowRight weight="bold" />
                    </EfButton>
                </div>
            )}

            {/* Crowd atmosphere */}
            <div className="trophy-crowd" style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '48px', pointerEvents: 'none' }}>
                <HandsClapping size={64} weight="duotone" color={colors.text} className="ef-anim-crowd-wave" />
                <HandsClapping size={64} weight="duotone" color={colors.text} className="ef-anim-crowd-flag-wave" style={{ animationDelay: '0.5s' }} />
                <HandsClapping size={64} weight="duotone" color={colors.text} className="ef-anim-crowd-wave" style={{ animationDelay: '0.2s' }} />
                <HandsClapping size={64} weight="duotone" color={colors.text} className="ef-anim-crowd-flag-wave" style={{ animationDelay: '0.7s' }} />
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-glow {
                    0% { transform: scale(0.9); ; }
                    100% { transform: scale(1.1); ; }
                }
            `}} />
        </div>
    );
}
