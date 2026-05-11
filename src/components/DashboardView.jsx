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
import bgOffice from '../assets/environments/bg_manager_office.png';

import '../styles/trophy-ceremony.css';
import '../styles/progressive-disclosure.css';
import '../styles/gdd-systems.css';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    // BUG-021: all hooks declared before early return
    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview');
    const [pendingUnlock, setPendingUnlock] = useState(null);
    const [pendingAchievement, setPendingAchievement] = useState(null);
    const [showTutorial, setShowTutorial] = useState(() => {
        try { return !localStorage.getItem('elifoot_tutorial_done') && (engine?.seasonNumber || 1) === 1; }
        catch { return false; }
    });

    // §22.7: Keyboard navigation
    useKeyboardNav({ changeView, currentView: gameState?.view || 'dashboard' });

    // §19.1: Detect newly unlocked views and show tooltip
    React.useEffect(() => {
        if (!engine?.weekEvents) return;
        const unlockEvent = engine.weekEvents.find(e => typeof e === 'string' && e.includes('🔓 Novo acesso'));
        if (unlockEvent) {
            const match = unlockEvent.match(/desbloqueado: (\w+)/);
            if (match && match[1]) setPendingUnlock(match[1]);
        }
        // §17: Detect achievement events
        const achieveEvent = engine.weekEvents.find(e => typeof e === 'string' && (e.includes('🏆 CONQUISTA') || e.includes('🎖️')));
        if (achieveEvent) {
            setPendingAchievement({ emoji: '🏅', name: 'Conquista Desbloqueada!', description: achieveEvent });
        }
    }, [engine?.currentWeek]); // eslint-disable-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        if (!team) return;
    }, [team]);

    if (!team) return <div className="main-content">Time não encontrado.</div>;

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
    const legacyLevel = engine.legacy ? engine.legacy.getLevel() : null;
    const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;

    const handleTrain = (id) => { const result = engine.doTraining(id); setLog(result.msg); forceUpdate(); };
    const handleTeamTalk = (id) => { const result = engine.doTeamTalk(id); if (result.success) setLog(`"${result.talk.text}"`); forceUpdate(); };
    const handleAcceptOffer = (playerId) => { const result = engine.acceptTransferOffer(playerId); setLog(result.msg); forceUpdate(); };
    const handleRejectOffer = (playerId) => { engine.rejectTransferOffer(playerId); setLog('Oferta recusada.'); forceUpdate(); };

    return (
        <div className="ef-layout-pitch ef-anim-fade-in" style={{ backgroundImage: `url(${bgOffice})` }}>
            <div className="ef-layout-container" style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <TrophyCeremony trophy={engine.trophyCeremony?.trophy} season={engine.trophyCeremony?.season} visible={!!engine.trophyCeremony} onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }} />

                {/* === HEADER — DOUBLE BEZEL === */}
                <EfPanel variant="hero" padding="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'inline-block', background: '#000', color: '#888', padding: '4px 12px', borderRadius: '12px', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", letterSpacing: '0.1em', marginBottom: '12px' }}>
                            {pos}º • SÉRIE {['A','B','C','D'][team.division - 1]}
                        </div>
                        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1.2rem', margin: '0 0 12px 0', color: '#FFD700', textShadow: '4px 4px 0 #000' }}>
                            {team.name}
                        </h2>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#8E9E94' }}>
                            {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1rem', color: team.balance > 0 ? '#39FF14' : '#FF3333', textShadow: '3px 3px 0 #000', marginBottom: '8px' }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        {boardStatus && (
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: boardStatus.color, background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '4px', display: 'inline-block' }} title={`Diretoria: ${boardStatus.label} (${engine.board?.confidence ?? 60}%).`}>
                                {boardStatus.emoji} {boardStatus.label}
                            </div>
                        )}
                        <div style={{ marginTop: '16px', width: '200px', marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#8E9E94', marginBottom: '6px' }}>
                                <span>SEM {seasonWeek}/38</span>
                                <span>TEMP {engine.seasonNumber}</span>
                            </div>
                            <div className="ef-minibar-track">
                                <div className="ef-minibar-fill" style={{ width: `${(seasonWeek / 38) * 100}%`, background: '#39FF14', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} />
                            </div>
                        </div>
                    </div>
                </EfPanel>

                {/* === ALERTS === */}
                {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {injured.length > 0 && <EfPanel variant="danger" padding="sm" style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#FF3333' }}>🏥 {injured.length} LESIONADO{injured.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {expiringContracts.length > 0 && <EfPanel variant="warning" padding="sm" style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#FFD700' }}>📋 {expiringContracts.length} CONTRATO{expiringContracts.length > 1 ? 'S' : ''}</span></EfPanel>}
                        {avgEnergy < 50 && <EfPanel variant="danger" padding="sm" style={{ display: 'inline-flex', alignItems: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#FF3333' }}>⚡ CANSADO ({avgEnergy.toFixed(0)}%)</span></EfPanel>}
                        {(engine.transferOffers?.length ?? 0) > 0 && <EfPanel variant="elev" padding="sm" style={{ display: 'inline-flex', alignItems: 'center', borderColor: '#40BAF7', cursor: 'pointer' }} onClick={() => setTab('transfers')}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#40BAF7' }}>📬 {(engine.transferOffers?.length ?? 0)} OFERTA{(engine.transferOffers?.length ?? 0) > 1 ? 'S' : ''}</span></EfPanel>}
                    </div>
                )}

                {/* === BENTO GRID LAYOUT === */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* LEFT COLUMN: Navigation & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <EfPanel variant="elev" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{id:'overview',label:'VISÃO GERAL'},{id:'tactics',label:'TÁTICAS'},{id:'training',label:'TREINO'},{id:'club',label:'CLUBE'},...((engine.transferOffers?.length ?? 0) > 0 ? [{id:'transfers',label:'OFERTAS'}] : [])].map(t => (
                                <EfButton key={t.id} variant={tab === t.id ? 'primary' : 'secondary'} size="md" onClick={() => setTab(t.id)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                    {t.label}
                                </EfButton>
                            ))}
                        </EfPanel>

                        <div style={{ marginTop: 'auto' }}>
                            <EfButton variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '24px' }} onClick={() => { engine.checkPressConference(); if (!engine.pressQuestion) changeView('match'); else forceUpdate(); }}>
                                ⚽ JOGAR PARTIDA
                            </EfButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Content Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* NEXT MATCH INFO (Always visible above tabs) */}
                        <EfPanel variant="sunk" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#8E9E94', display: 'block', marginBottom: '8px' }}>FORMAÇÃO ATUAL</span>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FDFBF7' }}>{team.formation}</span>
                                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: '#555' }}>•</span>
                                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: '#39FF14' }}>{TACTICS[engine.currentTactic]?.name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FFD700', display: 'block' }}><AnimatedStat value={sectors.goalkeeper} /></span><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', color: '#8E9E94' }}>GOL</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#40BAF7', display: 'block' }}><AnimatedStat value={sectors.defense} /></span><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', color: '#8E9E94' }}>DEF</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#39FF14', display: 'block' }}><AnimatedStat value={sectors.midfield} /></span><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', color: '#8E9E94' }}>MEI</span></div>
                                <div style={{ textAlign: 'center' }}><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', color: '#FF3333', display: 'block' }}><AnimatedStat value={sectors.attack} /></span><span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.45rem', color: '#8E9E94' }}>ATA</span></div>
                            </div>
                        </EfPanel>

                        {/* TAB CONTENTS */}
                        {tab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                {/* Left Sub-column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                                        <EfPanel variant="elev" padding="md" style={{ borderColor: '#40BAF7' }}>
                                            <div className="ef-panel-header" style={{ color: '#40BAF7', borderBottom: 'none', padding: 0, marginBottom: '12px' }}>💡 PLAYBOOK DO TREINADOR</div>
                                            <div style={{ fontSize: '0.85rem', color: '#8E9E94', lineHeight: 1.6 }}>
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
                                    
                                    <EfPanel variant="elev" padding="md">
                                        <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>💰 FINANÇAS</div>
                                        {engine.weeklyFinance ? (
                                            <table className="ef-table">
                                                <tbody>
                                                    {engine.weeklyFinance.details.map((d, i) => (
                                                        <tr key={i}>
                                                            <td style={{ color: '#8E9E94' }}>{d.label}</td>
                                                            <td style={{ textAlign: 'right', color: d.type === 'income' ? '#39FF14' : '#FF3333' }}>
                                                                {d.type === 'income' ? '+' : '-'}R$ {(d.amount / 1000).toFixed(0)}K
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <p style={{ color: '#8E9E94', fontSize: '0.8rem' }}>Jogue a próxima partida para ver o relatório.</p>}
                                    </EfPanel>

                                    {engine.activeLoan && (
                                        <EfPanel variant="warning" padding="md">
                                            <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>🏦 EMPRÉSTIMO ATIVO</div>
                                            <table className="ef-table">
                                                <tbody>
                                                    <tr><td style={{ color: '#8E9E94' }}>Principal</td><td style={{ textAlign: 'right' }}>R$ {(engine.activeLoan.principal / 1_000_000).toFixed(1)}M</td></tr>
                                                    <tr><td style={{ color: '#8E9E94' }}>Parcela</td><td style={{ textAlign: 'right', color: '#FF3333' }}>R$ {(engine.activeLoan.weeklyPayment / 1000).toFixed(0)}K</td></tr>
                                                    <tr><td style={{ color: '#8E9E94' }}>Restante</td><td style={{ textAlign: 'right' }}>{engine.activeLoan.weeksRemaining} sem</td></tr>
                                                </tbody>
                                            </table>
                                            {team.balance >= engine.activeLoan.totalOwed && (
                                                <EfButton variant="primary" size="md" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => { engine.payOffLoan(); forceUpdate(); }}>
                                                    Quitar Antecipadamente
                                                </EfButton>
                                            )}
                                        </EfPanel>
                                    )}
                                </div>
                                {/* Right Sub-column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {(engine.weekEvents?.length ?? 0) > 0 && (
                                        <EfPanel variant="elev" padding="md">
                                            <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>📰 EVENTOS DA SEMANA</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {(engine.weekEvents || []).map((ev, i) => {
                                                    const evText = typeof ev === 'string' ? ev : (ev?.text || ev?.msg || '');
                                                    const isGood = evText.includes('📈') || evText.includes('🎉') || evText.includes('📚') || evText.includes('🇧🇷') || evText.includes('🎂');
                                                    const isBad = evText.includes('📉') || evText.includes('☠️') || evText.includes('👴') || evText.includes('🕺') || evText.includes('🥊');
                                                    return (
                                                        <div key={i} style={{ 
                                                            padding: '8px 12px', 
                                                            background: isGood ? 'rgba(0,255,102,0.1)' : isBad ? 'rgba(255,23,68,0.1)' : 'rgba(255,255,255,0.05)', 
                                                            borderLeft: `2px solid ${isGood ? '#39FF14' : isBad ? '#FF3333' : '#4A5059'}`,
                                                            fontSize: '0.8rem',
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
                                        <EfPanel variant={engine.boardTension < -20 ? 'danger' : engine.boardTension > 40 ? 'hero' : 'elev'} padding="md">
                                            <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none', color: engine.boardTension < -20 ? '#FF3333' : engine.boardTension > 40 ? '#39FF14' : '#FFD700' }}>🏛️ TENSÃO DA DIRETORIA</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <span>
                                                    {engine.boardTension >= 40 ? '🟢 Estável' : engine.boardTension >= 0 ? '🟡 Atenção' : engine.boardTension >= -40 ? '🟠 Pressão' : '🔴 Crise'}
                                                </span>
                                                <strong style={{ color: engine.boardTension >= 0 ? '#39FF14' : '#FF3333', fontSize: '1rem' }}>
                                                    {engine.boardTension > 0 ? '+' : ''}{engine.boardTension}
                                                </strong>
                                            </div>
                                            <div className="ef-minibar-track" style={{ marginTop: '12px' }}>
                                                <div className="ef-minibar-fill" style={{ width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%`, background: engine.boardTension >= 0 ? '#39FF14' : '#FF3333' }} />
                                            </div>
                                        </EfPanel>
                                    )}

                                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                                        <EfPanel variant="sunk" padding="md">
                                            <div className="ef-panel-header" style={{ padding: 0, marginBottom: '12px', borderBottom: 'none' }}>📊 FORMA RECENTE</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {stats.rollingForm.map((r, i) => (
                                                    <span key={i} style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '24px', height: '24px', border: '2px solid #000', fontSize: '0.7rem', fontFamily: "'Press Start 2P', monospace",
                                                        backgroundColor: r === 'W' ? '#0A4A0A' : r === 'D' ? '#AA8800' : '#400000',
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <EfPanel variant="elev" padding="lg">
                                    <div className="ef-panel-header" style={{ padding: 0, marginBottom: '24px', borderBottom: 'none' }}>FORMAÇÃO</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {Object.keys(FORMATIONS).map(f => (
                                            <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setFormation(f); forceUpdate(); }}>{f}</EfButton>
                                        ))}
                                    </div>
                                    <div className="ef-panel-header" style={{ padding: 0, margin: '32px 0 24px 0', borderBottom: 'none' }}>TÁTICA DE JOGO</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {Object.entries(TACTICS).map(([k, v]) => (
                                            <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'} size="md" onClick={() => { engine.setTactic(k); forceUpdate(); }}>{v.name}</EfButton>
                                        ))}
                                    </div>
                                    <p style={{ color: '#8E9E94', fontSize: '0.85rem', marginTop: '16px', lineHeight: 1.5 }}>{TACTICS[engine.currentTactic]?.description}</p>
                                </EfPanel>

                                <EfPanel variant="elev" padding="lg">
                                    <div className="ef-panel-header" style={{ padding: 0, marginBottom: '24px', borderBottom: 'none' }}>📢 PRELEÇÃO</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {TEAM_TALKS.map(t => (
                                            <EfButton key={t.id} variant="secondary" size="md" style={{ justifyContent: 'flex-start', padding: '16px' }} onClick={() => handleTeamTalk(t.id)}>
                                                {t.name}
                                            </EfButton>
                                        ))}
                                    </div>
                                </EfPanel>
                            </div>
                        )}

                        {tab === 'training' && (
                            <EfPanel variant="elev" padding="lg">
                                <div className="ef-panel-header" style={{ padding: 0, marginBottom: '24px', borderBottom: 'none' }}>TREINO SEMANAL</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {TRAINING_TYPES.map(t => (
                                        <EfButton key={t.id} variant={engine.currentTraining === t.id ? 'primary' : 'secondary'} size="lg" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px', gap: '12px' }} onClick={() => handleTrain(t.id)}>
                                            <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
                                            <span style={{ fontSize: '0.6rem', color: engine.currentTraining === t.id ? '#1A8A0A' : '#8E9E94', whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.4 }}>{t.description}</span>
                                        </EfButton>
                                    ))}
                                </div>
                            </EfPanel>
                        )}

                        {tab === 'club' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <EfPanel variant="sunk" padding="md">
                                        <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>🏟️ {stadiumInfo.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#8E9E94', marginBottom: '16px' }}>Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</div>
                                        <div className="ef-minibar-track" style={{ marginBottom: '8px' }}>
                                            <div className="ef-minibar-fill" style={{ width: `${(engine.stadiumLevel / 5) * 100}%`, background: '#40BAF7' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', fontFamily: "'Press Start 2P', monospace", color: '#8E9E94' }}>NÍVEL {engine.stadiumLevel}/5</span>
                                            {engine.stadiumLevel < 5 && (
                                                <EfButton variant="primary" size="sm" onClick={() => { const r = engine.upgradeStadium(); setLog(r.msg); forceUpdate(); }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>

                                    <EfPanel variant="sunk" padding="md">
                                        <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>🎓 BASE Nv.{engine.academyLevel}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#8E9E94', marginBottom: '16px' }}>Produz {engine.academyLevel + 1} jovens/temporada</div>
                                        <div className="ef-minibar-track" style={{ marginBottom: '8px' }}>
                                            <div className="ef-minibar-fill" style={{ width: `${(engine.academyLevel / 5) * 100}%`, background: '#FFD700' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', fontFamily: "'Press Start 2P', monospace", color: '#8E9E94' }}>NÍVEL {engine.academyLevel}/5</span>
                                            {engine.academyLevel < 5 && (
                                                <EfButton variant="primary" size="sm" onClick={() => { const r = engine.upgradeAcademy(); setLog(r.msg); forceUpdate(); }}>UPGRADE</EfButton>
                                            )}
                                        </div>
                                    </EfPanel>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <EfPanel variant="sunk" padding="md">
                                        <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>👥 STAFF</div>
                                        <table className="ef-table">
                                            <tbody>
                                                {STAFF_ROLES.map(role => {
                                                    const member = engine.staff?.getStaff(role.id);
                                                    return (
                                                        <tr key={role.id}>
                                                            <td>{role.emoji} {role.name}</td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                {member ? <strong style={{ color: '#39FF14' }}>{member.name}</strong> : <EfButton variant="secondary" size="sm" onClick={() => { const r = engine.hireStaff(role.id); setLog(r.msg); forceUpdate(); }}>Contratar</EfButton>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </EfPanel>

                                    <EfPanel variant="sunk" padding="md">
                                        <div className="ef-panel-header" style={{ padding: 0, marginBottom: '16px', borderBottom: 'none' }}>🔎 SCOUTING</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                            {SCOUT_REGIONS.map(r => (
                                                <EfButton key={r.id} variant="secondary" size="sm" onClick={() => { const res = engine.scoutRegionAction(r.id); setLog(res.msg); forceUpdate(); }}>
                                                    {r.emoji} {r.name}
                                                </EfButton>
                                            ))}
                                        </div>
                                        {engine.scoutedPlayers?.length > 0 && (
                                            <table className="ef-table">
                                                <tbody>
                                                    {engine.scoutedPlayers.map((p, i) => (
                                                        <tr key={i}>
                                                            <td>{p.name} ({p.position}, OVR {p.ovr})</td>
                                                            <td style={{ textAlign: 'right' }}><EfButton variant="primary" size="sm" onClick={() => { const r = engine.signScoutedPlayer(i); setLog(r?.msg); forceUpdate(); }}>Assinar</EfButton></td>
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
                            <EfPanel variant="elev" padding="lg">
                                <div className="ef-panel-header" style={{ padding: 0, marginBottom: '24px', borderBottom: 'none' }}>📬 OFERTAS RECEBIDAS</div>
                                <table className="ef-table">
                                    <tbody>
                                        {engine.transferOffers.map((offer, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <strong>{offer.playerName}</strong> (OVR {offer.playerOvr})
                                                    <div style={{ fontSize: '0.75rem', color: '#8E9E94', marginTop: '4px' }}>{offer.buyerClub} • R$ {(offer.offerAmount / 1000000).toFixed(1)}M</div>
                                                </td>
                                                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <EfButton variant="primary" size="sm" onClick={() => handleAcceptOffer(offer.playerId)}>ACEITAR</EfButton>
                                                        <EfButton variant="danger" size="sm" onClick={() => handleRejectOffer(offer.playerId)}>RECUSAR</EfButton>
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
                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                    {[{view:'squad',icon:'👥',label:'PLANTEL'},{view:'market',icon:'🛒',label:'MERCADO'},{view:'standings',icon:'📊',label:'TABELA'}].map(n => (
                        <EfButton key={n.view} variant="secondary" size="lg" className="ef-flex-1" style={{ justifyContent: 'center', padding: '20px' }} onClick={() => changeView(n.view)}>
                            {n.icon} {n.label}
                        </EfButton>
                    ))}
                </div>

                {/* Feedback log */}
                {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

                {/* Modals */}
                {engine.pressQuestion && (
                    <EfModal title="🎙️ Coletiva de Imprensa" onClose={() => {}}>
                        <p style={{ marginBottom: '24px', fontSize: '1rem', lineHeight: 1.5 }}>{engine.pressQuestion.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {engine.pressQuestion.options.map(opt => (
                                <EfButton key={opt.id} variant="secondary" size="md" onClick={() => { const result = engine.answerPress(opt.id); if (result) setLog(`Coletiva: ${result.answer}`); forceUpdate(); }} style={{ textAlign: 'left', width: '100%', justifyContent: 'flex-start', padding: '16px' }}>
                                    {opt.text}
                                </EfButton>
                            ))}
                        </div>
                    </EfModal>
                )}

                {pendingUnlock && <UnlockTooltip viewId={pendingUnlock} onDismiss={() => setPendingUnlock(null)} />}
                {pendingAchievement && <AchievementPopup achievement={pendingAchievement} onDismiss={() => setPendingAchievement(null)} />}
                <TutorialOverlay visible={showTutorial} onDismiss={() => setShowTutorial(false)} />
            </div>
        </div>
    );
}
