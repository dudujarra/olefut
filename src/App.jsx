import { useState, lazy, Suspense } from 'react';
import { useGame } from './context/GameContext';
// Eager: rotas de entrada (StartView é a primeira tela; DashboardView é o hub
// principal acessado em quase todo gameplay). Outras rotas viram chunks
// separados via lazy() para reduzir o bundle inicial (AKITA-105 V2).
import { StartView } from './components/StartView';
import { DashboardView } from './components/DashboardView';
import { Sidebar } from './components/Sidebar';
import { FloatingBugButton } from './components/FloatingBugButton';
import { isSoundEnabled, setSoundEnabled, sfx } from './utils/sound';
import { MonitorService } from './services/MonitorService';
import { EfButton } from './components/ui/EfButton';

// AKITA-228: AudioController lazy — Tone.js (345KB) só carrega após primeira nav
// de usuário (não bloqueia first paint). Suspense fallback é nulo (silent).
const AudioController = lazy(() => import('./audio/AudioController.jsx').then(m => ({ default: m.AudioController })));

const PlayerDashboardView = lazy(() => import('./components/PlayerDashboardView').then(m => ({ default: m.PlayerDashboardView })));
const PlayerMatchView = lazy(() => import('./components/PlayerMatchView').then(m => ({ default: m.PlayerMatchView })));
const SquadView = lazy(() => import('./components/SquadView').then(m => ({ default: m.SquadView })));
const MarketView = lazy(() => import('./components/MarketView').then(m => ({ default: m.MarketView })));
const StandingsView = lazy(() => import('./components/StandingsView').then(m => ({ default: m.StandingsView })));
const MatchView = lazy(() => import('./components/MatchView').then(m => ({ default: m.MatchView })));
const MonitorView = lazy(() => import('./components/MonitorView').then(m => ({ default: m.MonitorView })));
const CosmeticShopView = lazy(() => import('./components/CosmeticShopView').then(m => ({ default: m.CosmeticShopView })));
const AutoPlayView = lazy(() => import('./components/AutoPlayView').then(m => ({ default: m.AutoPlayView })));
const StyleguideView = lazy(() => import('./components/StyleguideView').then(m => ({ default: m.StyleguideView })));
const AchievementsView = lazy(() => import('./components/AchievementsView').then(m => ({ default: m.AchievementsView })));
const TutorialView = lazy(() => import('./components/TutorialView').then(m => ({ default: m.TutorialView })));
const PressView = lazy(() => import('./components/PressView').then(m => ({ default: m.PressView })));
const SaveSlotsView = lazy(() => import('./components/SaveSlotsView').then(m => ({ default: m.SaveSlotsView })));
const RivalriesView = lazy(() => import('./components/RivalriesView').then(m => ({ default: m.RivalriesView })));
const ChronicleView = lazy(() => import('./components/ChronicleView').then(m => ({ default: m.ChronicleView })));

const Fallback = () => (
    <div style={{ padding: '24px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
        CARREGANDO…
    </div>
);

// Install global error handlers (idempotente)
MonitorService.getInstance().install();

function App() {
    const { gameState, getEngine, saveGame, resetGame, changeView } = useGame();
    const [soundOn, setSoundOn] = useState(isSoundEnabled());
    const [savedToast, setSavedToast] = useState(false);


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
        <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: '#000' }}>
            {gameState.started && gameState.view !== 'start' && gameState.view !== 'tutorial' && (
                <Sidebar />
            )}
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
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
                
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Suspense fallback={<Fallback />}>
                        {renderView()}
                    </Suspense>
                </main>
                
                <FloatingBugButton />
                <Suspense fallback={null}>
                    <AudioController />
                </Suspense>
            </div>
        </div>
    );
}

export default App;
