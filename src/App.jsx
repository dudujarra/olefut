import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { StartView } from './components/StartView';
import { DashboardView } from './components/DashboardView';
import { PlayerDashboardView } from './components/PlayerDashboardView';
import { PlayerMatchView } from './components/PlayerMatchView';
import { SquadView } from './components/SquadView';
import { MarketView } from './components/MarketView';
import { StandingsView } from './components/StandingsView';
import { MatchView } from './components/MatchView';
import { isSoundEnabled, setSoundEnabled, sfx } from './utils/sound';

function App() {
    const { gameState, getEngine, saveGame, resetGame } = useGame();
    const [soundOn, setSoundOn] = useState(isSoundEnabled());
    const [savedToast, setSavedToast] = useState(false);
    const [theme8bit, setTheme8bit] = useState(() => {
        try { return localStorage.getItem('elifoot_theme') === '8bit'; } catch { return false; }
    });

    React.useEffect(() => {
        if (theme8bit) document.body.classList.add('theme-8bit');
        else document.body.classList.remove('theme-8bit');
        try { localStorage.setItem('elifoot_theme', theme8bit ? '8bit' : 'modern'); } catch { /* ignore */ }
    }, [theme8bit]);

    const renderView = () => {
        switch (gameState.view) {
            case 'start': return <StartView />;
            case 'dashboard': return <DashboardView />;
            case 'player_dashboard': return <PlayerDashboardView />;
            case 'player_match': return <PlayerMatchView />;
            case 'match': return <MatchView />;
            case 'squad': return <SquadView />;
            case 'market': return <MarketView />;
            case 'standings': return <StandingsView />;
            default: return <StartView />;
        }
    };

    const engine = getEngine();

    const handleSave = () => {
        if (saveGame) saveGame();
        sfx.success();
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 1500);
    };

    const handleSoundToggle = () => {
        const next = !soundOn;
        setSoundEnabled(next);
        setSoundOn(next);
        if (next) sfx.click();
    };

    const handleReset = () => {
        if (window.confirm('Apagar carreira e voltar pra tela inicial? Não tem como recuperar.')) {
            if (resetGame) resetGame();
        }
    };

    return (
        <>
            {gameState.started && (
                <header className="top-bar glass-panel">
                    <div className="logo">ELIFOOT <span>WEB</span></div>
                    <div className="user-info" style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                        <span className="manager-name">{gameState.manager}</span>
                        {gameState.mode === 'player' && engine.proPlayer && (
                            <strong>R$ {engine.proPlayer.money}</strong>
                        )}
                        {gameState.mode === 'manager' && (
                            <span>Sem {engine.currentWeek}/38</span>
                        )}
                        {/* P2-13: save manual button */}
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleSave}
                            title="Salvar manual (auto-save ativo)"
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            💾
                        </button>
                        {/* P1-6: sound toggle */}
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleSoundToggle}
                            title={soundOn ? 'Som ON (clique pra desligar)' : 'Som OFF (clique pra ligar)'}
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            {soundOn ? '🔊' : '🔇'}
                        </button>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setTheme8bit(t => !t)}
                            title={theme8bit ? 'Tema: 8-BIT (clique pra modern)' : 'Tema: Modern (clique pra 8-BIT)'}
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            {theme8bit ? '🕹️' : '🎨'}
                        </button>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleReset}
                            title="Resetar carreira"
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            🔄
                        </button>
                    </div>
                    {savedToast && (
                        <div style={{position:'fixed',top:'4rem',right:'1rem',background:'var(--primary)',color:'white',padding:'0.5rem 1rem',borderRadius:'var(--radius-sm)',fontSize:'0.85rem',fontWeight:600,zIndex:1000,animation:'slideUp 0.3s'}}>
                            ✅ Salvo!
                        </div>
                    )}
                </header>
            )}
            {renderView()}
        </>
    );
}

export default App;
