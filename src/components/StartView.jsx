import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RealDB } from '../engine/db/index';
import { PERSONALITIES } from '../engine/PlayerCareer';
// AKITA-105: inline para evitar puxar TutorialView (heavy) ao chunk inicial
// via StartView (eager). Vite emitia INEFFECTIVE_DYNAMIC_IMPORT.
const isTutorialDone = () => {
    try { return localStorage.getItem('olefut_tutorial_done') !== null; } catch { return false; }
};
import { DIFFICULTY_MODES, getDifficulty, setDifficulty } from '../engine/systems/DifficultyModes';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfButton } from './ui/EfButton';

import gameLogo from '../assets/shields/olefut_main_logo.png';

import {
    User, SoccerBall, MapPin,
    Lightning, GraduationCap, Robot, Star
} from '@phosphor-icons/react';

/**
 * StartView — Stitch v1.1 SNES Start Screen port (AKITA-397)
 * Match: docs/stitch-designs/v1.1-all/31-ol-fut-start-screen-snes-style.html
 *
 * Preserves all start logic (new game / tutorial / autoplay handlers, mode select,
 * scenario/personality/team/difficulty pickers, IDs #input-name #select-team #btn-start
 * #select-scenario #select-position consumed by e2e suite).
 */
export function StartView() {
    const { startGame, changeView } = useGame();
    const [name, setName] = useState('');
    const [scenario, setScenario] = useState('livre');
    const [teamId, setTeamId] = useState('');
    const [mode, setMode] = useState('manager');
    const [position, setPosition] = useState('ATA');
    const [personality, setPersonality] = useState('maverick');
    const [difficulty, setDifficultyState] = useState(getDifficulty().id);

    // Build team list from RealDB
    const allTeams = [];
    let idCounter = 1;
    for (const zone of Object.keys(RealDB)) {
        for (const div of Object.keys(RealDB[zone])) {
            RealDB[zone][div].forEach(club => {
                allTeams.push({ id: idCounter++, name: club.name, zone, div: parseInt(div) });
            });
        }
    }

    const handleStart = () => {
        if (!name.trim() || !teamId) return;
        startGame(name, parseInt(teamId), scenario, mode, position, personality);
    };

    const handleAutoPlay = () => {
        changeView('autoplay');
    };

    const selectedTeamName = allTeams.find(t => t.id === parseInt(teamId))?.name;

    return (
        <div className="ef-start-shell">
            {/* SNES pitch background — center circle + midline */}
            <div className="ef-start-pitch-circle" aria-hidden="true" />
            <div className="ef-start-pitch-midline" aria-hidden="true" />

            {/* Corner brackets */}
            <div className="ef-start-bracket ef-start-bracket--tl" aria-hidden="true" />
            <div className="ef-start-bracket ef-start-bracket--tr" aria-hidden="true" />
            <div className="ef-start-bracket ef-start-bracket--bl" aria-hidden="true" />
            <div className="ef-start-bracket ef-start-bracket--br" aria-hidden="true" />

            {/* Side data strips */}
            <div className="ef-start-strip ef-start-strip--left" aria-hidden="true">
                <div className="ef-start-strip-bar ef-start-strip-bar--32" />
                <div className="ef-start-strip-bar ef-start-strip-bar--accent ef-start-strip-bar--8" />
                <div className="ef-start-strip-bar ef-start-strip-bar--16" />
            </div>
            <div className="ef-start-strip ef-start-strip--right" aria-hidden="true">
                <div className="ef-start-strip-bar ef-start-strip-bar--16" />
                <div className="ef-start-strip-bar ef-start-strip-bar--accent ef-start-strip-bar--8" />
                <div className="ef-start-strip-bar ef-start-strip-bar--32" />
            </div>

            <div className="ef-start-stack">
                {/* Hero — stars + logo + title + FOOTBALL MANAGER banner */}
                <header className="ef-start-hero">
                    <div className="ef-start-stars">
                        <Star size={26} weight="fill" />
                        <Star size={34} weight="fill" />
                        <Star size={34} weight="fill" />
                        <Star size={26} weight="fill" />
                    </div>

                    <div className="ef-start-logo-wrap">
                        <img
                            src={gameLogo}
                            alt="OléFUT Logo"
                            className="ef-start-logo"
                        />
                        <h1 className="ef-start-title">OléFUT</h1>
                        <div className="ef-start-subtitle-banner">
                            <h2 className="ef-start-subtitle">FOOTBALL MANAGER</h2>
                        </div>
                    </div>
                </header>

                {/* Menu / form embutido */}
                <section className="ef-start-menu" aria-label="Configuração de carreira">
                    {/* Modo de Jogo (TREINADOR / JOGADOR) */}
                    <div className="ef-start-mode-row">
                        <EfButton
                            variant={mode === 'manager' ? 'primary' : 'secondary'}
                            onClick={() => setMode('manager')}
                        >
                            <User size={20} weight={mode === 'manager' ? 'fill' : 'regular'} /> TREINADOR
                        </EfButton>
                        <EfButton
                            variant={mode === 'player' ? 'primary' : 'secondary'}
                            onClick={() => setMode('player')}
                        >
                            <SoccerBall size={20} weight={mode === 'player' ? 'fill' : 'regular'} /> JOGADOR
                        </EfButton>
                    </div>

                    {/* Nome */}
                    <div className="ef-start-field">
                        <input
                            id="input-name"
                            type="text"
                            placeholder={mode === 'manager' ? 'NOME DO TREINADOR' : 'NOME DO JOGADOR'}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="ef-start-input"
                        />
                    </div>

                    {/* Position + personality (player mode only) */}
                    {mode === 'player' && (
                        <>
                            <div className="ef-start-field">
                                <select
                                    id="select-position"
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    className="ef-start-select"
                                >
                                    <option value="GOL">Goleiro (GOL)</option>
                                    <option value="DEF">Zagueiro (DEF)</option>
                                    <option value="MEI">Meio-Campista (MEI)</option>
                                    <option value="ATA">Atacante (ATA)</option>
                                </select>
                            </div>

                            <div className="ef-start-field">
                                <p className="ef-start-field-label">PERSONALIDADE:</p>
                                <div className="ef-start-personality-grid">
                                    {Object.entries(PERSONALITIES).map(([key, p]) => (
                                        <EfButton
                                            key={key}
                                            size="sm"
                                            variant={personality === key ? 'primary' : 'secondary'}
                                            onClick={() => setPersonality(key)}
                                            title={p.description}
                                        >
                                            {p.name}
                                        </EfButton>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Scenario (manager only) */}
                    {mode === 'manager' && (
                        <div className="ef-start-field">
                            <select
                                id="select-scenario"
                                value={scenario}
                                onChange={e => setScenario(e.target.value)}
                                className="ef-start-select"
                            >
                                <option value="livre">Sandbox (Livre)</option>
                                <option value="fallen">Gigante Caído (Orçamento -90%)</option>
                            </select>
                        </div>
                    )}

                    {/* Team selector */}
                    <div className="ef-start-team-row">
                        <MapPin size={24} color="var(--info)" />
                        <select
                            id="select-team"
                            value={teamId}
                            onChange={e => setTeamId(e.target.value)}
                        >
                            <option value="" disabled>SELECIONE O CLUBE...</option>
                            {allTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.zone} - Div {t.div})</option>
                            ))}
                        </select>
                        {selectedTeamName && (
                            <div className="ef-start-team-badge">
                                <EfClubBadge name={selectedTeamName} size="md" />
                            </div>
                        )}
                    </div>

                    {/* Difficulty */}
                    <div className="ef-start-field">
                        <p className="ef-start-field-label">DIFICULDADE DO MOTOR SIMULADOR:</p>
                        <div className="ef-start-diff-row">
                            {Object.values(DIFFICULTY_MODES).map(d => (
                                <EfButton
                                    key={d.id}
                                    size="sm"
                                    variant={difficulty === d.id ? 'primary' : 'secondary'}
                                    onClick={() => { setDifficulty(d.id); setDifficultyState(d.id); }}
                                    title={d.description}
                                >
                                    {d.id.toUpperCase()}
                                </EfButton>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="ef-start-actions">
                        <EfButton
                            id="btn-start"
                            variant="primary"
                            size="lg"
                            onClick={handleStart}
                            disabled={!name.trim() || !teamId}
                            className="ef-start-cta"
                        >
                            <Lightning size={24} weight="fill" /> COMEÇAR CARREIRA
                        </EfButton>

                        <div className="ef-start-action-row">
                            {!isTutorialDone() && (
                                <EfButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => changeView('tutorial')}
                                >
                                    <GraduationCap size={20} /> TUTORIAL
                                </EfButton>
                            )}
                            <EfButton
                                variant="danger"
                                size="md"
                                onClick={handleAutoPlay}
                                title="Inicia bot AutoPlay"
                            >
                                <Robot size={20} /> AUTOPLAY
                            </EfButton>
                        </div>
                    </div>
                </section>

                {/* Footer prompt + credits */}
                <footer className="ef-start-footer">
                    <p className="ef-start-press">PRESS START BUTTON</p>
                    <p className="ef-start-credits">© 1995 PIXEL PITCH INTERACTIVE</p>
                    <div className="ef-start-swatch-row" aria-hidden="true">
                        <div className="ef-start-swatch ef-start-swatch--primary" />
                        <div className="ef-start-swatch ef-start-swatch--accent" />
                        <div className="ef-start-swatch ef-start-swatch--pitch" />
                        <div className="ef-start-swatch ef-start-swatch--forest" />
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default StartView;
