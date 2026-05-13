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
import {
    Robot, Target, Trophy, ArrowsClockwise, CurrencyDollar,
    ChartBar, TrendUp, TrendDown, Lightning, CheckCircle, XCircle,
    DownloadSimple, PersonSimpleWalk, PersonSimpleRun, Rocket, GitDiff,
    Play, Pause, Stop, Brain, WarningCircle, ClipboardText
} from '@phosphor-icons/react';
import bgSoakTest from '../assets/environments/bg_soak_test.png';
import '../styles/autoplay-view.css';

const SPEED_PRESETS = [
    { label: 'Slow', icon: GitDiff,           delay: 500 },
    { label: '1×',   icon: PersonSimpleWalk,  delay: 200 },
    { label: '5×',   icon: PersonSimpleRun,   delay: 50 },
    { label: '20×',  icon: Rocket,            delay: 10 },
    { label: 'Max',  icon: Lightning,         delay: 1 }
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
            // Clear all existing olefut saves to start fresh
            try {
                if (typeof localStorage !== 'undefined') {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith('olefut_')) localStorage.removeItem(k);
                    }
                }
            } catch { /* ignore */ }
            setDifficulty(setupDifficultyId);
            startGame('AutoPlayBot', parseInt(setupTeamId), setupScenario, 'manager', 'ATA', 'maverick');
            setTimeout(() => changeView('autoplay'), 100);
        };

        return (
            <div
                className="ef-anim-fade-in ef-scene-shell ef-ap"
                /* eslint-disable-next-line no-restricted-syntax -- dynamic per-instance bg image */
                style={{ backgroundImage: `url(${bgSoakTest})` }}
            >
                <div className="ef-ap__container-sm">
                    <EfPanel variant="elev" padding="md" className="ef-ap__header-flex">
                        <h2 className="ef-arcade-h ef-arcade-h--xxl">
                            <Robot size={22} weight="fill" style={{verticalAlign:'-3px',marginRight:'8px'}} />
                            AUTOPLAY SETUP
                        </h2>
                        <EfButton variant="secondary" size="sm" onClick={() => changeView('start')}>← VOLTAR</EfButton>
                    </EfPanel>
                    <EfPanel variant="elev" padding="md">
                        <p className="ef-ap__setup-info">
                        Configure o bot antes de iniciar o soak test.
                    </p>

                    <label className="ef-ap__field-label">ZONA</label>
                    <div className="ef-ap__chip-row-wrap">
                        {zones.map(z => (
                            <EfButton
                                key={z}
                                variant={setupZone === z ? 'primary' : 'secondary'}
                                onClick={() => { setSetupZone(z); setSetupTeamId(''); }}
                                className="ef-ap__setup-zone-btn"
                            >{z}</EfButton>
                        ))}
                    </div>

                    <label className="ef-ap__field-label">DIVISÃO</label>
                    <div className="ef-ap__chip-row">
                        {[1, 2, 3, 4].map(d => (
                            <EfButton
                                key={d}
                                variant={setupDiv === d ? 'primary' : 'secondary'}
                                onClick={() => { setSetupDiv(d); setSetupTeamId(''); }}
                                className="ef-ap__chip-input"
                            >Div {d}</EfButton>
                        ))}
                    </div>

                    <label className="ef-ap__field-label">
                        TIME ({filteredTeams.length} disponíveis)
                    </label>
                    <select
                        value={setupTeamId}
                        onChange={e => setSetupTeamId(e.target.value)}
                        className="ef-ap__setup-select"
                    >
                        <option value="">Selecione o time...</option>
                        {filteredTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <label className="ef-ap__field-label">CENÁRIO</label>
                    <div className="ef-ap__chip-row">
                        <EfButton
                            variant={setupScenario === 'livre' ? 'primary' : 'secondary'}
                            onClick={() => setSetupScenario('livre')}
                            className="ef-ap__chip-input"
                        >Livre</EfButton>
                        <EfButton
                            variant={setupScenario === 'fallen' ? 'primary' : 'secondary'}
                            onClick={() => setSetupScenario('fallen')}
                            className="ef-ap__chip-input"
                        ><TrendDown size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />Gigante Caído</EfButton>
                    </div>

                    <label className="ef-ap__field-label">DIFICULDADE</label>
                    <div className="ef-ap__chip-row-wrap ef-ap__chip-row-wrap--mb-1">
                        {Object.values(DIFFICULTY_MODES).map(d => (
                            <EfButton
                                key={d.id}
                                variant={setupDifficultyId === d.id ? 'primary' : 'secondary'}
                                onClick={() => setSetupDifficultyId(d.id)}
                                className="ef-ap__setup-diff-btn"
                                title={d.description}
                            >{d.emoji} {d.name}</EfButton>
                        ))}
                    </div>

                    <EfButton
                        variant="primary"
                        onClick={handleSetupStart}
                        disabled={!setupTeamId}
                        className="ef-ap__setup-submit"
                    >
                        <Lightning size={16} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                        INICIAR AUTOPLAY
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
                localStorage.removeItem('olefut_autoplay_brain');
                // Surgically clear log arrays in stats but preserve counters
                const raw = localStorage.getItem('olefut_autoplay_state');
                if (raw) {
                    const stats = JSON.parse(raw);
                    if (stats && typeof stats === 'object') {
                        stats.anomalies = [];
                        stats.successes = [];
                        stats.decisions = [];
                        stats.seasonHistory = [];
                        localStorage.setItem('olefut_autoplay_state', JSON.stringify(stats));
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
            'NEW GAME+\n\n'
            + 'Salva o ML treinado (Q-table + personalidade + memória)\n'
            + 'e ZERA todo o gameplay (seasons, stats, resultados).\n\n'
            + 'O bot recomeça da temporada 1 mas com todo o aprendizado intacto.\n\n'
            + 'Continuar?'
        )) return;
        try {
            const snapshot = controllerRef.current.newGamePlus();
            window.alert(
                `NEW GAME+ ativado!\n\n`
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
                // BUG-074: também limpar main save (olefut_save_v1) — antes ficava
                // game state Flamengo persistido após Reset Tudo.
                localStorage.removeItem('olefut_autoplay_brain');
                localStorage.removeItem('olefut_autoplay_state');
                localStorage.removeItem('olefut_llm_mode');
                localStorage.removeItem('olefut_save_v1');
                localStorage.removeItem('olefut_genetic_state');
                // Sweep any other olefut_* keys defensively
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('olefut_')) localStorage.removeItem(k);
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
        if (score >= 70) return 'var(--primary)';
        if (score >= 40) return 'var(--accent)';
        return 'var(--danger)';
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

    // Compute Stitch hero bento stats (derived from real engine telemetry)
    const winRate = stats?.matchesPlayed > 0
        ? Math.round((stats.wins / stats.matchesPlayed) * 100)
        : 0;
    const titlesCount = stats?.insights?.titlesWon ?? 0;
    const anomaliesCount = stats?.anomalies?.length ?? 0;
    const seasonsCount = stats?.seasonsPlayed ?? 0;
    const isStable = anomaliesCount === 0;

    return (
        <div
            className="ef-anim-fade-in ef-scene-shell ef-ap"
            /* eslint-disable-next-line no-restricted-syntax -- dynamic per-instance bg image */
            style={{ backgroundImage: `url(${bgSoakTest})` }}
        >
            {/* Stitch scanline overlay — CRT retro effect */}
            <div className="ef-ap__scanlines" aria-hidden="true" />

            <div className="ef-ap__container-md">
                <EfPanel variant="elev" padding="md" className="ef-ap__hero-header">
                    <div className="ef-ap__hero-left">
                        <h2 className="ef-arcade-h ef-arcade-h--xl ef-ap__crt-glow">
                            <Robot size={20} weight="fill" style={{verticalAlign:'-3px',marginRight:'8px'}} />
                            SOAK TEST DASHBOARD
                        </h2>
                        <div className="ef-ap__sim-badge">
                            <span className={`ef-ap__sim-dot${stats?.running ? ' ef-ap__sim-dot--active' : ''}`} />
                            <span className="ef-ap__sim-label">
                                {stats?.running ? 'SIMULATION ACTIVE' : 'SIMULATION IDLE'}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                {/* Stitch hero bento — top-line counters from real engine stats */}
                <div className="ef-ap__bento-row">
                    <div className="ef-ap__bento-stats">
                        <div className="ef-ap__bento-cell">
                            <p className="ef-ap__bento-label">TEMPORADAS</p>
                            <p className="ef-ap__bento-value ef-ap__crt-glow">{seasonsCount}</p>
                        </div>
                        <div className="ef-ap__bento-cell">
                            <p className="ef-ap__bento-label">TAXA VITÓRIA</p>
                            <p className="ef-ap__bento-value ef-ap__bento-value--accent">{winRate}%</p>
                        </div>
                        <div className="ef-ap__bento-cell">
                            <p className="ef-ap__bento-label">TÍTULOS</p>
                            <p className="ef-ap__bento-value ef-ap__crt-glow">{titlesCount}</p>
                        </div>
                        <div className="ef-ap__bento-cell">
                            <p className="ef-ap__bento-label">ANOMALIAS</p>
                            <div className="ef-ap__bento-anomaly">
                                <p className={`ef-ap__bento-value${isStable ? ' ef-ap__crt-glow' : ' ef-ap__bento-value--danger'}`}>{anomaliesCount}</p>
                                <span className={`ef-ap__bento-tag${isStable ? ' ef-ap__bento-tag--stable' : ' ef-ap__bento-tag--unstable'}`}>
                                    {isStable ? 'STABLE' : 'ALERT'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="ef-ap__bento-velocity">
                        <p className="ef-ap__bento-label ef-ap__bento-velocity-title">SIMULATION VELOCITY</p>
                        <div className="ef-ap__velocity-grid">
                            {SPEED_PRESETS.map(p => {
                                const active = speed === p.delay;
                                const isMax = p.delay === 1;
                                const cellClass = active
                                    ? `ef-ap__velocity-cell ef-ap__velocity-cell--active${isMax ? ' ef-ap__velocity-cell--max' : ''}`
                                    : 'ef-ap__velocity-cell';
                                const IconComp = p.icon;
                                return (
                                    <button
                                        key={p.delay}
                                        type="button"
                                        onClick={() => handleSpeedChange(p.delay)}
                                        className={cellClass}
                                        title={p.label}
                                        aria-label={`Velocidade ${p.label}`}
                                    >
                                        <IconComp size={14} weight={active ? 'fill' : 'bold'} style={{verticalAlign:'-2px',marginRight:'4px'}} />
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            {/* Controls */}
            <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                <div className="ef-ap__chip-wrap-mb">
                    {!stats?.running ? (
                        <EfButton variant="primary" onClick={handleStart}>
                            <Play size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />Iniciar
                        </EfButton>
                    ) : (
                        <EfButton variant="secondary" onClick={handlePause}>
                            <Pause size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />Pausar
                        </EfButton>
                    )}
                    <EfButton variant="secondary" onClick={handleStop}>
                        <Stop size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />Parar
                    </EfButton>
                    <EfButton variant="secondary" onClick={handleExport}>
                        <DownloadSimple size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />Exportar Relatório JSON
                    </EfButton>
                    <EfButton variant="secondary" onClick={handleExportTelemetry}>
                        <ChartBar size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />Export Telemetry JSON
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleResetBrain}
                        title="Reset Q-table — bot esquece aprendizado, stats permanecem"
                        className="ef-ap__danger-btn"
                    >
                        <Brain size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />Reset Brain
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleNewGamePlus}
                        title="NEW GAME+ — salva ML treinado, zera gameplay. Recomeça com o aprendizado intacto."
                        className="ef-ap__accent-btn-bold"
                    >
                        <Brain size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />New Game+
                    </EfButton>
                    <EfButton
                        variant="secondary"
                        onClick={handleResetAll}
                        title="Reset TUDO — apaga brain + stats + telemetry. Sem volta."
                        className="ef-ap__danger-btn-bold"
                    >
                        <XCircle size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />Reset Tudo
                    </EfButton>
                </div>

                {/* SPEC-119: LLM Bridge panel — buy/sell decision engine */}
                <EfPanel variant="sunk" padding="md" className="ef-ap__llm-panel">
                    <div className="ef-ap__llm-header">
                        <span><Brain size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />BUY/SELL ENGINE (SPEC-119)</span>
                        <span className="ef-ap__llm-mode-tag">
                            mode: <strong>{llmStatus.mode}</strong>
                        </span>
                    </div>
                    {llmStatus.mode === 'webllm' && (
                        <div style={{ fontSize: '0.72rem', color: llmStatus.loadStatus === 'error' ? 'var(--danger)' : 'var(--ef-ap-info-grey)' }}>
                            status: <strong>{llmStatus.loadStatus}</strong>
                            {llmStatus.loadProgress > 0 && llmStatus.loadProgress < 1 && (
                                <span> ({(llmStatus.loadProgress * 100).toFixed(0)}%)</span>
                            )}
                            {llmStatus.loadStatus === 'ready' && <span className="ef-ap__llm-ready"> ✓ LLM ativo</span>}
                            {llmStatus.loadStatus === 'error' && llmStatus.error && (
                                <div className="ef-ap__llm-error-detail">{llmStatus.error}</div>
                            )}
                        </div>
                    )}
                    <div className="ef-ap__llm-actions">
                        {llmStatus.mode === 'heuristic' ? (
                            <EfButton
                                variant="secondary"
                                size="sm"
                                onClick={handleLoadLLM}
                                className="ef-ap__llm-load-btn"
                                title="Load WebLLM Llama 3.2 1B (~700MB first time, cached after)"
                            >
                                <Brain size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />Carregar WebLLM
                            </EfButton>
                        ) : (
                            <EfButton
                                variant="secondary"
                                size="sm"
                                onClick={handleResetLLM}
                                className="ef-ap__llm-reset-btn"
                            >
                                <ArrowsClockwise size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />Voltar Heurística
                            </EfButton>
                        )}
                    </div>
                </EfPanel>

                {/* SPEC-115/116/117: Brain panel — adaptive learning telemetry */}
                {stats?.brain && (
                    <EfPanel variant="sunk" padding="md" className="ef-ap__brain-panel">
                        <div className="ef-arcade-h ef-arcade-h--md ef-ap__brain-title">
                            <Brain size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />BRAIN (SPEC-115/116/117)
                        </div>
                        <div className="ef-ap__brain-stats-row">
                            <span>States: <strong>{stats.brain.states ?? 0}</strong></span>
                            <span>Updates: <strong>{stats.brain.totalUpdates ?? 0}</strong></span>
                        </div>
                        {stats.brain.topActions?.length > 0 && (
                            <div className="ef-ap__brain-top-actions">
                                Top actions:&nbsp;
                                {stats.brain.topActions.slice(0, 3).map((a, i) => (
                                    <span key={i} className="ef-ap__brain-action-item">
                                        {a.action} <strong style={{ color: a.totalQ >= 0 ? 'var(--ef-ap-success-green)' : 'var(--ef-ap-fail-red)' }}>
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

                <div className="ef-ap__heading-grey">
                    VELOCIDADE ATIVA: {speed}ms/week — controles no painel SIMULATION VELOCITY acima
                </div>
            </EfPanel>

            {/* Live stats grid */}
            {stats && (
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <h3 className="ef-arcade-h ef-arcade-h--lg ef-ap__h-mb-8">
                        <ChartBar size={16} weight="bold" style={{verticalAlign:'-3px',marginRight:'6px'}} />
                        ESTATÍSTICAS LIVE
                    </h3>
                    <div className="ef-ap__stats-grid">
                        <Stat label="Status" value={stats.running ? 'Rodando' : 'Pausado'} />
                        <Stat label="Semanas" value={stats.weeksPlayed} />
                        <Stat label="Temporadas" value={stats.seasonsPlayed} />
                        <Stat label="Semana atual" value={`${stats.currentWeek || 0}/${(stats.currentSeason || 1) * 38}`} />
                        <Stat label="Tempo (s)" value={elapsedSec} />
                        <Stat label="Weeks/sec" value={wps} />
                        <Stat label="Matches" value={stats.matchesPlayed} />
                        <Stat label="V/E/D" value={`${stats.wins}/${stats.draws}/${stats.losses}`} />
                        <Stat label="Transfers" value={stats.transfers} />
                        <Stat label="Decisions" value={stats.decisions?.length || 0} />
                        <Stat label="Errors" value={stats.errorCount} color={stats.errorCount > 0 ? 'var(--danger)' : 'var(--primary)'} />
                        <Stat label="Anomalies" value={stats.anomalies?.length || 0} color={(stats.anomalies?.length || 0) > 0 ? 'var(--accent)' : 'var(--ef-ap-soft-text)'} />
                    </div>
                </EfPanel>
            )}

            {/* Insights summary */}
            {stats?.insights && (
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <h3 className="ef-arcade-h ef-arcade-h--lg ef-ap__h-mb-8">
                        <TrendUp size={16} weight="bold" style={{verticalAlign:'-3px',marginRight:'6px'}} />
                        INSIGHTS DA CARREIRA
                    </h3>
                    <div className="ef-ap__insights-grid">
                        <Stat label="Títulos" value={stats.insights.titlesWon} color="var(--accent)" />
                        <Stat label="Promoções" value={stats.insights.promotionsWon} color="var(--primary)" />
                        <Stat label="Rebaixamentos" value={stats.insights.relegationsTaken} color="var(--danger)" />
                        <Stat label="Hat-tricks" value={stats.insights.hatTricks} />
                        <Stat label="Clean sheets" value={stats.insights.cleanSheets} />
                        <Stat label="Maior streak V" value={stats.insights.longestWinStreak} color="var(--primary)" />
                        <Stat label="Maior streak D" value={Math.abs(stats.insights.longestLossStreak || 0)} color="var(--danger)" />
                        <Stat label="Peak posição" value={stats.insights.peakStanding === Infinity ? '-' : stats.insights.peakStanding + 'º'} />
                        <Stat label="Pior posição" value={stats.insights.worstStanding ? stats.insights.worstStanding + 'º' : '-'} />
                        <Stat label="Pico R$" value={`${(stats.insights.peakBalance / 1e6).toFixed(0)}M`} color="var(--accent)" />
                        <Stat label="Maior goleada" value={stats.insights.biggestWin?.score || '-'} />
                        <Stat label="Pior derrota" value={stats.insights.worstLoss?.score || '-'} color="var(--danger)" />
                    </div>
                </EfPanel>
            )}

            {/* §23: GDD Systems Status — LIVE PROOF */}
            {stats && (
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <h3 className="ef-arcade-h ef-arcade-h--md ef-ap__h-mb-8">
                        <Target size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                        GDD SYSTEMS STATUS — LIVE
                    </h3>
                    <div className="ef-ap__gdd-grid">
                        <GDDStatus
                            label="§12.4 #6 Scarcity"
                            count={stats.decisions?.filter(d => d.action === 'SCARCITY_WINDOW').length || 0}
                        />
                        <GDDStatus
                            label="§12.4 #8 Dread"
                            count={stats.decisions?.filter(d => d.action === 'DREAD_RELEGATION').length || 0}
                        />
                        <GDDStatus
                            label="§14.2 Challenge Win"
                            count={stats.successes?.filter(s => s.type === 'CHALLENGE_WIN').length || 0}
                        />
                        <GDDStatus
                            label="§16.2 Trophy Ceremony"
                            count={stats.successes?.filter(s => s.type === 'TROPHY_CEREMONY').length || 0}
                        />
                        <GDDStatus
                            label="§17 Press Conference"
                            count={stats.decisions?.filter(d => d.action === 'PRESS_CONFERENCE').length || 0}
                        />
                        <GDDStatus
                            label="§17 Team Talk"
                            count={stats.decisions?.filter(d => d.action === 'TEAM_TALK').length || 0}
                        />
                        <GDDStatus
                            label="§17 Narrative Events"
                            count={stats.decisions?.filter(d => d.action === 'NARRATIVE_EVENTS').length || 0}
                        />
                        <GDDStatus
                            label="§15.3 Contract Renewal"
                            count={stats.decisions?.filter(d => d.action === 'CONTRACT_RENEWAL').length || 0}
                        />
                        <GDDStatus
                            label="§19.1 View Unlock"
                            count={stats.decisions?.filter(d => d.action === 'VISIT_VIEW').length || 0}
                        />
                        <GDDStatus
                            label="§22 Substitutions"
                            count={stats.decisions?.filter(d => d.action === 'SUBSTITUTION').length || 0}
                        />
                        <GDDStatus
                            label="Training"
                            count={stats.decisions?.filter(d => d.action === 'TRAIN').length || 0}
                        />
                        <GDDStatus
                            label="Market / Buy"
                            count={stats.decisions?.filter(d => d.action === 'BUY_OFFER' || d.action === 'MARKET_INQUIRY').length || 0}
                        />
                        <GDDStatus
                            label="Formation / Tactic"
                            count={stats.decisions?.filter(d => d.action === 'FORMATION' || d.action === 'TACTIC').length || 0}
                        />
                        <GDDStatus
                            label="Scouted / Signed"
                            count={stats.decisions?.filter(d => d.action === 'SIGN_SCOUTED').length || 0}
                        />
                        <GDDStatus
                            label="Staff Mgmt"
                            count={stats.decisions?.filter(d => d.action === 'HIRE_STAFF' || d.action === 'FIRE_STAFF').length || 0}
                        />
                        <GDDStatus
                            label="Stadium / Academy"
                            count={stats.decisions?.filter(d => d.action === 'UPGRADE_STADIUM' || d.action === 'UPGRADE_ACADEMY').length || 0}
                        />
                    </div>
                    <div className="ef-ap__gdd-footer">
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
                            const color = pct >= 80 ? 'var(--ef-ap-success-green)' : pct >= 50 ? 'var(--ef-ap-warn-amber)' : 'var(--ef-ap-err-red)';
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
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <div
                        onClick={() => setTelemetryOpen(!telemetryOpen)}
                        className="ef-ap__telemetry-header"
                    >
                        <h3 className="ef-arcade-h ef-arcade-h--md">
                            <ChartBar size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                            Telemetria ({Object.keys(stats.telemetry.results).length} detectores)
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: scoreColor(stats.telemetry.overallScore) }}>
                                Score Geral: {stats.telemetry.overallScore}
                            </span>
                        </h3>
                        <span className="ef-ap__telemetry-toggle">
                            {telemetryOpen ? '▼ Recolher' : '▶ Expandir'}
                        </span>
                    </div>
                    {telemetryOpen && (
                        <div className="ef-ap__telemetry-grid">
                            {Object.entries(stats.telemetry.results).map(([spec, res]) => (
                                <div
                                    key={spec}
                                    onClick={() => setExpandedSpec(expandedSpec === spec ? null : spec)}
                                    className="ef-ap__telemetry-card"
                                    style={{ border: `3px solid ${scoreColor(res.score)}` }}
                                >
                                    <div className="ef-ap__telemetry-card-head">
                                        <strong className="ef-ap__telemetry-card-name">{spec}</strong>
                                        <span style={{ fontWeight: 700, color: scoreColor(res.score) }}>{res.score}</span>
                                    </div>
                                    <div className="ef-ap__telemetry-card-desc">
                                        {res.name}
                                    </div>
                                    {res.signals?.[0] && (
                                        <div className="ef-ap__telemetry-signal-top" style={{ color: scoreColor(100 - (res.signals[0].severity * 100)) }}>
                                            <WarningCircle size={11} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />{res.signals[0].id}
                                        </div>
                                    )}
                                    {expandedSpec === spec && res.signals?.length > 0 && (
                                        <div className="ef-ap__telemetry-signal-list">
                                            {res.signals.slice(0, 5).map((s, i) => (
                                                <div key={i} className="ef-ap__telemetry-signal-item">
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
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <h3 className="ef-arcade-h ef-arcade-h--md ef-arcade-h--primary ef-ap__h-mb-8">
                        <CheckCircle size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                        SUCCESSES ({stats.successes.length})
                    </h3>
                    <div className="ef-ap__entry-types-line">
                        Por tipo: {Object.entries(successTypes).map(([t, n]) => `${t}(${n})`).join(' • ')}
                    </div>
                    <div className="ef-ap__entry-scroll">
                        {stats.successes.slice(-20).reverse().map((s, i) => (
                            <div key={i} className="ef-ap__entry-success">
                                <div className="ef-ap__row-spread">
                                    <strong className="ef-ap__entry-type-success">{s.type}</strong>
                                    <span className="ef-ap__label-tag">
                                        Sem {s.week} • Temp {s.season}
                                    </span>
                                </div>
                                <div className="ef-ap__entry-msg">{s.msg}</div>
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* Anomalies catalog */}
            {stats?.anomalies && stats.anomalies.length > 0 && (
                <EfPanel variant="elev" padding="md" className="ef-ap__panel-mb-sm">
                    <div className="ef-ap__anomaly-bar">
                        <h3 className="ef-arcade-h ef-arcade-h--md ef-arcade-h--danger">
                            <WarningCircle size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                            ANOMALIES ({stats.anomalies.length})
                        </h3>
                        <select
                            value={anomalyFilter}
                            onChange={e => setAnomalyFilter(e.target.value)}
                            className="btn btn-sm ef-ap__anomaly-select"
                        >
                            <option value="all">Todas</option>
                            {Object.entries(anomalyTypes).map(([type, count]) => (
                                <option key={type} value={type}>{type} ({count})</option>
                            ))}
                        </select>
                    </div>
                    <div className="ef-ap__entry-scroll--tall">
                        {filteredAnomalies.slice(-30).reverse().map((a, i) => (
                            <div key={i} className="ef-ap__entry-anomaly">
                                <div className="ef-ap__row-spread">
                                    <strong className="ef-ap__entry-type-danger">{a.type}</strong>
                                    <span className="ef-ap__label-tag">
                                        Sem {a.week} • Temp {a.season}
                                    </span>
                                </div>
                                <div className="ef-ap__entry-msg">{a.msg}</div>
                                {a.ctx && Object.keys(a.ctx).length > 0 && (
                                    <pre className="ef-ap__entry-ctx">
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
                    <h3 className="ef-arcade-h ef-arcade-h--md ef-ap__h-mb-8">
                        <ClipboardText size={14} weight="bold" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                        ÚLTIMAS DECISÕES (20)
                    </h3>
                    <div className="ef-mono ef-ap__decisions-list">
                        {stats.decisions.slice(-20).reverse().map((d, i) => (
                            <div key={i} className="ef-ap__decision-row">
                                <span className="ef-ap__decision-week">W{d.week}</span>{' '}
                                <strong className="ef-ap__decision-action">{d.action}</strong>{' '}
                                <span>{JSON.stringify(d.args)}</span>
                                {d.elapsedMs > 0 && <span className="ef-ap__decision-elapsed"> ({d.elapsedMs.toFixed(0)}ms)</span>}
                            </div>
                        ))}
                    </div>
                </EfPanel>
            )}
            </div>

            {/* Pacing Friction Modal Auto-Resolution UI */}
            {pacingQueue.length > 0 && (() => {
                const evt = pacingQueue[0];
                const sevColors = { critical: 'var(--danger)', warning: 'var(--accent)', info: 'var(--ef-ap-info)' };
                const borderColor = sevColors[evt.severity] || 'var(--ef-ap-info)';
                return (
                    <EfModal title={evt.title} onClose={() => {}}>
                        <div className="ef-ap__pacing-body" style={{ borderLeft: `4px solid ${borderColor}` }}>
                            <p className="ef-sans ef-text-main ef-ap__pacing-text">{evt.body}</p>
                        </div>
                        <div className="ef-ap__pacing-actions">
                            <div className="ef-ap__pacing-resolving">
                                <Robot size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />
                                Auto-resolvendo (Soak Test)...
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
        <div className="ef-arcade-stat">
            <div className="ef-arcade-stat__label">
                {label}
            </div>
            <div className="ef-arcade-stat__value" style={color ? { color } : undefined}>
                {value}
            </div>
        </div>
    );
}

function GDDStatus({ label, count }) {
    const fired = count > 0;
    return (
        <div className={`ef-arcade-cell${fired ? ' ef-arcade-cell--fired' : ' ef-ap__gdd-cell-empty'}`}>
            <span>
                {fired
                    ? <CheckCircle size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px',color:'var(--primary)'}} />
                    : <XCircle size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px',color:'var(--danger)'}} />}
                {label}
            </span>
            <strong
                className="ef-ap__gdd-cell-count"
                style={{ color: fired ? 'var(--ef-ap-success-green)' : 'var(--ef-ap-err-red)' }}
            >
                {count}×
            </strong>
        </div>
    );
}

export default AutoPlayView;
