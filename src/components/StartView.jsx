import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RealDB } from '../engine/db/index';
import { PERSONALITIES } from '../engine/PlayerCareer';

export function StartView() {
    const { startGame } = useGame();
    const [name, setName] = useState('');
    const [scenario, setScenario] = useState('livre');
    const [teamId, setTeamId] = useState('');
    const [mode, setMode] = useState('manager');
    const [position, setPosition] = useState('ATA');
    const [personality, setPersonality] = useState('maverick');

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

    return (
        <div className="start-view ef-anim-fade-in ef-art-bg ef-art-champion-celebration">
            <h1 className="ef-anim-pop-in">ELIFOOT</h1>
            <p className="ef-anim-slide-down">Soccer Manager RPG</p>
            <div className="start-form ef-anim-slide-up">
                <div className="mode-selector">
                    <button className={`mode-btn ${mode === 'manager' ? 'active' : ''}`} onClick={() => setMode('manager')}>🧑‍💼 Treinador</button>
                    <button className={`mode-btn ${mode === 'player' ? 'active' : ''}`} onClick={() => setMode('player')}>⚽ Jogador</button>
                </div>

                <input id="input-name" type="text" placeholder={mode === 'manager' ? "Nome do Treinador" : "Nome do Jogador"} value={name} onChange={e => setName(e.target.value)} />

                {mode === 'player' && (
                    <>
                        <select id="select-position" value={position} onChange={e => setPosition(e.target.value)}>
                            <option value="GOL">Goleiro</option>
                            <option value="DEF">Zagueiro</option>
                            <option value="MEI">Meia</option>
                            <option value="ATA">Atacante</option>
                        </select>
                        <div className="mode-selector">
                            {Object.entries(PERSONALITIES).map(([key, p]) => (
                                <button key={key} className={`mode-btn ${personality === key ? 'active' : ''}`} onClick={() => setPersonality(key)}>
                                    {p.emoji} {p.name}
                                </button>
                            ))}
                        </div>
                        <p style={{color:'var(--text-muted)',fontSize:'0.75rem',textAlign:'center'}}>{PERSONALITIES[personality].description}</p>
                    </>
                )}

                {mode === 'manager' && (
                    <select id="select-scenario" value={scenario} onChange={e => setScenario(e.target.value)}>
                        <option value="livre">🌍 Sandbox (Livre)</option>
                        <option value="fallen">📉 Gigante Caído (Orçamento -90%)</option>
                    </select>
                )}

                <select id="select-team" value={teamId} onChange={e => setTeamId(e.target.value)}>
                    <option value="">Selecione seu time...</option>
                    {allTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.zone} - Div {t.div})</option>
                    ))}
                </select>

                <button id="btn-start" className="btn btn-primary" onClick={handleStart} disabled={!name.trim() || !teamId}>
                    ⚡ COMEÇAR CARREIRA
                </button>
            </div>
        </div>
    );
}
