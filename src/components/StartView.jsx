import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RealDB } from '../engine/db/index';
import { PERSONALITIES } from '../engine/PlayerCareer';
import { isTutorialDone } from './TutorialView';
import { DIFFICULTY_MODES, getDifficulty, setDifficulty } from '../engine/systems/DifficultyModes';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';

import gameLogo from '../assets/shields/olefut_main_logo.png';
import bgStadium from '../assets/environments/bg_match_stadium.png';

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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgStadium})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
                maxWidth: '500px',
                width: '100%',
                margin: '0 auto'
            }}>
                <div className="ef-anim-slide-down" style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <img 
                        src={gameLogo} 
                        alt="OléFUT Logo" 
                        style={{
                            width: '240px', 
                            height: '240px', 
                            borderRadius: '16px', 
                            boxShadow: '0 16px 32px rgba(0,0,0,0.6), 0 0 0 4px var(--ef-bevel-dark)',
                            imageRendering: 'pixelated',
                            background: 'var(--ef-color-neutral-bg)'
                        }} 
                    />
                    <h1 style={{
                        marginTop: '16px',
                        marginBottom: '0',
                        fontSize: '24px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--ef-color-neutral-text-hi)',
                        textShadow: '2px 2px 0 #000'
                    }}>
                        OléFUT
                    </h1>
                    <p style={{
                        marginTop: '8px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--ef-color-grass-300)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textShadow: '1px 1px 0 #000'
                    }}>
                        Arcade Manager RPG
                    </p>
                </div>

                <EfPanel variant="elev" padding="lg" className="ef-anim-slide-up">
                    
                    {/* Modo de Jogo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                        <EfButton 
                            variant={mode === 'manager' ? 'primary' : 'ghost'} 
                            onClick={() => setMode('manager')}
                            style={{ justifyContent: 'center' }}
                        >
                            🧑‍💼 Treinador
                        </EfButton>
                        <EfButton 
                            variant={mode === 'player' ? 'secondary' : 'ghost'} 
                            onClick={() => setMode('player')}
                            style={{ justifyContent: 'center' }}
                        >
                            ⚽ Jogador
                        </EfButton>
                    </div>

                    {/* Nome */}
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            id="input-name" 
                            type="text" 
                            placeholder={mode === 'manager' ? "NOME DO TREINADOR" : "NOME DO JOGADOR"} 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(0,0,0,0.5)',
                                border: '2px solid',
                                borderColor: 'var(--ef-bevel-dark) var(--ef-bevel-light) var(--ef-bevel-light) var(--ef-bevel-dark)',
                                color: 'white',
                                fontSize: '16px',
                                fontFamily: 'var(--ef-font-family-body)',
                                fontWeight: '600',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {mode === 'player' && (
                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <select 
                                id="select-position" 
                                value={position} 
                                onChange={e => setPosition(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', background: 'var(--ef-color-neutral-bg)',
                                    color: 'white', border: '2px solid var(--ef-bevel-dark)', fontFamily: 'var(--ef-font-family-body)', fontWeight: 600
                                }}
                            >
                                <option value="GOL">Goleiro</option>
                                <option value="DEF">Zagueiro</option>
                                <option value="MEI">Meia</option>
                                <option value="ATA">Atacante</option>
                            </select>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {Object.entries(PERSONALITIES).map(([key, p]) => (
                                    <EfButton 
                                        key={key} 
                                        size="sm"
                                        variant={personality === key ? 'secondary' : 'ghost'} 
                                        onClick={() => setPersonality(key)}
                                        title={p.description}
                                        style={{ justifyContent: 'center', fontSize: '10px' }}
                                    >
                                        {p.emoji} {p.name}
                                    </EfButton>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'manager' && (
                        <div style={{ marginBottom: '20px' }}>
                            <select 
                                id="select-scenario" 
                                value={scenario} 
                                onChange={e => setScenario(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', background: 'var(--ef-color-neutral-bg)',
                                    color: 'white', border: '2px solid var(--ef-bevel-dark)', fontFamily: 'var(--ef-font-family-body)', fontWeight: 600
                                }}
                            >
                                <option value="livre">🌍 Sandbox (Livre)</option>
                                <option value="fallen">📉 Gigante Caído (Orçamento -90%)</option>
                            </select>
                        </div>
                    )}

                    {/* Seleção de Time */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '16px', 
                        background: 'rgba(0,0,0,0.3)', padding: '8px 16px', 
                        border: '2px solid var(--ef-bevel-dark)', marginBottom: '20px' 
                    }}>
                        <select 
                            id="select-team" 
                            value={teamId} 
                            onChange={e => setTeamId(e.target.value)} 
                            style={{ 
                                flex: 1, background: 'transparent', border: 'none', color: 'white',
                                outline: 'none', fontSize: '14px', fontFamily: 'var(--ef-font-family-body)', fontWeight: 600
                            }}
                        >
                            <option value="">SELECIONE O CLUBE...</option>
                            {allTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.zone} - Div {t.div})</option>
                            ))}
                        </select>
                        {selectedTeamName && (
                            <div className="ef-anim-pop-in" style={{ flexShrink: 0 }}>
                                <EfClubBadge name={selectedTeamName} size="md" />
                            </div>
                        )}
                    </div>

                    {/* Dificuldade */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--ef-color-neutral-text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                            DIFICULDADE DO MOTOR
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {Object.values(DIFFICULTY_MODES).map(d => (
                                <EfButton
                                    key={d.id}
                                    size="sm"
                                    variant={difficulty === d.id ? 'primary' : 'ghost'}
                                    onClick={() => { setDifficulty(d.id); setDifficultyState(d.id); }}
                                    style={{ flex: 1, justifyContent: 'center', padding: '8px 4px' }}
                                    title={d.description}
                                >
                                    {d.emoji}
                                </EfButton>
                            ))}
                        </div>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <EfButton 
                            id="btn-start" 
                            variant="primary" 
                            size="lg"
                            onClick={handleStart} 
                            disabled={!name.trim() || !teamId}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            ⚡ COMEÇAR CARREIRA
                        </EfButton>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {!isTutorialDone() && (
                                <EfButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => changeView('tutorial')}
                                    style={{ justifyContent: 'center' }}
                                >
                                    🎓 TUTORIAL
                                </EfButton>
                            )}
                            <EfButton
                                variant="danger"
                                size="sm"
                                onClick={handleAutoPlay}
                                style={{ justifyContent: 'center', gridColumn: isTutorialDone() ? '1 / -1' : 'auto' }}
                                title="Inicia bot AutoPlay"
                            >
                                🤖 AUTOPLAY
                            </EfButton>
                        </div>
                    </div>

                </EfPanel>
            </div>
        </div>
    );
}

