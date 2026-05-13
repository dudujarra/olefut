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
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';

import gameLogo from '../assets/shields/olefut_main_logo.png';

import {
    User, SoccerBall, Globe, ChartLineDown, MapPin,
    Lightning, GraduationCap, Robot
} from '@phosphor-icons/react';

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
            <div className="ef-start-stack">
                <div className="ef-start-logo-wrap">
                    <img
                        src={gameLogo}
                        alt="OléFUT Logo"
                        className="ef-start-logo"
                    />
                    <h1 className="ef-start-title">OléFUT</h1>
                    <p className="ef-start-subtitle">Arcade Manager RPG</p>
                </div>

                <EfPanel padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Modo de Jogo */}
                    <div className="ef-h-flex-gap-md">
                        <EfButton
                            variant={mode === 'manager' ? 'primary' : 'secondary'}
                            onClick={() => setMode('manager')}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            <User size={20} weight={mode === 'manager' ? 'fill' : 'regular'} /> TREINADOR
                        </EfButton>
                        <EfButton
                            variant={mode === 'player' ? 'primary' : 'secondary'}
                            onClick={() => setMode('player')}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            <SoccerBall size={20} weight={mode === 'player' ? 'fill' : 'regular'} /> JOGADOR
                        </EfButton>
                    </div>

                    {/* Nome */}
                    <div>
                        <input
                            id="input-name"
                            type="text"
                            placeholder={mode === 'manager' ? "NOME DO TREINADOR" : "NOME DO JOGADOR"}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="ef-start-input"
                        />
                    </div>

                    {mode === 'player' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                            <div>
                                <div className="ef-start-field-label">PERSONALIDADE:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {Object.entries(PERSONALITIES).map(([key, p]) => (
                                        <EfButton
                                            key={key}
                                            size="sm"
                                            variant={personality === key ? 'primary' : 'secondary'}
                                            onClick={() => setPersonality(key)}
                                            title={p.description}
                                            style={{ justifyContent: 'center', fontSize: '0.85rem' }}
                                        >
                                            {p.name}
                                        </EfButton>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'manager' && (
                        <div>
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

                    {/* Seleção de Time */}
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

                    {/* Dificuldade */}
                    <div>
                        <div className="ef-start-field-label">
                            DIFICULDADE DO MOTOR SIMULADOR:
                        </div>
                        <div className="ef-h-flex-gap-sm">
                            {Object.values(DIFFICULTY_MODES).map(d => (
                                <EfButton
                                    key={d.id}
                                    size="sm"
                                    variant={difficulty === d.id ? 'primary' : 'secondary'}
                                    onClick={() => { setDifficulty(d.id); setDifficultyState(d.id); }}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    title={d.description}
                                >
                                    {d.id.toUpperCase()}
                                </EfButton>
                            ))}
                        </div>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <EfButton
                            id="btn-start"
                            variant="primary"
                            size="lg"
                            onClick={handleStart}
                            disabled={!name.trim() || !teamId}
                            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                        >
                            <Lightning size={24} weight="fill" /> COMEÇAR CARREIRA
                        </EfButton>

                        <div className="ef-h-flex-gap-md">
                            {!isTutorialDone() && (
                                <EfButton
                                    variant="secondary"
                                    size="md"
                                    onClick={() => changeView('tutorial')}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    <GraduationCap size={20} /> TUTORIAL
                                </EfButton>
                            )}
                            <EfButton
                                variant="secondary"
                                size="md"
                                onClick={handleAutoPlay}
                                style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                title="Inicia bot AutoPlay"
                            >
                                <Robot size={20} /> AUTOPLAY
                            </EfButton>
                        </div>
                    </div>

                </EfPanel>
            </div>
        </div>
    );
}

export default StartView;
