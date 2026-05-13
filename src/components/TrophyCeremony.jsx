import { useEffect, useState } from 'react';
import { EfButton, EfPanel } from './ui';
import bgTrophyCeremony from '../assets/environments/bg_trophy_ceremony.png';
import '../styles/trophy-ceremony.css';
import {
    Trophy, Medal, SoccerBall, HandsClapping, ArrowRight, MedalMilitary, Cpu
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
 * AKITA-385 (Stitch v1.1 port): re-skinned visual layer (header AppBar,
 * victory title, "1st PLACE" badge, CRT scanline overlay, dominance meter,
 * arcade-blink continue cursor, ambient corner labels). Logic preserved.
 *
 * Props:
 *   - trophy: { type: 'league'|'cup'|'continental'|'world'|'top_scorer'|'top_assist'|'manager_year',
 *               name: string, tier: 1|2|3|4 }
 *   - season: { year, wins, draws, losses, goalsFor, goalsAgainst, topScorer }
 *   - team:   { name?: string } (optional — used only for stats subtitle)
 *   - onDismiss: callback to close ceremony
 *   - visible: boolean
 */
export default function TrophyCeremony({ trophy, team, season, onDismiss, visible }) {
    const [phase, setPhase] = useState(0); // 0=enter, 1=trophy, 2=stats, 3=hall

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

    // Stitch subtitle ("Série A — OléFUT") derived from trophy data.
    const subtitle = trophy.name
        ? `${trophy.name}${team?.name ? ` — ${team.name}` : ''}`
        : 'OléFUT';

    // Dominance meter: percentual de pontos conquistados sobre o máximo possível.
    // Fallback elegante quando faltam dados.
    const totalGames = (season?.wins || 0) + (season?.draws || 0) + (season?.losses || 0);
    const points = (season?.wins || 0) * 3 + (season?.draws || 0);
    const dominance = totalGames > 0
        ? Math.round((points / (totalGames * 3)) * 100)
        : 0;

    return (
        <div className="trophy-ceremony-overlay ef-art-champion-celebration ef-trophy-shell"
             role="dialog" aria-label="Cerimônia de troféu"
             style={{ backgroundImage: `url(${bgTrophyCeremony})` }}>

            {/* CRT scanline + confetti + vignette layers (Stitch v1.1) */}
            <div className="ef-trophy-ceremony__crt-overlay" aria-hidden="true" />
            <div className="ef-trophy-ceremony__confetti-overlay" aria-hidden="true" />
            <div className="ef-trophy-ceremony__vignette" aria-hidden="true" />

            {/* Top AppBar */}
            <header className="ef-trophy-ceremony__appbar">
                <h2 className="ef-trophy-ceremony__appbar-title">TROPHY ROOM</h2>
            </header>

            <main className="ef-trophy-ceremony__main">

                {/* Victory Title (Stitch) — sempre visível */}
                <div className="ef-trophy-ceremony__victory-title">
                    <h1>CAMPEÃO</h1>
                    <p>{subtitle}</p>
                </div>

                {/* Phase 0-1: Trophy reveal */}
                {phase >= 1 && (
                    <div className="trophy-reveal ef-anim-pop-in ef-trophy-ceremony__reveal" aria-live="polite">
                        <div className="ef-trophy-reveal-wrap">
                            <div className="ef-trophy-pulse-bg" />
                            <img
                                src={getTrophyImage(trophy)}
                                alt={trophy.name}
                                className="ef-anim-shake ef-trophy-image"
                            />
                            <div className="ef-trophy-ceremony__badge">
                                <MedalMilitary size={16} weight="fill" />
                                <span>1º LUGAR</span>
                            </div>
                        </div>

                        <div className="ef-trophy-banner">
                            <div className="ef-trophy-banner__title-row">
                                <Trophy size={32} color="var(--accent)" weight="fill" />
                                <h1 className="ef-trophy-banner__title">
                                    {trophy.name}
                                </h1>
                                <Trophy size={32} color="var(--accent)" weight="fill" />
                            </div>
                            <div className="ef-trophy-banner__sub">
                                CAMPEÃO — TEMPORADA {season?.year || '—'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 2: Season stats */}
                {phase >= 2 && season && (
                    <div className="trophy-stats ef-anim-slide-up ef-trophy-stats">
                        <EfPanel padding="lg" className="ef-trophy-stats__panel ef-trophy-ceremony__stats-frame">
                            <div className="ef-trophy-ceremony__stats-tag">
                                TEMPORADA {season.year || '—'}
                            </div>
                            <div className="ef-trophy-stats__header">
                                ESTATÍSTICAS DA CAMPANHA
                            </div>

                            <div className="ef-trophy-stats__grid">
                                <div className="ef-trophy-stat-cell">
                                    <div className="ef-trophy-stat-cell__label">VITÓRIAS</div>
                                    <div className="ef-trophy-stat-cell__value ef-trophy-stat-cell__value--primary">{season.wins || 0}</div>
                                </div>
                                <div className="ef-trophy-stat-cell">
                                    <div className="ef-trophy-stat-cell__label">EMPATES</div>
                                    <div className="ef-trophy-stat-cell__value ef-trophy-stat-cell__value--accent">{season.draws || 0}</div>
                                </div>
                                <div className="ef-trophy-stat-cell">
                                    <div className="ef-trophy-stat-cell__label">DERROTAS</div>
                                    <div className="ef-trophy-stat-cell__value ef-trophy-stat-cell__value--danger">{season.losses || 0}</div>
                                </div>
                                <div className="ef-trophy-stat-cell">
                                    <div className="ef-trophy-stat-cell__label">GOLS</div>
                                    <div className="ef-trophy-stat-cell__goals">
                                        <span className="ef-trophy-ceremony__goals-for">{season.goalsFor || 0}</span>
                                        <span className="ef-trophy-stat-cell__goals-sep">:</span>
                                        <span className="ef-trophy-ceremony__goals-against">{season.goalsAgainst || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dominance meter (Stitch) */}
                            <div className="ef-trophy-ceremony__meter" aria-label={`Domínio da liga: ${dominance}%`}>
                                <div className="ef-trophy-ceremony__meter-row">
                                    <span>DOMÍNIO DA LIGA</span>
                                    <span>{dominance}%</span>
                                </div>
                                <div
                                    className="ef-trophy-ceremony__meter-track"
                                    role="progressbar"
                                    aria-valuenow={dominance}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className="ef-trophy-ceremony__meter-fill"
                                        style={{ width: `${dominance}%` }}
                                    />
                                </div>
                            </div>

                            {season.topScorer && (
                                <div className="ef-trophy-topscorer">
                                    <SoccerBall size={20} weight="fill" /> ARTILHEIRO DO TIME: {season.topScorer.name} ({season.topScorer.goals} GOLS)
                                </div>
                            )}
                        </EfPanel>
                    </div>
                )}

                {/* Phase 3: Hall of Fame entry + dismiss */}
                {phase >= 3 && (
                    <div className="trophy-hall ef-anim-fade-in ef-trophy-hall">
                        <div className="ef-trophy-hall__badge">
                            <Medal size={20} weight="fill" /> REGISTRADO NO HALL DA FAMA DA SUA CARREIRA
                        </div>
                        <EfButton
                            className="ef-trophy-ceremony__continue-button"
                            variant="primary"
                            size="lg"
                            onClick={onDismiss}
                            aria-label="Fechar cerimônia"
                        >
                            CONTINUAR <ArrowRight weight="bold" />
                            <span className="ef-trophy-ceremony__continue-cursor" aria-hidden="true" />
                        </EfButton>
                    </div>
                )}

            </main>

            {/* Ambient corner labels */}
            <div className="ef-trophy-ceremony__ambient ef-trophy-ceremony__ambient--left" aria-hidden="true">
                <SoccerBall size={14} weight="fill" />
                <span>OLÉFUT ENGINE v2.0</span>
            </div>
            <div className="ef-trophy-ceremony__ambient ef-trophy-ceremony__ambient--right" aria-hidden="true">
                <span>BIT-MODE: 32</span>
                <Cpu size={14} weight="fill" />
            </div>

            {/* Crowd atmosphere */}
            <div className="trophy-crowd ef-trophy-crowd">
                <HandsClapping size={64} weight="duotone" color="var(--text-main)" className="ef-anim-crowd-wave ef-trophy-ceremony__crowd-clap" />
                <HandsClapping size={64} weight="duotone" color="var(--text-main)" className="ef-anim-crowd-flag-wave ef-trophy-ceremony__crowd-clap--delayed-500" />
                <HandsClapping size={64} weight="duotone" color="var(--text-main)" className="ef-anim-crowd-wave ef-trophy-ceremony__crowd-clap--delayed-200" />
                <HandsClapping size={64} weight="duotone" color="var(--text-main)" className="ef-anim-crowd-flag-wave ef-trophy-ceremony__crowd-clap--delayed-700" />
            </div>
        </div>
    );
}
