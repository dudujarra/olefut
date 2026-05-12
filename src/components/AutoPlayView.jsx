/**
 * AutoPlayView — Soak Test UI
 *
 * Roda bot continuamente, mostra stats live + anomalies catalog.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getAutoPlay } from '../services/AutoPlayService';
import LearningPanel from './learning/LearningPanel';
import CareerInfoPanel from './learning/CareerInfoPanel';
import BrainDashboard from './learning/BrainDashboard';
import { RealDB } from '../engine/db/index';
import { DIFFICULTY_MODES, getDifficulty, setDifficulty } from '../engine/systems/DifficultyModes';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { EfModal } from './ui/EfModal';
import bgSoakTest from '../assets/environments/bg_soak_test.png';

const SPEED_PRESETS = [
    { label: '🐢 Slow', delay: 500 },
    { label: '🚶 1×',   delay: 200 },
    { label: '🏃 5×',    delay: 50 },
    { label: '🚀 20×',   delay: 10 },
    { label: '⚡ Max',   delay: 1 }
];

export function AutoPlayView() {
    const { startGame, changeView, getEngine, getDashboardView, forceUpdate } = useGame();
    const engine = getEngine();
    const controllerRef = useRef(null);
    const [stats, setStats] = useState(null);
    const [speed, setSpeed] = useState(50);
    const [anomalyFilter, setAnomalyFilter] = useState('all');
    const [telemetryOpen, setTelemetryOpen] = useState(false);
    const [expandedSpec, setExpandedSpec] = useState(null);
    // SPEC-119: LLM mode state (BUG-052: must be BEFORE early return — Rules of Hooks)
    const [llmStatus, setLlmStatus] = useState({ mode: 'heuristic', loadStatus: 'idle' });
    // AutoPlay setup state (BUG-052: BEFORE early return)
    const [pacingQueue, setPacingQueue] = useState([]);
    const [setupTeamId, setSetupTeamId] = useState('');
    const [setupZone, setSetupZone] = useState('BRA');
    const [setupDiv, setSetupDiv] = useState(4);
    const [setupScenario, setSetupScenario] = useState('fallen');
    const [setupDifficultyId, setSetupDifficultyId] = useState(getDifficulty().id);

    // Build team list (static RealDB — computed once outside render is fine)
    const allTeams = React.useMemo(() => {
        const result = [];
        let id = 1;
        for (const zone of Object.keys(RealDB)) {
            for (const div of Object.keys(RealDB[zone])) {
                RealDB[zone][div].forEach(club => {
                    result.push({ id: id++, name: club.name, zone, div: parseInt(div) });
                });
            }
        }
        return result;
    }, []);

    useEffect(() => {
        if (!engine) return;
        controllerRef.current = getAutoPlay(engine);
        const interval = setInterval(() => {
            if (controllerRef.current) {
                setStats(controllerRef.current.getStats());
            }
        }, 250);
        return () => clearInterval(interval);
    }, [engine]);

    // SPEC-119: LLM status polling (BEFORE early return — Rules of Hooks)
    useEffect(() => {
        const id = setInterval(() => {
            if (controllerRef.current?.llmBridge) {
                setLlmStatus(controllerRef.current.llmBridge.status());
            }
        }, 1000);
        return () => clearInterval(id);
    }, []);

    // Pacing Friction Auto-Resolution
    // BUG-081 (SPEC-158): aceitável — UI sincroniza eventos externos da engine pra estado local.
    // Padrão event-subscriber, não derivado puro. useMemo não aplicável (side-effect timeout).
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!engine) return;
        const events = engine.getPacingEvents?.() || [];
        if (events.length > 0) {
            setPacingQueue(events);
            // Auto dismiss after 1.5s to show it visually without blocking
            const timer = setTimeout(() => {
                setPacingQueue([]);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setPacingQueue([]);
        }
    }, [stats?.weeksPlayed, engine]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!engine || !engine.manager?.teamId) {
        const zones = [...new Set(allTeams.map(t => t.zone))].sort();
        const filteredTeams = allTeams.filter(t => t.zone === setupZone && t.div === setupDiv);

        const handleSetupStart = () => {
            if (!setupTeamId) return;
            // Clear all existing elifoot saves to start fresh
            try {
                if (typeof localStorage !== 'undefined') {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith('elifoot_')) localStorage.removeItem(k);
                    }
                }
            } catch { /* ignore */ }
            setDifficulty(setupDifficultyId);
            startGame('AutoPlayBot', parseInt(setupTeamId), setupScenario, 'manager', 'ATA', 'maverick');
            setTimeout(() => changeView('autoplay'), 100);
        };

        return (
            <div className="ef-anim-fade-in" style={{
                backgroundImage: `url(${bgSoakTest})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: '100dvh',
                padding: '16px',
                color: '#E2E8F0'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', margin: 0, color: '#FFD700', textShadow: '3px 3px 0 #000' }}>🤖 AUTOPLAY SETUP</h2>
                        <EfButton variant="secondary" size="sm" onClick={() => changeView('start')}>← VOLTAR</EfButton>
                    </EfPanel>
                    <EfPanel variant="elev" padding="md">
                        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                        Configure o bot antes de iniciar o soak test.
                    </p>

                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>ZONA</label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {zones.map(z => (
                            <EfButton
                                key={z}
                                variant={setupZone === z ? 'primary' : 'secondary'}
                                onClick={() => { setSetupZone(z); setSetupTeamId(''); }}
                                style={{ fontSize: '0.75rem' }}
                            >{z}</EfButton>
                        ))}
                    </div>

                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>DIVISÃO</label>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                        {[1, 2, 3, 4].map(d => (
                            <EfButton
                                key={d}
                                variant={setupDiv === d ? 'primary' : 'secondary'}
                                onClick={() => { setSetupDiv(d); setSetupTeamId(''); }}
                                style={{ flex: 1, fontSize: '0.75rem' }}
                            >Div {d}</EfButton>
                        ))}
                    </div>

                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>
                        TIME ({filteredTeams.length} disponíveis)
                    </label>
                    <select
                        value={setupTeamId}
                        onChange={e => setSetupTeamId(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.75rem' }}
                    >
                        <option value="">Selecione o time...</option>
                        {filteredTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>CENÁRIO</label>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                        <EfButton
                            variant={setupScenario === 'livre' ? 'primary' : 'secondary'}
                            onClick={() => setSetupScenario('livre')}
                            style={{ flex: 1, fontSize: '0.75rem' }}
                        >🌍 Livre</EfButton>
                        <EfButton
                            variant={setupScenario === 'fallen' ? 'primary' : 'secondary'}
                            onClick={() => setSetupScenario('fallen')}
                            style={{ flex: 1, fontSize: '0.75rem' }}
                        >📉 Gigante Caído</EfButton>
                    </div>

                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px' }}>DIFICULDADE</label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {Object.values(DIFFICULTY_MODES).map(d => (
                            <EfButton
                                key={d.id}
                                variant={setupDifficultyId === d.id ? 'primary' : 'secondary'}
                                onClick={() => setSetupDifficultyId(d.id)}
                                style={{ flex: 1, fontSize: '0.7rem' }}
                                title={d.description}
                            >{d.emoji} {d.name}</EfButton>
                        ))}
                    </div>

                    <EfButton
                        variant="primary"
                        onClick={handleSetupStart}
                        disabled={!setupTeamId}
                        style={{ width: '100%' }}
                    >
                        ⚡ INICIAR AUTOPLAY
                    </EfButton>
                    </EfPanel>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        if (controllerRef.current) {
            controllerRef.current.start(speed);
        }
    };

    const handlePause = () => {
        if (controllerRef.current) {
            controllerRef.current.pause();
            forceUpdate();
        }
    };

    const handleStop = () => {
        if (controllerRef.current) {
            controllerRef.current.stop();
            forceUpdate();
        }
    };

    const handleSpeedChange = (newDelay) => {
        setSpeed(newDelay);
        if (controllerRef.current) {
            controllerRef.current.weekDelay = newDelay;
        }
    };

    const handleExport = () => {
        if (controllerRef.current) {
            controllerRef.current.exportReport();
        }
    };

    const handleExportTelemetry = () => {
        if (controllerRef.current) {
            controllerRef.current.exportTelemetryReport();
        }
    };

    const handleResetBrain = () => {
        if (!controllerRef.current) return;
        if (!window.confirm('Reset aprendizado? Bot esquece Q-table + memória + logs. Stats counters mantém.')) return;
        // BUG-068: Reset Brain agora limpa logs visíveis (decisions/successes/anomalies/seasonHistory)
        // mas preserva counters (wins/losses/transfers totais). User via histórico persistir
        // após reset brain → achava bug. Agora visualmente fresh.
        try { controllerRef.current.pause(); } catch { /* ignore */ }
        try {
            if (typeof localStorage !== 'undefined') {
                // Clear brain entirely
                localStorage.removeItem('elifoot_autoplay_brain');
                // Surgically clear log arrays in stats but preserve counters
                const raw = localStorage.getItem('elifoot_autoplay_state');
                if (raw) {
                    const stats = JSON.parse(raw);
                    if (stats && typeof stats === 'object') {
                        stats.anomalies = [];
                        stats.successes = [];
                        stats.decisions = [];
                        stats.seasonHistory = [];
                        localStorage.setItem('elifoot_autoplay_state', JSON.stringify(stats));
                    }
                }
            }
        } catch { /* ignore */ }
        try { controllerRef.current.resetBrain(); } catch { /* ignore */ }
        setTimeout(() => window.location.reload(), 100);
    };

    const handleNewGamePlus = () => {
        if (!controllerRef.current) return;
        if (!window.confirm(
            '🧠➕ NEW GAME+\n\n'
            + 'Salva o ML treinado (Q-table + personalidade + memória)\n'
            + 'e ZERA todo o gameplay (seasons, stats, resultados).\n\n'
            + 'O bot recomeça da temporada 1 mas com todo o aprendizado intacto.\n\n'
            + 'Continuar?'
        )) return;
        try {
            const snapshot = controllerRef.current.newGamePlus();
            window.alert(
                `✅ NEW GAME+ ativado!\n\n`
                + `Brain salvo:\n`
                + `  • Q-States: ${snapshot.states}\n`
                + `  • Updates: ${snapshot.totalUpdates}\n`
                + `  • Personalidade: ${snapshot.personality}\n`
                + `  • Memórias: ${snapshot.memoryEntries}\n`
                + `  • Estado Emocional: ${snapshot.emotionalState}\n\n`
                + `Gameplay zerado. Recarregando...`
            );
        } catch (e) {
            window.alert(`Erro no New Game+: ${e.message}`);
            return;
        }
        setTimeout(() => window.location.reload(), 100);
    };

    const handleResetAll = () => {
        if (!controllerRef.current) return;
        if (!window.confirm('🚨 RESET TUDO: apaga TUDO (Q-table + stats + save jogo + LLM). Sem volta.')) return;
        try { controllerRef.current.pause(); } catch { /* ignore */ }
        try {
            if (typeof localStorage !== 'undefined') {
                // BUG-074: também limpar main save (elifoot_save_v1) — antes ficava
                // game state Flamengo persistido após Reset Tudo.
                localStorage.removeItem('elifoot_autoplay_brain');
                localStorage.removeItem('elifoot_autoplay_state');
                localStorage.removeItem('elifoot_llm_mode');
                localStorage.removeItem('elifoot_save_v1');
                localStorage.removeItem('elifoot_genetic_state');
                // Sweep any other elifoot_* keys defensively
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('elifoot_')) localStorage.removeItem(k);
                }
            }
        } catch { /* ignore */ }
        setTimeout(() => window.location.reload(), 100);
    };

    // SPEC-119: LLM mode handlers (state hooks moved above early return)
    const handleLoadLLM = async () => {
        if (!controllerRef.current?.llmBridge) return;
        if (!window.confirm('Carregar Llama 3.2 1B (~700MB download primeiro uso, cached IndexedDB depois)? Requer WebGPU.')) return;
        controllerRef.current.llmBridge.setMode('webllm');
        await controllerRef.current.llmBridge.init();
        setLlmStatus(controllerRef.current.llmBridge.status());
    };

    const handleResetLLM = () => {
        if (!controllerRef.current?.llmBridge) return;
        controllerRef.current.llmBridge.setMode('heuristic');
        setLlmStatus({ mode: 'heuristic', loadStatus: 'idle' });
    };

    const scoreColor = (score) => {
        if (score >= 70) return '#39FF14';
        if (score >= 40) return '#FFD700';
        return '#FF3333';
    };

    const elapsedSec = stats ? (stats.elapsedMs / 1000).toFixed(1) : 0;
    const wps = stats ? stats.weeksPerSecond?.toFixed(1) : '0';

    const filteredAnomalies = stats?.anomalies?.filter(a => {
        if (anomalyFilter === 'all') return true;
        return a.type === anomalyFilter;
    }) || [];

    const anomalyTypes = stats?.anomalies?.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
    }, {}) || {};

    const successTypes = stats?.successes?.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
    }, {}) || {};

    return (
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgSoakTest})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', margin: 0, color: '#FFD700', textShadow: '3px 3px 0 #000' }}>🤖 SOAK TEST DASHBOARD</h2>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

            {/* Controls */}
            <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {!stats?.running ? (
                        <EfButton variant="primary" onClick={handleStart}>
                            ▶️ Iniciar
                        </EfButton>
                    ) : (
                        <EfButton variant="secondary" onClick={handlePause}>
                            ⏸️ Pausar
                        </EfButton>
                    )}
                    <EfButton variant="secondary" onClick={handleStop}>
                        ⏹️ Parar
                    </EfButton>
                    <EfButton variant="secondary" onClick={handleExport}>
                        📥 Exportar Relatório JSON
                    </EfButton>
                    <EfButton variant="secondary" onClick={handleExportTelemetry}>
                        📊 Export Telemetry JSON
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleResetBrain}
                        title="Reset Q-table — bot esquece aprendizado, stats permanecem"
                        style={{ borderColor: '#FF3333', color: '#FF3333' }}
                    >
                        🧠 Reset Brain
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleNewGamePlus}
                        title="NEW GAME+ — salva ML treinado, zera gameplay. Recomeça com o aprendizado intacto."
                        style={{ borderColor: '#FFD700', color: '#FFD700', fontWeight: 700 }}
                    >
                        🧠➕ New Game+
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleResetAll}
                        title="Reset TUDO — apaga brain + stats + telemetry. Sem volta."
                        style={{ borderColor: '#FF4444', color: '#FF4444', fontWeight: 700 }}
                    >
                        🚨 Reset Tudo
                    </EfButton>
                </div>

                {/* SPEC-119: LLM Bridge panel — buy/sell decision engine */}
                <EfPanel variant="sunk" padding="md" style={{
                    marginTop: '0.5rem',
                    background: '#1B4332',
                    border: '1px solid #6ABC3A',
                }}>
                    <div style={{ marginBottom: '6px', fontWeight: 700, color: '#6ABC3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🤝 BUY/SELL ENGINE (SPEC-119)</span>
                        <span style={{ fontSize: '0.72rem', color: '#888' }}>
                            mode: <strong>{llmStatus.mode}</strong>
                        </span>
                    </div>
                    {llmStatus.mode === 'webllm' && (
                        <div style={{ fontSize: '0.72rem', color: llmStatus.loadStatus === 'error' ? '#FF3333' : '#888' }}>
                            status: <strong>{llmStatus.loadStatus}</strong>
                            {llmStatus.loadProgress > 0 && llmStatus.loadProgress < 1 && (
                                <span> ({(llmStatus.loadProgress * 100).toFixed(0)}%)</span>
                            )}
                            {llmStatus.loadStatus === 'ready' && <span style={{ color: '#39FF14' }}> ✓ LLM ativo</span>}
                            {llmStatus.loadStatus === 'error' && llmStatus.error && (
                                <div style={{ marginTop: '4px', fontSize: '0.65rem', color: '#FF6666' }}>{llmStatus.error}</div>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {llmStatus.mode === 'heuristic' ? (
                            <EfButton
                                variant="secondary"
                                size="sm"
                                onClick={handleLoadLLM}
                                style={{ fontSize: '0.7rem', borderColor: '#6ABC3A', color: '#6ABC3A' }}
                                title="Load WebLLM Llama 3.2 1B (~700MB first time, cached after)"
                            >
                                🧠 Carregar WebLLM
                            </EfButton>
                        ) : (
                            <EfButton
                                variant="secondary"
                                size="sm"
                                onClick={handleResetLLM}
                                style={{ fontSize: '0.7rem' }}
                            >
                                ↩️ Voltar Heurística
                            </EfButton>
                        )}
                    </div>
                </EfPanel>

                {/* SPEC-115/116/117: Brain panel — adaptive learning telemetry */}
                {stats?.brain && (
                    <EfPanel variant="sunk" padding="md" style={{
                        marginTop: '0.5rem',
                        background: '#1B4332',
                        border: '1px solid #FFD700',
                    }}>
                        <div style={{ marginBottom: '6px', fontWeight: 700, color: '#FFD700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem' }}>
                            🧠 BRAIN (SPEC-115/116/117)
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span>States: <strong>{stats.brain.states ?? 0}</strong></span>
                            <span>Updates: <strong>{stats.brain.totalUpdates ?? 0}</strong></span>
                        </div>
                        {stats.brain.topActions?.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>
                                Top actions:&nbsp;
                                {stats.brain.topActions.slice(0, 3).map((a, i) => (
                                    <span key={i} style={{ marginRight: '8px' }}>
                                        {a.action} <strong style={{ color: a.totalQ >= 0 ? '#6ABC3A' : '#c44' }}>
                                            {a.totalQ >= 0 ? '+' : ''}{a.totalQ.toFixed(1)}
                                        </strong>
                                    </span>
                                ))}
                            </div>
                        )}
                    </EfPanel>
                )}

                {/* SPEC-124: Career info panel — team/division/titles/scorers */}
                <CareerInfoPanel controllerRef={controllerRef} />

                {/* SPEC-123: Real-time learning panel */}
                <LearningPanel controllerRef={controllerRef} />

                {/* ML Brain Dashboard — visual Q-learning status */}
                <BrainDashboard controllerRef={controllerRef} />

                <div style={{ color: '#888', marginBottom: '4px', fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
                    VELOCIDADE: {speed}ms/week
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {SPEED_PRESETS.map(p => (
                        <EfButton
                            key={p.delay}
                            onClick={() => handleSpeedChange(p.delay)}
                            variant="secondary"
                            size="sm"
                            style={{
                                background: speed === p.delay ? '#FFD700' : 'transparent',
                                color: speed === p.delay ? '#0F1A14' : '#E2E8F0',
                                border: '3px solid #FFD700',
                                fontSize: '0.7rem',
                                padding: '4px 8px'
                            }}
                        >{p.label}</EfButton>
                    ))}
                </div>
            </EfPanel>

            {/* Live stats grid */}
            {stats && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', marginBottom: '8px', color: '#FFD700', textShadow: '2px 2px 0 #000' }}>📊 ESTATÍSTICAS LIVE</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                        <Stat label="Status" value={stats.running ? '🟢 Rodando' : '⏸️ Pausado'} />
                        <Stat label="Semanas" value={stats.weeksPlayed} />
                        <Stat label="Temporadas" value={stats.seasonsPlayed} />
                        <Stat label="Semana atual" value={`${stats.currentWeek || 0}/${(stats.currentSeason || 1) * 38}`} />
                        <Stat label="Tempo (s)" value={elapsedSec} />
                        <Stat label="Weeks/sec" value={wps} />
                        <Stat label="Matches" value={stats.matchesPlayed} />
                        <Stat label="V/E/D" value={`${stats.wins}/${stats.draws}/${stats.losses}`} />
                        <Stat label="Transfers" value={stats.transfers} />
                        <Stat label="Decisions" value={stats.decisions?.length || 0} />
                        <Stat label="Errors" value={stats.errorCount} color={stats.errorCount > 0 ? '#FF3333' : '#39FF14'} />
                        <Stat label="Anomalies" value={stats.anomalies?.length || 0} color={(stats.anomalies?.length || 0) > 0 ? '#FFD700' : '#E2E8F0'} />
                    </div>
                </EfPanel>
            )}

            {/* Insights summary */}
            {stats?.insights && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', marginBottom: '8px', color: '#FFD700', textShadow: '2px 2px 0 #000' }}>📈 INSIGHTS DA CARREIRA</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
                        <Stat label="Títulos" value={stats.insights.titlesWon} color="#FFD700" />
                        <Stat label="Promoções" value={stats.insights.promotionsWon} color="#39FF14" />
                        <Stat label="Rebaixamentos" value={stats.insights.relegationsTaken} color="#FF3333" />
                        <Stat label="Hat-tricks" value={stats.insights.hatTricks} />
                        <Stat label="Clean sheets" value={stats.insights.cleanSheets} />
                        <Stat label="Maior streak V" value={stats.insights.longestWinStreak} color="#39FF14" />
                        <Stat label="Maior streak D" value={Math.abs(stats.insights.longestLossStreak || 0)} color="#FF3333" />
                        <Stat label="Peak posição" value={stats.insights.peakStanding === Infinity ? '-' : stats.insights.peakStanding + 'º'} />
                        <Stat label="Pior posição" value={stats.insights.worstStanding ? stats.insights.worstStanding + 'º' : '-'} />
                        <Stat label="Pico R$" value={`${(stats.insights.peakBalance / 1e6).toFixed(0)}M`} color="#FFD700" />
                        <Stat label="Maior goleada" value={stats.insights.biggestWin?.score || '-'} />
                        <Stat label="Pior derrota" value={stats.insights.worstLoss?.score || '-'} color="#FF3333" />
                    </div>
                </EfPanel>
            )}

            {/* §23: GDD Systems Status — LIVE PROOF */}
            {stats && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', marginBottom: '8px', color: '#FFD700', textShadow: '2px 2px 0 #000' }}>
                        🎯 GDD SYSTEMS STATUS — LIVE
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '6px',
                        fontSize: '0.75rem'
                    }}>
                        <GDDStatus
                            label="§12.4 #6 Scarcity"
                            emoji="⏰"
                            count={stats.decisions?.filter(d => d.action === 'SCARCITY_WINDOW').length || 0}
                        />
                        <GDDStatus
                            label="§12.4 #8 Dread"
                            emoji="⚠️"
                            count={stats.decisions?.filter(d => d.action === 'DREAD_RELEGATION').length || 0}
                        />
                        <GDDStatus
                            label="§14.2 Challenge Win"
                            emoji="🎯"
                            count={stats.successes?.filter(s => s.type === 'CHALLENGE_WIN').length || 0}
                        />
                        <GDDStatus
                            label="§16.2 Trophy Ceremony"
                            emoji="🏆"
                            count={stats.successes?.filter(s => s.type === 'TROPHY_CEREMONY').length || 0}
                        />
                        <GDDStatus
                            label="§17 Press Conference"
                            emoji="🎤"
                            count={stats.decisions?.filter(d => d.action === 'PRESS_CONFERENCE').length || 0}
                        />
                        <GDDStatus
                            label="§17 Team Talk"
                            emoji="📢"
                            count={stats.decisions?.filter(d => d.action === 'TEAM_TALK').length || 0}
                        />
                        <GDDStatus
                            label="§17 Narrative Events"
                            emoji="📖"
                            count={stats.decisions?.filter(d => d.action === 'NARRATIVE_EVENTS').length || 0}
                        />
                        <GDDStatus
                            label="§15.3 Contract Renewal"
                            emoji="📋"
                            count={stats.decisions?.filter(d => d.action === 'CONTRACT_RENEWAL').length || 0}
                        />
                        <GDDStatus
                            label="§19.1 View Unlock"
                            emoji="🔓"
                            count={stats.decisions?.filter(d => d.action === 'VISIT_VIEW').length || 0}
                        />
                        <GDDStatus
                            label="§22 Substitutions"
                            emoji="🔄"
                            count={stats.decisions?.filter(d => d.action === 'SUBSTITUTION').length || 0}
                        />
                        <GDDStatus
                            label="Training"
                            emoji="🏋️"
                            count={stats.decisions?.filter(d => d.action === 'TRAIN').length || 0}
                        />
                        <GDDStatus
                            label="Market / Buy"
                            emoji="💰"
                            count={stats.decisions?.filter(d => d.action === 'BUY_OFFER' || d.action === 'MARKET_INQUIRY').length || 0}
                        />
                        <GDDStatus
                            label="Formation / Tactic"
                            emoji="📐"
                            count={stats.decisions?.filter(d => d.action === 'FORMATION' || d.action === 'TACTIC').length || 0}
                        />
                        <GDDStatus
                            label="Scouted / Signed"
                            emoji="🔍"
                            count={stats.decisions?.filter(d => d.action === 'SIGN_SCOUTED').length || 0}
                        />
                        <GDDStatus
                            label="Staff Mgmt"
                            emoji="👔"
                            count={stats.decisions?.filter(d => d.action === 'HIRE_STAFF' || d.action === 'FIRE_STAFF').length || 0}
                        />
                        <GDDStatus
                            label="Stadium / Academy"
                            emoji="🏟️"
                            count={stats.decisions?.filter(d => d.action === 'UPGRADE_STADIUM' || d.action === 'UPGRADE_ACADEMY').length || 0}
                        />
                    </div>
                    <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#111417',
                        border: '3px solid #222',
                        fontSize: '0.7rem',
                        color: '#888',
                        textAlign: 'center'
                    }}>
                        {(() => {
                            const total = 16;
                            const active = [
                                stats.decisions?.some(d => d.action === 'SCARCITY_WINDOW'),
                                stats.decisions?.some(d => d.action === 'DREAD_RELEGATION'),
                                stats.successes?.some(s => s.type === 'CHALLENGE_WIN'),
                                stats.successes?.some(s => s.type === 'TROPHY_CEREMONY'),
                                stats.decisions?.some(d => d.action === 'PRESS_CONFERENCE'),
                                stats.decisions?.some(d => d.action === 'TEAM_TALK'),
                                stats.decisions?.some(d => d.action === 'NARRATIVE_EVENTS'),
                                stats.decisions?.some(d => d.action === 'CONTRACT_RENEWAL'),
                                stats.decisions?.some(d => d.action === 'VISIT_VIEW'),
                                stats.decisions?.some(d => d.action === 'SUBSTITUTION'),
                                stats.decisions?.some(d => d.action === 'TRAIN'),
                                stats.decisions?.some(d => d.action === 'BUY_OFFER' || d.action === 'MARKET_INQUIRY'),
                                stats.decisions?.some(d => d.action === 'FORMATION' || d.action === 'TACTIC'),
                                stats.decisions?.some(d => d.action === 'SIGN_SCOUTED'),
                                stats.decisions?.some(d => d.action === 'HIRE_STAFF' || d.action === 'FIRE_STAFF'),
                                stats.decisions?.some(d => d.action === 'UPGRADE_STADIUM' || d.action === 'UPGRADE_ACADEMY'),
                            ].filter(Boolean).length;
                            const pct = Math.round((active / total) * 100);
                            const color = pct >= 80 ? '#6ABC3A' : pct >= 50 ? '#f59e0b' : '#ef4444';
                            return (
                                <span>
                                    GDD Coverage: <strong style={{ color, fontSize: '0.85rem' }}>{active}/{total} ({pct}%)</strong>
                                    {pct >= 100 && ' 🎉 FULL PARITY'}
                                    {pct >= 80 && pct < 100 && ' — rode mais seasons para cobertura total'}
                                </span>
                            );
                        })()}
                    </div>
                </EfPanel>
            )}

            {/* Telemetria — SPEC-100..114 (15 detectores) */}
            {stats?.telemetry?.results && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <div
                        onClick={() => setTelemetryOpen(!telemetryOpen)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', margin: 0, color: '#FFD700', textShadow: '2px 2px 0 #000' }}>
                            📊 Telemetria ({Object.keys(stats.telemetry.results).length} detectores)
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: scoreColor(stats.telemetry.overallScore) }}>
                                Score Geral: {stats.telemetry.overallScore}
                            </span>
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>
                            {telemetryOpen ? '▼ Recolher' : '▶ Expandir'}
                        </span>
                    </div>
                    {telemetryOpen && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '8px',
                            marginTop: '0.75rem'
                        }}>
                            {Object.entries(stats.telemetry.results).map(([spec, res]) => (
                                <div
                                    key={spec}
                                    onClick={() => setExpandedSpec(expandedSpec === spec ? null : spec)}
                                    style={{
                                        padding: '0.5rem',
                                        background: '#1E2124',
                                        border: `3px solid ${scoreColor(res.score)}`,
                                        cursor: 'pointer',
                                        fontSize: '0.78rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '0.72rem' }}>{spec}</strong>
                                        <span style={{ fontWeight: 700, color: scoreColor(res.score) }}>{res.score}</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>
                                        {res.name}
                                    </div>
                                    {res.signals?.[0] && (
                                        <div style={{
                                            fontSize: '0.68rem',
                                            color: scoreColor(100 - (res.signals[0].severity * 100))
                                        }}>
                                            ⚠ {res.signals[0].id}
                                        </div>
                                    )}
                                    {expandedSpec === spec && res.signals?.length > 0 && (
                                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #0E1F14' }}>
                                            {res.signals.slice(0, 5).map((s, i) => (
                                                <div key={i} style={{ marginBottom: '3px', fontSize: '0.65rem' }}>
                                                    <strong>{s.id}</strong> ({(s.severity * 100).toFixed(0)}%): {s.msg}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </EfPanel>
            )}

            {/* Successes catalog */}
            {stats?.successes && stats.successes.length > 0 && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', marginBottom: '8px', color: '#39FF14', textShadow: '2px 2px 0 #000' }}>✅ SUCCESSES ({stats.successes.length})</h3>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '6px' }}>
                        Por tipo: {Object.entries(successTypes).map(([t, n]) => `${t}(${n})`).join(' • ')}
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {stats.successes.slice(-20).reverse().map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.4rem 0.5rem',
                                    borderLeft: '4px solid #39FF14',
                                    background: '#111417',
                                    fontSize: '0.75rem',
                                    marginBottom: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ color: '#39FF14' }}>{s.type}</strong>
                                    <span style={{ color: '#888', fontSize: '0.65rem' }}>
                                        Sem {s.week} • Temp {s.season}
                                    </span>
                                </div>
                                <div style={{ marginTop: '2px' }}>{s.msg}</div>
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* Anomalies catalog */}
            {stats?.anomalies && stats.anomalies.length > 0 && (
                <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', margin: 0, color: '#FF3333', textShadow: '2px 2px 0 #000' }}>⚠️ ANOMALIES ({stats.anomalies.length})</h3>
                        <select
                            value={anomalyFilter}
                            onChange={e => setAnomalyFilter(e.target.value)}
                            className="btn btn-sm"
                            style={{ fontSize: '0.7rem' }}
                        >
                            <option value="all">Todas</option>
                            {Object.entries(anomalyTypes).map(([type, count]) => (
                                <option key={type} value={type}>{type} ({count})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredAnomalies.slice(-30).reverse().map((a, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.4rem 0.5rem',
                                    borderLeft: '4px solid #FF3333',
                                    background: '#111417',
                                    fontSize: '0.75rem',
                                    marginBottom: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ color: '#FF3333' }}>{a.type}</strong>
                                    <span style={{ color: '#888', fontSize: '0.65rem' }}>
                                        Sem {a.week} • Temp {a.season}
                                    </span>
                                </div>
                                <div style={{ marginTop: '2px' }}>{a.msg}</div>
                                {a.ctx && Object.keys(a.ctx).length > 0 && (
                                    <pre style={{ fontSize: '0.65rem', color: '#888', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(a.ctx, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* Recent decisions */}
            {stats?.decisions && stats.decisions.length > 0 && (
                <EfPanel variant="elev" padding="md">
                    <h3 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', marginBottom: '8px', color: '#FFD700', textShadow: '2px 2px 0 #000' }}>📋 ÚLTIMAS DECISÕES (20)</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {stats.decisions.slice(-20).reverse().map((d, i) => (
                            <div key={i} style={{ padding: '2px 4px', borderBottom: '1px solid #111417' }}>
                                <span style={{ color: '#888' }}>W{d.week}</span>{' '}
                                <strong style={{ color: '#FFD700' }}>{d.action}</strong>{' '}
                                <span>{JSON.stringify(d.args)}</span>
                                {d.elapsedMs > 0 && <span style={{ color: '#888' }}> ({d.elapsedMs.toFixed(0)}ms)</span>}
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}
            </div>

            {/* Pacing Friction Modal Auto-Resolution UI */}
            {pacingQueue.length > 0 && (() => {
                const evt = pacingQueue[0];
                const sevColors = { critical: '#FF3333', warning: '#FFD700', info: '#40BAF7' };
                const borderColor = sevColors[evt.severity] || '#40BAF7';
                return (
                    <EfModal title={evt.title} onClose={() => {}}>
                        <div style={{ borderLeft: `4px solid ${borderColor}`, paddingLeft: '16px', marginBottom: '24px' }}>
                            <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>{evt.body}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: '#888', fontStyle: 'italic', padding: '8px' }}>
                                🤖 Auto-resolvendo (Soak Test)...
                            </div>
                        </div>
                    </EfModal>
                );
            })()}
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div style={{
            padding: '8px',
            background: '#1E2124',
            border: '3px solid #000',
            textAlign: 'center'
        }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', color: '#888', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', fontWeight: 700, color: color || '#E2E8F0', marginTop: '4px' }}>
                {value}
            </div>
        </div>
    );
}

function GDDStatus({ label, emoji, count }) {
    const fired = count > 0;
    return (
        <div style={{
            padding: '6px 10px',
            background: fired ? '#111417' : '#1A0A0A',
            border: `3px solid ${fired ? '#39FF14' : '#FF3333'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px'
        }}>
            <span>
                {fired ? '✅' : '❌'} {emoji} {label}
            </span>
            <strong style={{
                color: fired ? '#6ABC3A' : '#ef4444',
                fontSize: '0.8rem',
                minWidth: '28px',
                textAlign: 'right'
            }}>
                {count}×
            </strong>
        </div>
    );
}

export default AutoPlayView;
