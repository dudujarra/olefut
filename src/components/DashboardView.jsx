import React, { useState, useCallback } from 'react';
import { AnimatedStat } from '../hooks/useCountUp';
import { Help } from './Help';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';
import { STAFF_ROLES, SCOUT_REGIONS, getStadiumInfo } from '../engine/StadiumSystem';
import { getAcademyUpgradeCost } from '../engine/YouthAcademy';
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
        try { return !localStorage.getItem('elifoot_tutorial_done') && (engine?.seasonNumber || 1) === 1; }
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

    return (
        <div style={{ padding: '24px', width: '100%', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-dark, #0D1117)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <TrophyCeremony trophy={engine.trophyCeremony?.trophy} season={engine.trophyCeremony?.season} visible={!!engine.trophyCeremony} onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }} />

                {/* === HEADER — LUXURY BENTO === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-block', background: '#1A1F24', color: '#888', padding: '4px 12px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '12px' }}>
                            {pos}º • SÉRIE {['A','B','C','D'][team.division - 1]}
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', color: '#FDFBF7' }}>
                            {team.name}
                        </h2>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8E9E94', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? <span style={{display: 'flex', alignItems: 'center', color: '#39FF14'}}><TrendUp weight="bold"/> {stats.streak}</span> : stats.streak < 0 ? <span style={{display: 'flex', alignItems: 'center', color: '#FF3333'}}><TrendDown weight="bold"/> {Math.abs(stats.streak)}</span> : ''}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: team.balance > 0 ? '#39FF14' : '#FF3333' }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        {boardStatus && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: boardStatus.color, background: '#1A1F24', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title={`Diretoria: ${boardStatus.label} (${engine.board?.confidence ?? 60}%).`}>
                                <span>{boardStatus.emoji}</span> {boardStatus.label}
                            </div>
                        )}
                        <div style={{ marginTop: '12px', width: '200px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#8E9E94', marginBottom: '6px' }}>
                                <span>SEM {seasonWeek}/38</span>
                                <span>TEMP {engine.seasonNumber}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#1A1F24', overflow: 'hidden' }}>
                                <div style={{ width: `${(seasonWeek / 38) * 100}%`, height: '100%', background: '#39FF14' }} />
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {injured.length > 0 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Heartbeat color="#FF3333" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF3333', fontWeight: 'bold' }}>{injured.length} LESIONADO{injured.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {expiringContracts.length > 0 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D2916', borderColor: '#FFD700', gap: '8px' }}><Newspaper color="#FFD700" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FFD700', fontWeight: 'bold' }}>{expiringContracts.length} CONTRATO{expiringContracts.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {avgEnergy < 50 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#2D1616', borderColor: '#FF3333', gap: '8px' }}><Lightning color="#FF3333" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF3333', fontWeight: 'bold' }}>CANSADO ({avgEnergy.toFixed(0)}%)</span></EfPanel>}
                        {(engine.transferOffers?.length ?? 0) > 0 && <EfPanel padding="sm" style={{ display: 'inline-flex', alignItems: 'center', background: '#16242D', borderColor: '#40BAF7', gap: '8px', cursor: 'pointer' }} onClick={() => setTab('transfers')}><Envelope color="#40BAF7" weight="fill" /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#40BAF7', fontWeight: 'bold' }}>{(engine.transferOffers?.length ?? 0)} OFERTA{(engine.transferOffers?.length ?? 0) > 1 ? 'S' : ''}</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <EfPanel padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{id:'overview',label:'Visão Geral'},{id:'tactics',label:'Táticas'},{id:'training',label:'Treino'},{id:'club',label:'Clube'},...((engine.transferOffers?.length ?? 0) > 0 ? [{id:'transfers',label:'Ofertas'}] : [])].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} style={{ width: '100%', justifyContent: 'flex-start', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* NEXT MATCH INFO (Always visible above tabs) */}
                        <EfPanel padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161B22' }}>
                            <div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#8E9E94', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Formação Atual</span>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#FDFBF7' }}>{team.formation}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#555' }}>•</span>
                                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: '600', color: '#39FF14' }}>{TACTICS[engine.currentTactic]?.name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#FFD700', display: 'block' }}><AnimatedStat value={sectors.goalkeeper} /></span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94', display: 'flex', alignItems: 'center', gap: '4px' }}><Help id="sector.gol" />GOL</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#40BAF7', display: 'block' }}><AnimatedStat value={sectors.defense} /></span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94', display: 'flex', alignItems: 'center', gap: '4px' }}><Help id="sector.def" />DEF</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#39FF14', display: 'block' }}><AnimatedStat value={sectors.midfield} /></span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94', display: 'flex', alignItems: 'center', gap: '4px' }}><Help id="sector.mei" />MEI</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: '#FF3333', display: 'block' }}><AnimatedStat value={sectors.attack} /></span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#8E9E94', display: 'flex', alignItems: 'center', gap: '4px' }}><Help id="sector.ata" />ATA</span></div>
                            </div>
                        </EfPanel>

                        {/* TAB CONTENTS */}
                        {tab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                {/* Left Sub-column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                                        <EfPanel padding="md" style={{ borderColor: '#40BAF7', background: '#0D1A24' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#40BAF7', fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '12px' }}><Lightbulb weight="fill" /> PLAYBOOK DO TREINADOR</div>
                                            <div style={{ fontSize: '0.85rem', color: '#8E9E94', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><Wallet weight="fill" /> FINANÇAS</div>
                                        {engine.weeklyFinance ? (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                                                <tbody>
                                                    {engine.weeklyFinance.details.map((d, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #1A1F24' }}>
                                                            <td style={{ color: '#8E9E94', padding: '8px 0' }}>{d.label}</td>
                                                            <td style={{ textAlign: 'right', padding: '8px 0', color: d.type === 'income' ? '#39FF14' : '#FF3333' }}>
                                                                {d.type === 'income' ? '+' : '-'}R$ {(d.amount / 1000).toFixed(0)}K
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <p style={{ color: '#8E9E94', fontSize: '0.8rem', fontFamily: 'var(--font-sans)' }}>Jogue a próxima partida para ver o relatório.</p>}
                                    </EfPanel>

                                    {engine.activeLoan && (
                                        <EfPanel padding="md" style={{ background: '#2D2916', borderColor: '#FFD700' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#FFD700' }}><Bank weight="fill" /> EMPRÉSTIMO ATIVO</div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                                                <tbody>
                                                    <tr style={{ borderBottom: '1px solid #1B4332' }}><td style={{ color: '#8E9E94', padding: '8px 0' }}>Principal</td><td style={{ textAlign: 'right', padding: '8px 0', color: '#FDFBF7' }}>R$ {(engine.activeLoan.principal / 1_000_000).toFixed(1)}M</td></tr>
                                                    <tr style={{ borderBottom: '1px solid #1B4332' }}><td style={{ color: '#8E9E94', padding: '8px 0' }}>Parcela</td><td style={{ textAlign: 'right', padding: '8px 0', color: '#FF3333' }}>R$ {(engine.activeLoan.weeklyPayment / 1000).toFixed(0)}K</td></tr>
                                                    <tr><td style={{ color: '#8E9E94', padding: '8px 0' }}>Restante</td><td style={{ textAlign: 'right', padding: '8px 0', color: '#FDFBF7' }}>{engine.activeLoan.weeksRemaining} sem</td></tr>
                                                </tbody>
                                            </table>
                                            {team.balance >= engine.activeLoan.totalOwed && (
                                                <EfButton variant="primary" size="md" style={{ marginTop: '16px', width: '100%', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }} onClick={() => { engine.payOffLoan(); forceUpdate(); }}>
                                                    Quitar Antecipadamente
                                                </EfButton>
                                            )}
                                        </EfPanel>
                                    )}
                                </div>
                                {/* Right Sub-column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {(engine.weekEvents?.length ?? 0) > 0 && (
                                        <EfPanel padding="md">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><Newspaper weight="fill" /> EVENTOS DA SEMANA</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {(engine.weekEvents || []).map((ev, i) => {
                                                    const evText = typeof ev === 'string' ? ev : (ev?.text || ev?.msg || '');
                                                    const isGood = evText.includes('📈') || evText.includes('🎉') || evText.includes('📚') || evText.includes('🇧🇷') || evText.includes('🎂');
                                                    const isBad = evText.includes('📉') || evText.includes('☠️') || evText.includes('👴') || evText.includes('🕺') || evText.includes('🥊');
                                                    return (
                                                        <div key={i} style={{ 
                                                            padding: '12px', 
                                                            background: isGood ? '#162D1C' : isBad ? '#2D1616' : '#1A1F24', 
                                                            borderLeft: `4px solid ${isGood ? '#39FF14' : isBad ? '#FF3333' : '#4A5059'}`,
                                                            fontFamily: 'var(--font-sans)',
                                                            fontSize: '0.85rem',
                                                            color: isGood ? '#39FF14' : isBad ? '#FF3333' : '#FDFBF7'
                                                        }}>
                                                            {evText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </EfPanel>
                                    )}

                                    {typeof engine.boardTension === 'number' && (
                                        <EfPanel padding="md" style={{ borderColor: engine.boardTension < -20 ? '#FF3333' : engine.boardTension > 40 ? '#39FF14' : '#FFD700', background: engine.boardTension < -20 ? '#2D1616' : engine.boardTension > 40 ? '#162D1C' : '#2D2916' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: engine.boardTension < -20 ? '#FF3333' : engine.boardTension > 40 ? '#39FF14' : '#FFD700' }}><WarningCircle weight="fill" /> TENSÃO DA DIRETORIA</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                <span style={{ color: '#FDFBF7' }}>
                                                    {engine.boardTension >= 40 ? 'Estável' : engine.boardTension >= 0 ? 'Atenção' : engine.boardTension >= -40 ? 'Pressão' : 'Crise'}
                                                </span>
                                                <strong style={{ color: engine.boardTension >= 0 ? '#39FF14' : '#FF3333', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                                                    {engine.boardTension > 0 ? '+' : ''}{engine.boardTension}
                                                </strong>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: '#1A1F24', marginTop: '16px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%`, background: engine.boardTension >= 0 ? '#39FF14' : '#FF3333' }} />
                                            </div>
                                        </EfPanel>
                                    )}

                                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                                        <EfPanel padding="md">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '16px', color: '#8E9E94' }}><ChartLineUp weight="fill" /> FORMA RECENTE</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {stats.rollingForm.map((r, i) => (
                                                    <span key={i} style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '32px', height: '32px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                                                        backgroundColor: r === 'W' ? '#162D1C' : r === 'D' ? '#2D2916' : '#2D1616',
                                                        color: r === 'W' ? '#39FF14' : r === 'D' ? '#FFD700' : '#FF3333'
                                                    }}>{r}</span>
                                                ))}
                                            </div>
                                        </EfPanel>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'tactics' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                <EfPanel padding="lg">
                                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '24px', color: '#FDFBF7' }}>FORMAÇÃO</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {Object.keys(FORMATIONS).map(f => (
                                            <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setFormation(f); forceUpdate(); }} style={{ fontFamily: 'var(--font-mono)' }}>{f}</EfButton>
                                        ))}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', margin: '32px 0 24px 0', color: '#FDFBF7' }}>TÁTICA DE JOGO</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {Object.entries(TACTICS).map(([k, v]) => (
                                            <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setTactic(k); forceUpdate(); }} style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{v.name}</EfButton>
                                        ))}
                                    </div>
                                    <p style={{ color: '#8E9E94', fontSize: '0.85rem', marginTop: '16px', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{TACTICS[engine.currentTactic]?.description}</p>
                                </EfPanel>

                                <EfPanel padding="lg">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '24px', color: '#FDFBF7' }}><Megaphone weight="fill" /> PRELEÇÃO</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {TEAM_TALKS.map(t => {
                                            const moral = t.effect?.moralBoost ?? 0;
                                            const energy = t.effect?.energyCost ?? 0;
                                            const moralTxt = moral > 0 ? `moral +${moral}` : moral < 0 ? `moral ${moral}` : 'moral neutra';
                                            const energyTxt = energy > 0 ? `, custa ${energy} energia` : energy < 0 ? `, recupera energia` : '';
                                            return (
                                            <EfButton key={t.id} variant="secondary" size="md" title={`${t.name}: ${moralTxt}${energyTxt}. "${t.text}"`} style={{ justifyContent: 'flex-start', padding: '16px', fontFamily: 'var(--font-sans)', fontWeight: '600' }} onClick={() => handleTeamTalk(t.id)}>
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
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '24px', color: '#FDFBF7' }}>TREINO SEMANAL</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {TRAINING_TYPES.map(t => (
                                        <EfButton key={t.id} variant={engine.currentTraining === t.id ? 'primary' : 'secondary'} size="lg" title={`Treino ${t.name}: ${t.description} (drena energia do plantel)`} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px', gap: '12px' }} onClick={() => handleTrain(t.id)}>
                                            <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>{t.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: engine.currentTraining === t.id ? '#1A8A0A' : '#8E9E94', whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.4, fontFamily: 'var(--font-sans)', fontWeight: 'normal' }}>{t.description}</span>
                                        </EfButton>
                                    ))}
                                </div>
                            </EfPanel>
                        )}

                        {tab === 'club' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <EfPanel padding="md" style={{ background: '#161B22' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', color: '#FDFBF7' }}><Building weight="fill" /> {stadiumInfo.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#8E9E94', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</div>
                                        <div style={{ width: '100%', height: '6px', background: '#1A1F24', marginBottom: '16px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(engine.stadiumLevel / 5) * 100}%`, background: '#40BAF7' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#8E9E94' }}>NÍVEL {engine.stadiumLevel}/5</span>
                                            {engine.stadiumLevel < 5 && (
                                                <EfButton variant="primary" size="sm" title="Aumenta capacidade do estádio (mais bilheteria por jogo). Consome do caixa." onClick={() => { const r = engine.upgradeStadium(); setLog(r.msg); forceUpdate(); }} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>

                                    <EfPanel padding="md" style={{ background: '#161B22' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', color: '#FDFBF7' }}><GraduationCap weight="fill" /> BASE Nv.{engine.academyLevel}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#8E9E94', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>Produz {engine.academyLevel + 1} jovens/temporada</div>
                                        <div style={{ width: '100%', height: '6px', background: '#1A1F24', marginBottom: '16px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(engine.academyLevel / 5) * 100}%`, background: '#FFD700' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#8E9E94' }}>NÍVEL {engine.academyLevel}/5</span>
                                            {engine.academyLevel < 5 && (
                                                <EfButton variant="primary" size="sm" title="Melhora a base — produz mais e melhores jovens por temporada. Consome do caixa." onClick={() => { const r = engine.upgradeAcademy(); setLog(r.msg); forceUpdate(); }} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <EfPanel padding="md" style={{ background: '#161B22' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', color: '#FDFBF7' }}><Users weight="fill" /> STAFF</div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
                                            <tbody>
                                                {STAFF_ROLES.map(role => {
                                                    const member = engine.staff?.getStaff(role.id);
                                                    return (
                                                        <tr key={role.id} style={{ borderBottom: '1px solid #1A1F24' }}>
                                                            <td style={{ padding: '12px 0', color: '#8E9E94' }}>{role.name}</td>
                                                            <td style={{ textAlign: 'right', padding: '12px 0' }}>
                                                                {member ? <strong style={{ color: '#39FF14' }}>{member.name}</strong> : <EfButton variant="secondary" size="sm" title={`Contrata ${role.name} (paga salário semanal; ativa o bônus do cargo)`} onClick={() => { const r = engine.hireStaff(role.id); setLog(r.msg); forceUpdate(); }} style={{ fontWeight: 'bold' }}>Contratar</EfButton>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </EfPanel>

                                    <EfPanel padding="md" style={{ background: '#161B22' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', color: '#FDFBF7' }}><Binoculars weight="fill" /> SCOUTING</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                            {SCOUT_REGIONS.map(r => (
                                                <EfButton key={r.id} variant="secondary" size="sm" onClick={() => { const res = engine.scoutRegionAction(r.id); setLog(res.msg); forceUpdate(); }} style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>
                                                    {r.name}
                                                </EfButton>
                                            ))}
                                        </div>
                                        {engine.scoutedPlayers?.length > 0 && (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
                                                <tbody>
                                                    {engine.scoutedPlayers.map((p, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #1A1F24' }}>
                                                            <td style={{ padding: '8px 0', color: '#FDFBF7' }}>{p.name} <span style={{ color: '#8E9E94', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>({p.position}, OVR {p.ovr})</span></td>
                                                            <td style={{ textAlign: 'right', padding: '8px 0' }}><EfButton variant="primary" size="sm" onClick={() => { const r = engine.signScoutedPlayer(i); setLog(r?.msg); forceUpdate(); }} style={{ fontWeight: 'bold' }}>Assinar</EfButton></td>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '24px', color: '#FDFBF7' }}><Envelope weight="fill" /> OFERTAS RECEBIDAS</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
                                    <tbody>
                                        {engine.transferOffers.map((offer, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #1A1F24' }}>
                                                <td style={{ padding: '16px 0' }}>
                                                    <strong style={{ color: '#FDFBF7', fontSize: '1rem' }}>{offer.playerName}</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#8E9E94' }}>(OVR {offer.playerOvr})</span>
                                                    <div style={{ fontSize: '0.8rem', color: '#8E9E94', marginTop: '6px', fontFamily: 'var(--font-sans)' }}>{offer.buyerClub} • <span style={{ fontFamily: 'var(--font-mono)', color: '#39FF14' }}>R$ {(offer.offerAmount / 1000000).toFixed(1)}M</span></div>
                                                </td>
                                                <td style={{ textAlign: 'right', verticalAlign: 'middle', padding: '16px 0' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <EfButton variant="primary" size="sm" title="Aceitar oferta (irreversível: jogador sai do plantel imediatamente)" onClick={() => handleAcceptOffer(offer.playerId)} style={{ fontWeight: 'bold' }}>ACEITAR</EfButton>
                                                        <EfButton variant="danger" size="sm" title="Recusar oferta (cuidado: jogador pode ficar insatisfeito e pedir saída)" onClick={() => handleRejectOffer(offer.playerId)} style={{ fontWeight: 'bold' }}>RECUSAR</EfButton>
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
                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
                    {[{view:'squad',icon:<Users weight="fill"/>,label:'Plantel'},{view:'market',icon:<ShoppingCart weight="fill"/>,label:'Mercado'},{view:'standings',icon:<ChartBar weight="fill"/>,label:'Tabela'}].map(n => (
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1" style={{ justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1rem', gap: '8px' }} onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

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
                        <div style={{ borderLeft: '4px solid #40BAF7', paddingLeft: '16px', marginBottom: '24px', minHeight: '60px' }}>
                            {advicePanel.loading
                                ? <p style={{ margin: 0, fontSize: '0.95rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>Analisando...</p>
                                : <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>{advicePanel.text}</p>
                            }
                        </div>
                        <EfButton variant="primary" size="md" onClick={() => setAdvicePanel({ open: false, loading: false, text: '' })} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                            FECHAR
                        </EfButton>
                    </EfModal>
                )}

                {/* SPEC-167: Última narrativa pós-jogo */}
                {engine.lastMatchNarrative && (
                    <div style={{ marginTop: '24px' }}>
                        <EfPanel padding="md" style={{ borderColor: '#40BAF7', background: '#0D1A24' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#40BAF7', fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '8px' }}>
                                <Newspaper weight="fill" /> CRÔNICA DA PARTIDA
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, fontFamily: 'var(--font-sans)', color: '#FDFBF7' }}>{engine.lastMatchNarrative}</p>
                        </EfPanel>
                    </div>
                )}

                {/* AUDIT-FIX #17: Pacing Friction Modal */}
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
                                {evt.action && (
                                    <EfButton variant="primary" size="md" onClick={() => {
                                        setPacingQueue([]);
                                        if (evt.action === 'tactics') setTab('tactics');
                                        else changeView(evt.action);
                                    }} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
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
                                }} style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
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
