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
import { MonitorView } from './components/MonitorView';
import { FloatingBugButton } from './components/FloatingBugButton';
import { Sidebar } from './components/Sidebar';
import { CosmeticShopView } from './components/CosmeticShopView';
import { AutoPlayView } from './components/AutoPlayView';
import { StyleguideView } from './components/StyleguideView';
import { AchievementsView } from './components/AchievementsView';
import { TutorialView } from './components/TutorialView';
import { PressView } from './components/PressView';
import { SaveSlotsView } from './components/SaveSlotsView';
import { RivalriesView } from './components/RivalriesView';
import { ChronicleView } from './components/ChronicleView';
import { isSoundEnabled, setSoundEnabled, sfx } from './utils/sound';
import { MonitorService } from './services/MonitorService';
import { AudioController } from './audio/AudioController.jsx';
import { EfButton } from './components/ui/EfButton';

// Install global error handlers (idempotente)
MonitorService.getInstance().install();

function App() {
    const { gameState, getEngine, saveGame, resetGame, changeView } = useGame();
    const [soundOn, setSoundOn] = useState(isSoundEnabled());
    const [savedToast, setSavedToast] = useState(false);
    // Tri-state theme: modern → 8bit → 32bit → modern (cycle)
    const [theme, setTheme] = useState(() => {
        try {
            const v = localStorage.getItem('elifoot_theme');
            return ['modern', '8bit', '32bit'].includes(v) ? v : 'modern';
        } catch { return 'modern'; }
    });

    React.useEffect(() => {
        document.body.classList.remove('theme-8bit', 'theme-32bit');
        if (theme === '8bit') document.body.classList.add('theme-8bit');
        else if (theme === '32bit') document.body.classList.add('theme-32bit');
        try { localStorage.setItem('elifoot_theme', theme); } catch { /* ignore */ }
    }, [theme]);

    const cycleTheme = () => {
        const next = theme === 'modern' ? '8bit' : theme === '8bit' ? '32bit' : 'modern';
        setTheme(next);
        sfx.click();
    };

    const themeIcon = theme === 'modern' ? '🎨' : theme === '8bit' ? '🕹️' : '🎮';
    const themeLabel = theme === 'modern' ? 'Tema: Modern (clique → 8-BIT)' : theme === '8bit' ? 'Tema: 8-BIT NES (clique → 32-BIT SNES)' : 'Tema: 32-BIT SNES (clique → Modern)';

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
            case 'monitor': return <MonitorView />;
            case 'styleguide': return <StyleguideView />;
            case 'achievements': return <AchievementsView />;
            case 'tutorial': return <TutorialView />;
            case 'press': return <PressView />;
            case 'shop': return <CosmeticShopView />;
            case 'autoplay': return <AutoPlayView />;
            case 'saves': return <SaveSlotsView />;
            case 'rivalries': return <RivalriesView />;
            case 'chronicle': return <ChronicleView />;
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
                    <div className="logo">OléFUT</div>
                    <div className="user-info" style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                        <span className="manager-name">{gameState.manager}</span>
                        {gameState.mode === 'player' && engine.proPlayer && (
                            <strong>R$ {engine.proPlayer.money}</strong>
                        )}
                        {gameState.mode === 'manager' && (
                            <span>Sem {engine.currentWeek}/38</span>
                        )}
                        {/* P2-13: save manual button */}
                        <EfButton
                            variant="secondary" size="sm"
                            onClick={handleSave}
                            title="Salvar manual (auto-save ativo)"
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            💾
                        </EfButton>
                        {/* P1-6: sound toggle */}
                        <EfButton
                            variant="secondary" size="sm"
                            onClick={handleSoundToggle}
                            title={soundOn ? 'Som ON (clique pra desligar)' : 'Som OFF (clique pra ligar)'}
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            {soundOn ? '🔊' : '🔇'}
                        </EfButton>
                        <EfButton
                            variant="secondary" size="sm"
                            onClick={cycleTheme}
                            title={themeLabel}
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            {themeIcon}
                        </EfButton>
                        <EfButton
                            variant="secondary" size="sm"
                            onClick={() => changeView?.('monitor')}
                            title="Monitor (bugs/gameplay/feedback)"
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            📊
                        </EfButton>
                        <EfButton
                            variant="secondary" size="sm"
                            onClick={handleReset}
                            title="Resetar carreira"
                            style={{padding:'0.25rem 0.55rem'}}
                        >
                            🔄
                        </EfButton>
                    </div>
                    {savedToast && (
                        <div style={{position:'fixed',top:'4rem',right:'1rem',background:'#39FF14',color:'#111417',padding:'0.5rem 1rem',borderRadius:'0',fontSize:'0.85rem',fontWeight:600,zIndex:1000,animation:'slideUp 0.3s',border:'2px solid #4A5059',fontFamily:"'Press Start 2P', monospace"}}>
                            ✅ Salvo!
                        </div>
                    )}
                </header>
            )}
            <Sidebar />
            {renderView()}
            <FloatingBugButton />
            <AudioController />
        </>
    );
}

export default App;
