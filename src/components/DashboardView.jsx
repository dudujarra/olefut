import React, { useState, useCallback } from 'react';
import { AnimatedStat } from '../hooks/useCountUp';
import { Help } from './Help';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';
import { STAFF_ROLES, SCOUT_REGIONS, getStadiumInfo } from '../engine/StadiumSystem';
import { getAcademyUpgradeCost } from '../engine/YouthAcademy';
import { getClubColors } from '../data/clubColors';
import { ChallengesWidget } from './ChallengesWidget';
import { getAllAchievements } from '../engine/MetaProgression';
import TrophyCeremony from './TrophyCeremony';
import { UnlockTooltip, AhaMomentCard, AchievementPopup } from './ProgressiveDisclosure';
import { ScarcityBanner, DreadIndicator, useKeyboardNav, TutorialOverlay, IronmanMode } from './GDDSystems';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import { EfModal } from './ui/EfModal';
import { 
  Users, ShoppingCart, ChartBar, SoccerBall, TrendUp, TrendDown, Heartbeat,
  Newspaper, Lightning, Envelope, Wallet, Bank, Building, GraduationCap, Binoculars, 
  Megaphone, Microphone, MicrophoneStage, Lightbulb, WarningCircle, ChartLineUp
} from '@phosphor-icons/react';

