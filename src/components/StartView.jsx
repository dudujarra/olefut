import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RealDB } from '../engine/db/index';
import { PERSONALITIES } from '../engine/PlayerCareer';
// AKITA-105: inline para evitar puxar TutorialView (heavy) ao chunk inicial
// via StartView (eager). Vite emitia INEFFECTIVE_DYNAMIC_IMPORT.
const isTutorialDone = () => {
    try { return localStorage.getItem('elifoot_tutorial_done') !== null; } catch { return false; }
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

    return (
        <div style={{
            backgroundColor: colors.bg,
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                maxWidth: '500px',
                width: '100%',
                margin: '0 auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <img 
                        src={gameLogo} 
                        alt="OléFUT Logo" 
                        style={{
                            width: '200px', 
                            height: '200px', 
                            boxShadow: `0 0 0 4px ${colors.border}`,
                            imageRendering: 'pixelated',
                            background: colors.panelElevated,
                            marginBottom: '16px'
                        }} 
                    />
                    <h1 style={{
                        margin: '0 0 8px 0',
                        fontSize: '2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: colors.text,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: '800'
                    }}>
                        OléFUT
                    </h1>
                    <p style={{
                        margin: 0,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: colors.accent,
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        Arcade Manager RPG
                    </p>
                </div>

                <EfPanel padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Modo de Jogo */}
                    <div style={{ display: 'flex', gap: '12px' }}>
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
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: colors.panelElevated,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                fontSize: '1rem',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: 'bold',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {mode === 'player' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <select 
                                id="select-position" 
                                value={position} 
                                onChange={e => setPosition(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px', background: colors.panelElevated,
                                    color: colors.text, border: `1px solid ${colors.border}`, fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', outline: 'none'
                                }}
                            >
                                <option value="GOL">Goleiro (GOL)</option>
                                <option value="DEF">Zagueiro (DEF)</option>
                                <option value="MEI">Meio-Campista (MEI)</option>
                                <option value="ATA">Atacante (ATA)</option>
                            </select>
                            
                            <div>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>PERSONALIDADE:</div>
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
                                style={{
                                    width: '100%', padding: '14px 16px', background: colors.panelElevated,
                                    color: colors.text, border: `1px solid ${colors.border}`, fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', outline: 'none'
                                }}
                            >
                                <option value="livre">Sandbox (Livre)</option>
                                <option value="fallen">Gigante Caído (Orçamento -90%)</option>
                            </select>
                        </div>
                    )}

                    {/* Seleção de Time */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', 
                        background: colors.panelElevated, padding: '12px 16px', 
                        border: `1px solid ${colors.border}`, }}>
                        <MapPin size={24} color={colors.secondary} />
                        <select 
                            id="select-team" 
                            value={teamId} 
                            onChange={e => setTeamId(e.target.value)} 
                            style={{ 
                                flex: 1, background: 'transparent', border: 'none', color: colors.text,
                                outline: 'none', fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 'bold',
                                appearance: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="" disabled>SELECIONE O CLUBE...</option>
                            {allTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.zone} - Div {t.div})</option>
                            ))}
                        </select>
                        {selectedTeamName && (
                            <div style={{ flexShrink: 0, paddingLeft: '12px', borderLeft: `1px solid ${colors.border}` }}>
                                <EfClubBadge name={selectedTeamName} size="md" />
                            </div>
                        )}
                    </div>

                    {/* Dificuldade */}
                    <div>
                        <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                            DIFICULDADE DO MOTOR SIMULADOR:
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
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
                                style={{ flex: 1, justifyContent: 'center', color: colors.danger, borderColor: colors.danger }}
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
