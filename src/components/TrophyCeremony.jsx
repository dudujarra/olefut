import React, { useEffect, useState } from 'react';
import { EfButton } from './ui/EfButton';

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

    useEffect(() => {
        if (!visible) { setPhase(0); return; }
        // Phase progression: 0→1 (500ms) → 2 (2000ms) → 3 (4000ms)
        const t1 = setTimeout(() => setPhase(1), 500);
        const t2 = setTimeout(() => setPhase(2), 2500);
        const t3 = setTimeout(() => setPhase(3), 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [visible]);

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
        <div className="trophy-ceremony-overlay ef-art-champion-celebration ef-art-bg"
             role="dialog" aria-label="Cerimônia de troféu"
             style={{ background: 'rgba(0,0,0,0.9)' }}>
            {/* Phase 0-1: Trophy reveal */}
            {phase >= 1 && (
                <div className="trophy-reveal ef-anim-pop-in" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img 
                        src={getTrophyImage(trophy)} 
                        alt={trophy.name}
                        className="ef-anim-shake"
                        style={{ 
                            width: '240px', 
                            height: '240px', 
                            objectFit: 'contain', 
                            imageRendering: 'pixelated',
                            filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
                            marginBottom: '1rem'
                        }} 
                    />
                    <h1 className="trophy-title" style={{ fontFamily: "'Press Start 2P', monospace", color: '#FFD700', textShadow: '3px 3px 0 #000' }}>🏆 {trophy.name}</h1>
                    <p className="trophy-subtitle" style={{ fontFamily: "'Press Start 2P', monospace", color: '#FFF', fontSize: '0.8rem' }}>Temporada {season?.year || '—'}</p>
                </div>
            )}

            {/* Phase 2: Season stats */}
            {phase >= 2 && season && (
                <div className="trophy-stats ef-anim-slide-up" style={{ background: '#1E2124', border: '4px solid', borderColor: '#4A5059 #111417 #111417 #4A5059', padding: '16px', marginTop: '24px', boxShadow: '0 16px 0 rgba(0,0,0,0.8)', maxWidth: '400px', width: '100%', margin: '24px auto 0' }}>
                    <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: "'Outfit', sans-serif" }}>
                        <div className="stat-item" style={{ background: '#111', padding: '8px', border: '2px solid #333' }}>
                            <span className="stat-label" style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>Vitórias</span>
                            <span className="stat-value" style={{ color: '#4ADE80', fontSize: '1.2rem', fontWeight: 'bold' }}>{season.wins || 0}</span>
                        </div>
                        <div className="stat-item" style={{ background: '#111', padding: '8px', border: '2px solid #333' }}>
                            <span className="stat-label" style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>Empates</span>
                            <span className="stat-value" style={{ color: '#FACC15', fontSize: '1.2rem', fontWeight: 'bold' }}>{season.draws || 0}</span>
                        </div>
                        <div className="stat-item" style={{ background: '#111', padding: '8px', border: '2px solid #333' }}>
                            <span className="stat-label" style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>Derrotas</span>
                            <span className="stat-value" style={{ color: '#F87171', fontSize: '1.2rem', fontWeight: 'bold' }}>{season.losses || 0}</span>
                        </div>
                        <div className="stat-item" style={{ background: '#111', padding: '8px', border: '2px solid #333' }}>
                            <span className="stat-label" style={{ color: '#888', display: 'block', fontSize: '0.8rem' }}>Gols</span>
                            <span className="stat-value" style={{ color: '#FFF', fontSize: '1.2rem', fontWeight: 'bold' }}>{season.goalsFor || 0} : {season.goalsAgainst || 0}</span>
                        </div>
                    </div>
                    {season.topScorer && (
                        <p className="top-scorer" style={{ marginTop: '16px', color: '#FFD700', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>⚽ Artilheiro: {season.topScorer.name} ({season.topScorer.goals} gols)</p>
                    )}
                </div>
            )}

            {/* Phase 3: Hall of Fame entry + dismiss */}
            {phase >= 3 && (
                <div className="trophy-hall ef-anim-fade-in" style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p className="hall-text" style={{ fontFamily: "'Press Start 2P', monospace", color: '#FFD700', fontSize: '0.7rem', marginBottom: '16px' }}>📜 Registrado no Hall da Fama</p>
                    <EfButton
                        variant="primary"
                        onClick={onDismiss}
                        aria-label="Fechar cerimônia"
                        id="trophy-dismiss-btn"
                        className="ef-anim-pulse-glow"
                    >
                        CONTINUAR
                    </EfButton>
                </div>
            )}

            {/* Crowd atmosphere */}
            <div className="trophy-crowd">
                <div className="ef-anim-crowd-wave" />
                <div className="ef-anim-crowd-flag-wave" style={{ marginLeft: '2rem' }} />
            </div>
        </div>
    );
}