import '../styles/trophy-ceremony.css';
import '../styles/progressive-disclosure.css';
import '../styles/gdd-systems.css';
import '../styles/dashboard-view.css';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    
    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview');
    const [pendingUnlock, setPendingUnlock] = useState(null);
    const [pendingAchievement, setPendingAchievement] = useState(null);
    const [pacingQueue, setPacingQueue] = useState([]);
    const [showTutorial, setShowTutorial] = useState(() => {
        try { return !localStorage.getItem('olefut_tutorial_done') && (engine?.seasonNumber || 1) === 1; }
        catch { return false; }
    });
    // SPEC-167: manager advice panel state
    const [advicePanel, setAdvicePanel] = useState({ open: false, loading: false, text: '' });

    useKeyboardNav({ changeView, currentView: gameState?.view || 'dashboard' });

    // BUG-081 (SPEC-158): aceitável — abre modais em resposta a eventos da engine (unlock/achievement).
    // Event-subscriber side-effect. setState dispara render que mostra modal.
    /* eslint-disable react-hooks/set-state-in-effect */
    React.useEffect(() => {
        if (!team) return;
        if (!engine?.weekEvents) return;
        const unlockEvent = engine.weekEvents.find(e => typeof e === 'string' && e.includes('🔓 Novo acesso'));
        if (unlockEvent) {
            const match = unlockEvent.match(/desbloqueado: (\w+)/);
            if (match && match[1]) setPendingUnlock(match[1]);
        }
        const achieveEvent = engine.weekEvents.find(e => typeof e === 'string' && (e.includes('🏆 CONQUISTA') || e.includes('🎖️')));
        if (achieveEvent) {
            setPendingAchievement({ emoji: '🏅', name: 'Conquista Desbloqueada!', description: achieveEvent });
        }
    }, [engine?.currentWeek]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // SPEC-167: triggers the LLM-or-template manager advice.
    // Declared before early return to keep React hook ordering stable (BUG-021).
    const handleAuxiliarAdvice = useCallback(async () => {
        if (!engine?.llmNarrative || !team) return;
        setAdvicePanel({ open: true, loading: true, text: '' });
        const standings = engine.getStandings ? engine.getStandings(team.zone, team.division) : [];
        const myPos = standings.findIndex(s => s.teamId === team.id) + 1;
        const avgOvr = team.squad?.length
            ? Math.round(team.squad.reduce((s, p) => s + (p.ovr || 50), 0) / team.squad.length)
            : 50;
        const divisionAvg = standings.length
            ? Math.round(standings.reduce((s, row) => {
                const t = engine.getTeam ? engine.getTeam(row.teamId) : null;
                if (!t || !t.squad) return s;
                return s + Math.round(t.squad.reduce((ss, p) => ss + (p.ovr || 50), 0) / t.squad.length);
            }, 0) / standings.length)
            : 50;
        try {
            const text = await engine.llmNarrative.managerAdvice({
                ownTeam: { name: team.name, avgOvr, formation: team.formation, currentTactic: engine.currentTactic },
                opponent: { name: 'Próximo adversário', avgOvr: divisionAvg, recentForm: engine.managerStats?.rollingForm?.slice(-5) || [] },
                position: myPos || 0,
                totalTeams: standings.length || 20,
            });
            setAdvicePanel({ open: true, loading: false, text });
        } catch {
            setAdvicePanel({ open: true, loading: false, text: 'Auxiliar indisponível no momento.' });
        }
    }, [engine, team]);

    if (!team) return <div className="main-content" style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>Time não encontrado.</div>;

    const sectors = engine.getTeamSectors(team.id);
    const standings = engine.getStandings(team.zone, team.division);
    const pos = standings.findIndex(s => s.teamId === team.id) + 1;
    const avgMoral = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
    const avgEnergy = team.squad.reduce((s, p) => s + p.energy, 0) / team.squad.length;
    const stats = engine.managerStats;
    const cond = engine.matchCondition;
    const boardStatus = engine.board ? engine.board.getStatus() : null;
    const injured = team.squad.filter(p => p.injury);
    const expiringContracts = team.squad.filter(p => p.contract && p.contract.weeksLeft <= 8);
    const stadiumInfo = getStadiumInfo(engine.stadiumLevel);
    const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;

    const handleTrain = (id) => { const result = engine.doTraining(id); setLog(result.msg); forceUpdate(); };
    const handleTeamTalk = (id) => { const result = engine.doTeamTalk(id); if (result.success) setLog(`"${result.talk.text}"`); forceUpdate(); };
    const handleAcceptOffer = (playerId) => { const result = engine.acceptTransferOffer(playerId); setLog(result.msg); forceUpdate(); };
    const handleRejectOffer = (playerId) => { engine.rejectTransferOffer(playerId); setLog('Oferta recusada.'); forceUpdate(); };

    // SPEC-176/183: Stitch-aligned next-match preview data (real engine, no hallucinated names)
    const nextOpponentName = (engine.nextMatch?.opponentName) || (engine.getNextOpponent?.()?.name) || 'PRÓXIMO ADVERSÁRIO';
    const stadiumLabel = (stadiumInfo?.name || 'ESTÁDIO').toUpperCase();
    const teamColors = getClubColors(team.name);

    return (
        <div className="ef-dashboard-container" style={{
            '--team-primary': teamColors.primary,
            '--team-secondary': teamColors.secondary,
            '--team-accent': teamColors.accent
        }}>
            <div className="ef-dashboard-inner">
                <TrophyCeremony trophy={engine.trophyCeremony?.trophy} season={engine.trophyCeremony?.season} visible={!!engine.trophyCeremony} onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }} />

                {/* === HEADER — Stitch hero bar (team identity + balance + season) === */}
                <EfPanel variant="hero" padding="lg" className="ef-dashboard-header">
                    <div className="ef-dashboard-header__left">
                        <div className="ef-dashboard-team-badge">
                            {pos}º • SÉRIE {['A','B','C','D'][team.division - 1]}
                        </div>
                        <h2 className="ef-dashboard-team-name">
                            {team.name}
                        </h2>
                        <span className="ef-dashboard-team-stats">
                            {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? <span className="ef-dashboard-team-stats__win"><TrendUp weight="bold"/> {stats.streak}</span> : stats.streak < 0 ? <span className="ef-dashboard-team-stats__loss"><TrendDown weight="bold"/> {Math.abs(stats.streak)}</span> : ''}
                        </span>
                    </div>
                    <div className="ef-dashboard-header__right">
                        <div className={`ef-dashboard-balance ${team.balance > 0 ? 'ef-dashboard-balance--positive' : 'ef-dashboard-balance--negative'}`}>
                            <Wallet weight="fill" className="ef-dashboard-balance__icon" />
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        {boardStatus && (
                            <div className="ef-dashboard-board-status" title={`Diretoria: ${boardStatus.label} (${engine.board?.confidence ?? 60}%).`}>
                                <span>{boardStatus.emoji}</span> {boardStatus.label}
                            </div>
                        )}
                        <div className="ef-dashboard-season-progress">
                            <div className="ef-dashboard-season-progress__info">
                                <span>SEM {seasonWeek}/38</span>
                                <span>TEMP {engine.seasonNumber}</span>
                            </div>
                            <div className="ef-progress ef-progress--xs">
                                <div className="ef-progress__fill" style={{ width: `${(seasonWeek / 38) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === HERO MATCH — Stitch "Próximo Jogo" centerpiece === */}
                <EfPanel variant="hero" padding="lg" className="ef-dashboard-hero-match">
                    <div className="ef-dashboard-hero-match__tag">PRÓXIMO JOGO</div>
                    <div className="ef-dashboard-hero-match__body">
                        <div className="ef-dashboard-hero-match__teams">
                            <div className="ef-dashboard-hero-match__team">
                                <div className="ef-dashboard-hero-match__crest ef-dashboard-hero-match__crest--home">
                                    <span className="ef-dashboard-hero-match__crest-letter">{(team.name?.[0] || 'F').toUpperCase()}</span>
                                </div>
                                <p className="ef-dashboard-hero-match__team-name">{team.name?.toUpperCase()}</p>
                            </div>
                            <div className="ef-dashboard-hero-match__vs">VS</div>
                            <div className="ef-dashboard-hero-match__team">
                                <div className="ef-dashboard-hero-match__crest ef-dashboard-hero-match__crest--away">
                                    <span className="ef-dashboard-hero-match__crest-letter">{(nextOpponentName[0] || '?').toUpperCase()}</span>
                                </div>
                                <p className="ef-dashboard-hero-match__team-name">{String(nextOpponentName).toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="ef-dashboard-hero-match__meta">
                            <div className="ef-dashboard-hero-match__info-box">
                                <p className="ef-dashboard-hero-match__info-label">ESTÁDIO: {stadiumLabel}</p>
                                <p className="ef-dashboard-hero-match__info-value">FORMAÇÃO: {team.formation}</p>
                            </div>
                            <EfButton
                                variant="primary"
                                size="lg"
                                className="ef-dashboard-hero-match__cta"
                                onClick={() => {
                                    const events = engine.getPacingEvents?.() || [];
                                    if (events.length > 0) {
                                        setPacingQueue(events);
                                    } else {
                                        engine.checkPressConference();
                                        if (!engine.pressQuestion) changeView('match'); else forceUpdate();
                                    }
                                }}
                            >
                                <SoccerBall weight="fill" /> ESCALAR E JOGAR
                            </EfButton>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                    <div className="ef-dashboard-alerts">
                        {injured.length > 0 && <EfPanel padding="sm" className="ef-dashboard-alert ef-dashboard-alert--injury"><Heartbeat color="var(--danger)" weight="fill" /><span className="ef-dashboard-alert__text ef-dashboard-alert__text--danger">{injured.length} LESIONADO{injured.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {expiringContracts.length > 0 && <EfPanel padding="sm" className="ef-dashboard-alert ef-dashboard-alert--contract"><Newspaper color="var(--accent)" weight="fill" /><span className="ef-dashboard-alert__text ef-dashboard-alert__text--secondary">{expiringContracts.length} CONTRATO{expiringContracts.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {avgEnergy < 50 && <EfPanel padding="sm" className="ef-dashboard-alert ef-dashboard-alert--energy"><Lightning color="var(--danger)" weight="fill" /><span className="ef-dashboard-alert__text ef-dashboard-alert__text--danger">CANSADO ({avgEnergy.toFixed(0)}%)</span></EfPanel>}
                        {(engine.transferOffers?.length ?? 0) > 0 && <EfPanel padding="sm" className="ef-dashboard-alert ef-dashboard-alert--transfer" style={{ cursor: 'pointer' }} onClick={() => setTab('transfers')}><Envelope color="var(--info)" weight="fill" /><span className="ef-dashboard-alert__text ef-dashboard-alert__text--info">{(engine.transferOffers?.length ?? 0)} OFERTA{(engine.transferOffers?.length ?? 0) > 1 ? 'S' : ''}</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div className="ef-dashboard-main-grid">
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div className="ef-dashboard-nav">
                        <EfPanel padding="md" className="ef-dashboard-nav__tabs">
                            {[{id:'overview',label:'Visão Geral'},{id:'tactics',label:'Táticas'},{id:'training',label:'Treino'},{id:'club',label:'Clube'},...((engine.transferOffers?.length ?? 0) > 0 ? [{id:'transfers',label:'Ofertas'}] : [])].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} style={{ width: '100%', justifyContent: 'flex-start', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <div className="ef-dashboard-nav__actions">
                            {/* SPEC-167: Conselho do Auxiliar */}
                            <EfButton variant="secondary" size="md" title="Sugestão tática do auxiliar técnico baseada no adversário" style={{ width: '100%', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: '600', gap: '8px' }} onClick={handleAuxiliarAdvice}>
                                <GraduationCap weight="bold" /> Conselho do Auxiliar
                            </EfButton>
                            <EfButton variant="primary" size="lg" title="Joga a próxima partida e avança 1 semana (processa treino, finanças, lesões, eventos)" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '24px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', gap: '8px' }} onClick={() => {
                                // AUDIT-FIX #17: Check pacing friction before match
                                const events = engine.getPacingEvents?.() || [];
                                if (events.length > 0) {
                                    setPacingQueue(events);
                                } else {
                                    engine.checkPressConference();
                                    if (!engine.pressQuestion) changeView('match'); else forceUpdate();
                                }
                            }}>
                                <SoccerBall weight="fill" /> JOGAR PARTIDA
                            </EfButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content Area */}
                    <div className="ef-dashboard-content">
                        {/* NEXT MATCH INFO (Always visible above tabs) */}
                        <EfPanel padding="md" className="ef-dashboard-match-info">
                            <div className="ef-dashboard-match-info__left">
                                <span className="ef-dashboard-match-info__label">Formação Atual</span>
                                <div className="ef-dashboard-match-info__formation">
                                    <span className="ef-dashboard-match-info__formation-name">{team.formation}</span>
                                    <span className="ef-dashboard-match-info__separator">•</span>
                                    <span className="ef-dashboard-match-info__tactics">{TACTICS[engine.currentTactic]?.name}</span>
                                </div>
                            </div>
                            <div className="ef-dashboard-match-info__right">
                                <div className="ef-stat-cell"><span className="ef-stat-cell__value ef-text-accent"><AnimatedStat value={sectors.goalkeeper} /></span><span className="ef-stat-cell__label"><Help id="sector.gol" />GOL</span></div>
                                <div className="ef-stat-cell"><span className="ef-stat-cell__value ef-text-info"><AnimatedStat value={sectors.defense} /></span><span className="ef-stat-cell__label"><Help id="sector.def" />DEF</span></div>
                                <div className="ef-stat-cell"><span className="ef-stat-cell__value ef-text-primary"><AnimatedStat value={sectors.midfield} /></span><span className="ef-stat-cell__label"><Help id="sector.mei" />MEI</span></div>
                                <div className="ef-stat-cell"><span className="ef-stat-cell__value ef-text-danger"><AnimatedStat value={sectors.attack} /></span><span className="ef-stat-cell__label"><Help id="sector.ata" />ATA</span></div>
                            </div>
                        </EfPanel>

                        {/* TAB CONTENTS */}
                        {tab === 'overview' && (
                            <div className="ef-dashboard-overview">
                                {/* Left Sub-column */}
                                <div className="ef-dashboard-overview__left">
                                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                                        <EfPanel padding="md" className="ef-dashboard-playbook">
                                            <div className="ef-dashboard-playbook__title"><Lightbulb weight="fill" /> PLAYBOOK DO TREINADOR</div>
                                            <div className="ef-dashboard-playbook__content">
                                                <p>1️⃣ <strong>Táticas:</strong> escolha formação e tática antes de jogar</p>
                                                <p>2️⃣ <strong>Treino:</strong> treine o plantel toda semana para melhorar atributos</p>
                                                <p>3️⃣ <strong>Plantel:</strong> escale seus melhores 11 e monitore energia</p>
                                                <p>4️⃣ <strong>Clube:</strong> upgrade estádio e base para crescer</p>
                                                <p>5️⃣ <strong>Jogo:</strong> no intervalo, ajuste tática e faça substituições</p>
                                            </div>
                                        </EfPanel>
                                    )}
                                    <ScarcityBanner engine={engine} />
                                    <DreadIndicator engine={engine} />
                                    <AhaMomentCard engine={engine} />
                                    
                                    <EfPanel padding="md">
                                        <div className="ef-panel-section-label"><Wallet weight="fill" /> FINANÇAS</div>
                                        {engine.weeklyFinance ? (
                                            <table className="ef-dashboard-finance__table">
                                                <tbody>
                                                    {engine.weeklyFinance.details.map((d, i) => (
                                                        <tr key={i} className="ef-dashboard-finance__row">
                                                            <td className="ef-dashboard-finance__label">{d.label}</td>
                                                            <td className={`ef-dashboard-finance__value ${d.type === 'income' ? 'ef-dashboard-finance__value--income' : 'ef-dashboard-finance__value--expense'}`}>
                                                                {d.type === 'income' ? '+' : '-'}R$ {(d.amount / 1000).toFixed(0)}K
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <p className="ef-dashboard-finance__empty">Jogue a próxima partida para ver o relatório.</p>}
                                    </EfPanel>

                                    {engine.activeLoan && (
                                        <EfPanel padding="md" className="ef-dashboard-loan">
                                            <div className="ef-panel-section-label ef-text-accent"><Bank weight="fill" /> EMPRÉSTIMO ATIVO</div>
                                            <table className="ef-dashboard-loan__table">
                                                <tbody>
                                                    <tr className="ef-dashboard-loan__row"><td className="ef-dashboard-loan__label">Principal</td><td className="ef-dashboard-loan__value">R$ {(engine.activeLoan.principal / 1_000_000).toFixed(1)}M</td></tr>
                                                    <tr className="ef-dashboard-loan__row"><td className="ef-dashboard-loan__label">Parcela</td><td className="ef-dashboard-loan__value ef-dashboard-loan__value--danger">R$ {(engine.activeLoan.weeklyPayment / 1000).toFixed(0)}K</td></tr>
                                                    <tr className="ef-dashboard-loan__row"><td className="ef-dashboard-loan__label">Restante</td><td className="ef-dashboard-loan__value">{engine.activeLoan.weeksRemaining} sem</td></tr>
                                                </tbody>
                                            </table>
                                            {team.balance >= engine.activeLoan.totalOwed && (
                                                <EfButton variant="primary" size="md" className="ef-dashboard-loan__payoff-btn" onClick={() => { engine.payOffLoan(); forceUpdate(); }}>
                                                    Quitar Antecipadamente
                                                </EfButton>
                                            )}
                                        </EfPanel>
                                    )}
                                </div>
                                {/* Right Sub-column */}
                                <div className="ef-dashboard-overview__right">
                                    {(engine.weekEvents?.length ?? 0) > 0 && (
                                        <EfPanel padding="md">
                                            <div className="ef-panel-section-label"><Newspaper weight="fill" /> EVENTOS DA SEMANA</div>
                                            <div className="ef-dashboard-events">
                                                {(engine.weekEvents || []).map((ev, i) => {
                                                    const evText = typeof ev === 'string' ? ev : (ev?.text || ev?.msg || '');
                                                    const isGood = evText.includes('📈') || evText.includes('🎉') || evText.includes('📚') || evText.includes('🇧🇷') || evText.includes('🎂');
                                                    const isBad = evText.includes('📉') || evText.includes('☠️') || evText.includes('👴') || evText.includes('🕺') || evText.includes('🥊');
                                                    return (
                                                        <div key={i} className={`ef-dashboard-event ${isGood ? 'ef-dashboard-event--good' : isBad ? 'ef-dashboard-event--bad' : 'ef-dashboard-event--neutral'}`}>
                                                            {evText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </EfPanel>
                                    )}

                                    {typeof engine.boardTension === 'number' && (
                                        <EfPanel padding="md" className={`ef-dashboard-board-tension ${engine.boardTension < -20 ? 'ef-dashboard-board-tension--danger' : engine.boardTension > 40 ? 'ef-dashboard-board-tension--stable' : 'ef-dashboard-board-tension--warning'}`}>
                                            <div className={`ef-dashboard-board-tension__title ${engine.boardTension < -20 ? 'ef-dashboard-board-tension__title--danger' : engine.boardTension > 40 ? 'ef-dashboard-board-tension__title--stable' : 'ef-dashboard-board-tension__title--warning'}`}><WarningCircle weight="fill" /> TENSÃO DA DIRETORIA</div>
                                            <div className="ef-dashboard-board-tension__content">
                                                <span className="ef-dashboard-board-tension__status">
                                                    {engine.boardTension >= 40 ? 'Estável' : engine.boardTension >= 0 ? 'Atenção' : engine.boardTension >= -40 ? 'Pressão' : 'Crise'}
                                                </span>
                                                <strong className={`ef-dashboard-board-tension__value ${engine.boardTension >= 0 ? 'ef-dashboard-board-tension__value--positive' : 'ef-dashboard-board-tension__value--negative'}`}>
                                                    {engine.boardTension > 0 ? '+' : ''}{engine.boardTension}
                                                </strong>
                                            </div>
                                            <div className="ef-progress ef-progress--sm" style={{ marginTop: '16px' }}>
                                                <div className={`ef-progress__fill ${engine.boardTension >= 0 ? '' : 'ef-progress__fill--danger'}`} style={{ width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%` }} />
                                            </div>
                                        </EfPanel>
                                    )}

                                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                                        <EfPanel padding="md">
                                            <div className="ef-panel-section-label"><ChartLineUp weight="fill" /> FORMA RECENTE</div>
                                            <div className="ef-dashboard-form-chips">
                                                {stats.rollingForm.map((r, i) => (
                                                    <span key={i} className={`ef-form-chip ef-form-chip--${r.toLowerCase()}`}>{r}</span>
                                                ))}
                                            </div>
                                        </EfPanel>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'tactics' && (
                            <div className="ef-dashboard-tactics-grid">
                                <EfPanel padding="lg">
                                    <div className="ef-dashboard-tactics__section-title">FORMAÇÃO</div>
                                    <div className="ef-dashboard-tactics__buttons">
                                        {Object.keys(FORMATIONS).map(f => (
                                            <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setFormation(f); forceUpdate(); }}>
                                              {f}
                                            </EfButton>
                                        ))}
                                    </div>
                                    <div className="ef-dashboard-tactics__section-title ef-dashboard-tactics__section-title--secondary">TÁTICA DE JOGO</div>
                                    <div className="ef-dashboard-tactics__buttons">
                                        {Object.entries(TACTICS).map(([k, v]) => (
                                            <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setTactic(k); forceUpdate(); }}>
                                              {v.name}
                                            </EfButton>
                                        ))}
                                    </div>
                                    <p className="ef-dashboard-tactics__description">{TACTICS[engine.currentTactic]?.description}</p>
                                </EfPanel>

                                <EfPanel padding="lg">
                                    <div className="ef-panel-section-label ef-panel-section-label--strong" style={{ fontSize: '1rem', marginBottom: '24px' }}><Megaphone weight="fill" /> PRELEÇÃO</div>
                                    <div className="ef-dashboard-talks">
                                        {TEAM_TALKS.map(t => {
                                            const moral = t.effect?.moralBoost ?? 0;
                                            const energy = t.effect?.energyCost ?? 0;
                                            const moralTxt = moral > 0 ? `moral +${moral}` : moral < 0 ? `moral ${moral}` : 'moral neutra';
                                            const energyTxt = energy > 0 ? `, custa ${energy} energia` : energy < 0 ? `, recupera energia` : '';
                                            return (
                                            <EfButton key={t.id} variant="secondary" size="md" title={`${t.name}: ${moralTxt}${energyTxt}. "${t.text}"`} className="ef-dashboard-talk-btn" onClick={() => handleTeamTalk(t.id)}>
                                                {t.name}
                                            </EfButton>
                                            );
                                        })}
                                    </div>
                                </EfPanel>
                            </div>
                        )}

                        {tab === 'training' && (
                            <EfPanel padding="lg">
                                <div className="ef-dashboard-training__title">TREINO SEMANAL</div>
                                <div className="ef-dashboard-training__grid">
                                    {TRAINING_TYPES.map(t => (
                                        <EfButton key={t.id} variant={engine.currentTraining === t.id ? 'primary' : 'secondary'} size="lg" title={`Treino ${t.name}: ${t.description} (drena energia do plantel)`} className="ef-dashboard-training-btn" onClick={() => handleTrain(t.id)}>
                                            <span className="ef-dashboard-training-btn__name">{t.name}</span>
                                            <span className={`ef-dashboard-training-btn__desc ${engine.currentTraining === t.id ? 'ef-dashboard-training-btn__desc--active' : ''}`}>{t.description}</span>
                                        </EfButton>
                                    ))}
                                </div>
                            </EfPanel>
                        )}

                        {tab === 'club' && (
                            <div className="ef-dashboard-club-grid">
                                <div className="ef-dashboard-club__left">
                                    <EfPanel padding="md" className="ef-dashboard-club__panel">
                                        <div className="ef-panel-section-label ef-panel-section-label--strong"><Building weight="fill" /> {stadiumInfo.name}</div>
                                        <div className="ef-dashboard-club-facility__info">Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</div>
                                        <div className="ef-progress ef-progress--sm" style={{ marginBottom: '16px' }}>
                                            <div className="ef-progress__fill ef-progress__fill--info" style={{ width: `${(engine.stadiumLevel / 5) * 100}%` }} />
                                        </div>
                                        <div className="ef-dashboard-club-facility__actions">
                                            <span className="ef-dashboard-club-facility__level">NÍVEL {engine.stadiumLevel}/5</span>
                                            {engine.stadiumLevel < 5 && (
                                                <EfButton variant="primary" size="sm" title="Aumenta capacidade do estádio (mais bilheteria por jogo). Consome do caixa." onClick={() => { const r = engine.upgradeStadium(); setLog(r.msg); forceUpdate(); }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>

                                    <EfPanel padding="md" className="ef-dashboard-club__panel">
                                        <div className="ef-panel-section-label ef-panel-section-label--strong"><GraduationCap weight="fill" /> BASE Nv.{engine.academyLevel}</div>
                                        <div className="ef-dashboard-club-facility__info">Produz {engine.academyLevel + 1} jovens/temporada</div>
                                        <div className="ef-progress ef-progress--sm" style={{ marginBottom: '16px' }}>
                                            <div className="ef-progress__fill ef-progress__fill--accent" style={{ width: `${(engine.academyLevel / 5) * 100}%` }} />
                                        </div>
                                        <div className="ef-dashboard-club-facility__actions">
                                            <span className="ef-dashboard-club-facility__level">NÍVEL {engine.academyLevel}/5</span>
                                            {engine.academyLevel < 5 && (
                                                <EfButton variant="primary" size="sm" title="Melhora a base — produz mais e melhores jovens por temporada. Consome do caixa." onClick={() => { const r = engine.upgradeAcademy(); setLog(r.msg); forceUpdate(); }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>
                                </div>
                                <div className="ef-dashboard-club__right">
                                    <EfPanel padding="md" className="ef-dashboard-club__panel">
                                        <div className="ef-panel-section-label ef-panel-section-label--strong"><Users weight="fill" /> STAFF</div>
                                        <table className="ef-dashboard-club-staff__table">
                                            <tbody>
                                                {STAFF_ROLES.map(role => {
                                                    const member = engine.staff?.getStaff(role.id);
                                                    return (
                                                        <tr key={role.id} className="ef-dashboard-club-staff__row">
                                                            <td className="ef-dashboard-club-staff__label">{role.name}</td>
                                                            <td className="ef-dashboard-club-staff__value">
                                                                {member ? <strong className="ef-dashboard-club-staff__name">{member.name}</strong> : <EfButton variant="secondary" size="sm" title={`Contrata ${role.name} (paga salário semanal; ativa o bônus do cargo)`} onClick={() => { const r = engine.hireStaff(role.id); setLog(r.msg); forceUpdate(); }}>Contratar</EfButton>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </EfPanel>

                                    <EfPanel padding="md" className="ef-dashboard-club__panel">
                                        <div className="ef-panel-section-label ef-panel-section-label--strong"><Binoculars weight="fill" /> SCOUTING</div>
                                        <div className="ef-dashboard-club-scouting__regions">
                                            {SCOUT_REGIONS.map(r => (
                                                <EfButton key={r.id} variant="secondary" size="sm" onClick={() => { const res = engine.scoutRegionAction(r.id); setLog(res.msg); forceUpdate(); }}>
                                                    {r.name}
                                                </EfButton>
                                            ))}
                                        </div>
                                        {engine.scoutedPlayers?.length > 0 && (
                                            <table className="ef-dashboard-club-scouting__table">
                                                <tbody>
                                                    {engine.scoutedPlayers.map((p, i) => (
                                                        <tr key={i} className="ef-dashboard-club-scouting__row">
                                                            <td className="ef-dashboard-club-scouting__player">{p.name} <span className="ef-dashboard-club-scouting__meta">({p.position}, OVR {p.ovr})</span></td>
                                                            <td className="ef-dashboard-club-scouting__actions"><EfButton variant="primary" size="sm" onClick={() => { const r = engine.signScoutedPlayer(i); setLog(r?.msg); forceUpdate(); }}>Assinar</EfButton></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </EfPanel>
                                </div>
                            </div>
                        )}

                        {tab === 'transfers' && (engine.transferOffers?.length ?? 0) > 0 && (
                            <EfPanel padding="lg">
                                <div className="ef-panel-section-label ef-panel-section-label--strong"><Envelope weight="fill" /> OFERTAS RECEBIDAS</div>
                                <table className="ef-dashboard-transfers__table">
                                    <tbody>
                                        {engine.transferOffers.map((offer, i) => (
                                            <tr key={i} className="ef-dashboard-transfers__row">
                                                <td className="ef-dashboard-transfers__offer">
                                                    <strong className="ef-dashboard-transfers__player-name">{offer.playerName}</strong> <span className="ef-dashboard-transfers__ovr">(OVR {offer.playerOvr})</span>
                                                    <div className="ef-dashboard-transfers__offer-detail">{offer.buyerClub} • <span className="ef-dashboard-transfers__amount">R$ {(offer.offerAmount / 1000000).toFixed(1)}M</span></div>
                                                </td>
                                                <td className="ef-dashboard-transfers__actions">
                                                    <div className="ef-dashboard-transfers__buttons">
                                                        <EfButton variant="primary" size="sm" title="Aceitar oferta (irreversível: jogador sai do plantel imediatamente)" onClick={() => handleAcceptOffer(offer.playerId)}>ACEITAR</EfButton>
                                                        <EfButton variant="danger" size="sm" title="Recusar oferta (cuidado: jogador pode ficar insatisfeito e pedir saída)" onClick={() => handleRejectOffer(offer.playerId)}>RECUSAR</EfButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </EfPanel>
                        )}
                    </div>
                </div>

                {/* BOTTOM NAVIGATION */}
                <div className="ef-dashboard-bottom-nav">
                    {[{view:'squad',icon:<Users weight="fill"/>,label:'Plantel'},{view:'market',icon:<ShoppingCart weight="fill"/>,label:'Mercado'},{view:'standings',icon:<ChartBar weight="fill"/>,label:'Tabela'}].map(n => (
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1 ef-dashboard-bottom-nav__btn" onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

                {/* === STITCH FOOTER CTA — Avançar Semana === */}
                <button
                    type="button"
                    className="ef-dashboard-footer-cta"
                    title="Avança 1 semana (treino, finanças, lesões, eventos) e joga a próxima partida"
                    onClick={() => {
                        const events = engine.getPacingEvents?.() || [];
                        if (events.length > 0) {
                            setPacingQueue(events);
                        } else {
                            engine.checkPressConference();
                            if (!engine.pressQuestion) changeView('match'); else forceUpdate();
                        }
                    }}
                >
                    AVANÇAR SEMANA
                </button>

                {/* Feedback log */}
                {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

                {/* Modals */}
                {engine.pressQuestion && (
                    <EfModal title={<><MicrophoneStage size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Coletiva de Imprensa</>} onClose={() => {}}>
                        <p style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{engine.pressQuestion.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {engine.pressQuestion.options.map(opt => (
                                <EfButton key={opt.id} variant="secondary" size="md" onClick={() => { const result = engine.answerPress(opt.id); if (result) setLog(`Coletiva: ${result.answer}`); forceUpdate(); }} style={{ textAlign: 'left', width: '100%', justifyContent: 'flex-start', padding: '16px', fontFamily: 'var(--font-sans)' }}>
                                    {opt.text}
                                </EfButton>
                            ))}
                        </div>
                    </EfModal>
                )}

                {pendingUnlock && <UnlockTooltip viewId={pendingUnlock} onDismiss={() => setPendingUnlock(null)} />}
                {pendingAchievement && <AchievementPopup achievement={pendingAchievement} onDismiss={() => setPendingAchievement(null)} />}
                <TutorialOverlay visible={showTutorial} onDismiss={() => setShowTutorial(false)} />

                {/* SPEC-167: Auxiliar advice modal */}
                {advicePanel.open && (
                    <EfModal title="Conselho do Auxiliar" onClose={() => setAdvicePanel({ open: false, loading: false, text: '' })}>
                        <div className="ef-dashboard-advice-panel">
                            {advicePanel.loading
                                ? <p className="ef-dashboard-advice-panel__loading">Analisando...</p>
                                : <p className="ef-dashboard-advice-panel__text">{advicePanel.text}</p>
                            }
                        </div>
                        <EfButton variant="primary" size="md" onClick={() => setAdvicePanel({ open: false, loading: false, text: '' })}>
                            FECHAR
                        </EfButton>
                    </EfModal>
                )}

                {/* SPEC-167: Última narrativa pós-jogo */}
                {engine.lastMatchNarrative && (
                    <div className="ef-dashboard-narrative-wrapper">
                        <EfPanel padding="md" className="ef-dashboard-narrative">
                            <div className="ef-dashboard-narrative__title">
                                <Newspaper weight="fill" /> CRÔNICA DA PARTIDA
                            </div>
                            <p className="ef-dashboard-narrative__text">{engine.lastMatchNarrative}</p>
                        </EfPanel>
                    </div>
                )}

                {/* AUDIT-FIX #17: Pacing Friction Modal */}
                {pacingQueue.length > 0 && (() => {
                    const evt = pacingQueue[0];
                    const severityClass = { critical: 'ef-dashboard-pacing__alert--critical', warning: 'ef-dashboard-pacing__alert--warning', info: 'ef-dashboard-pacing__alert--info' }[evt.severity] || 'ef-dashboard-pacing__alert--info';
                    return (
                        <EfModal title={evt.title} onClose={() => {}}>
                            <div className={`ef-dashboard-pacing__alert ${severityClass}`}>
                                <p className="ef-dashboard-pacing__body">{evt.body}</p>
                            </div>
                            <div className="ef-dashboard-pacing__buttons">
                                {evt.action && (
                                    <EfButton variant="primary" size="md" onClick={() => {
                                        setPacingQueue([]);
                                        if (evt.action === 'tactics') setTab('tactics');
                                        else changeView(evt.action);
                                    }}>
                                        RESOLVER AGORA
                                    </EfButton>
                                )}
                                <EfButton variant="secondary" size="md" onClick={() => {
                                    const rest = pacingQueue.slice(1);
                                    if (rest.length > 0) {
                                        setPacingQueue(rest);
                                    } else {
                                        setPacingQueue([]);
                                        engine.checkPressConference();
                                        if (!engine.pressQuestion) changeView('match'); else forceUpdate();
                                    }
                                }}>
                                    {pacingQueue.length > 1 ? 'PRÓXIMO ALERTA' : 'ENTENDIDO — JOGAR'}
                                </EfButton>
                            </div>
                        </EfModal>
                    );
                })()}
            </div>
        </div>
    );
}
