import React, { useEffect, useState } from 'react';

/**
 * §16.2: TrophyCeremony — Full-screen overlay for season-ending celebrations.
 *
 * Triggered by SeasonProcessor when manager wins a title.
 * Shows trophy animation, season stats, and hall-of-fame entry.
 *
 * Props:
 *   - trophy: { type: 'league'|'cup'|'continental', name: 'Brasileirão', tier: 1 }
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

    const trophyClass = trophy.tier <= 2
        ? `ef-trophy-tier-${trophy.tier}`
        : 'ef-trophy-cup-domestic';

    return (
        <div className="trophy-ceremony-overlay ef-art-champion-celebration ef-art-bg"
             role="dialog" aria-label="Cerimônia de troféu">
            {/* Phase 0-1: Trophy reveal */}
            {phase >= 1 && (
                <div className="trophy-reveal ef-anim-pop-in" aria-live="polite">
                    <div className={`ef-anim-trophy-unlock`} />
                    <h1 className="trophy-title ef-anim-shake">🏆 {trophy.name}</h1>
                    <p className="trophy-subtitle">Temporada {season?.year || '—'}</p>
                </div>
            )}

            {/* Phase 2: Season stats */}
            {phase >= 2 && season && (
                <div className="trophy-stats ef-anim-slide-up">
                    <div className="stat-grid">
                        <div className="stat-item">
                            <span className="stat-label">Vitórias</span>
                            <span className="stat-value" data-form="good">{season.wins || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Empates</span>
                            <span className="stat-value" data-form="neutral">{season.draws || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Derrotas</span>
                            <span className="stat-value" data-form="bad">{season.losses || 0}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Gols</span>
                            <span className="stat-value">{season.goalsFor || 0} : {season.goalsAgainst || 0}</span>
                        </div>
                    </div>
                    {season.topScorer && (
                        <p className="top-scorer">⚽ Artilheiro: {season.topScorer.name} ({season.topScorer.goals} gols)</p>
                    )}
                </div>
            )}

            {/* Phase 3: Hall of Fame entry + dismiss */}
            {phase >= 3 && (
                <div className="trophy-hall ef-anim-fade-in">
                    <p className="hall-text">📜 Registrado no Hall da Fama</p>
                    <button
                        className="ef-btn ef-btn--primary ef-anim-pulse-glow"
                        onClick={onDismiss}
                        aria-label="Fechar cerimônia"
                        id="trophy-dismiss-btn"
                    >
                        Continuar
                    </button>
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
