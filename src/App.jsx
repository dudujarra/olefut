import React from 'react';
import { useGame } from './context/GameContext';
import { StartView } from './components/StartView';
import { DashboardView } from './components/DashboardView';
import { PlayerDashboardView } from './components/PlayerDashboardView';
import { PlayerMatchView } from './components/PlayerMatchView';
import { SquadView } from './components/SquadView';
import { MarketView } from './components/MarketView';
import { StandingsView } from './components/StandingsView';
import { MatchView } from './components/MatchView';

function App() {
    const { gameState, getEngine } = useGame();

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

    return (
        <>
            {gameState.started && (
                <header className="top-bar glass-panel">
                    <div className="logo">ELIFOOT <span>WEB</span></div>
                    <div className="user-info">
                        <span className="manager-name">{gameState.manager}</span>
                        {gameState.mode === 'player' && engine.proPlayer && (
                            <strong>R$ {engine.proPlayer.money}</strong>
                        )}
                        {gameState.mode === 'manager' && (
                            <span>Sem {engine.currentWeek}/38</span>
                        )}
                    </div>
                </header>
            )}
            {renderView()}
        </>
    );
}

export default App;
