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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgOffice})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            minHeight: '100dvh',
            padding: '16px',
            color: '#E2E8F0',
            backgroundColor: '#0A130E',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* §16.2: Trophy ceremony overlay */}
            <TrophyCeremony
                trophy={engine.trophyCeremony?.trophy}
                season={engine.trophyCeremony?.season}
                visible={!!engine.trophyCeremony}
                onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }}
            />
            {/* === COMPACT HEADER — 16-BIT ARCADE === */}
            <div style={{background:'#1E2124',border:'4px solid',borderColor:'#4A5059 #111417 #111417 #4A5059',padding:'16px',boxShadow:'0 8px 0 rgba(0,0,0,0.8)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                        <h2 style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.9rem',margin:'0 0 8px 0',color:'#FFD700',textShadow:'3px 3px 0 #000'}}>{team.name}</h2>
                        <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#888'}}>
                            {pos}º • SÉRIE {['A','B','C','D'][team.division - 1]} • {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.8rem',color: team.balance > 0 ? '#39FF14' : '#FF3333',textShadow:'2px 2px 0 #000'}}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        {boardStatus && <div style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color: boardStatus.color,marginTop:'4px'}} title={`Diretoria: ${boardStatus.label} (${engine.board?.confidence ?? 60}%). Demissão se < 10%.`}>{boardStatus.emoji} {boardStatus.label}</div>}
                    </div>
                </div>
                {/* Season progress — HP bar */}
                <div style={{height:'12px',background:'#222',border:'4px solid',borderColor:'#000 #333 #333 #000',overflow:'hidden',marginTop:'12px'}}>
                    <div style={{height:'100%',width:`${(seasonWeek / 38) * 100}%`,background:'linear-gradient(to bottom, #39FF14 0%, #1A8A0A 100%)',boxShadow:'inset 0 2px 0 rgba(255,255,255,0.3)',transition:'width 300ms ease-out'}} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color:'#888',marginTop:'6px'}}>
                    <span>TEMP {engine.seasonNumber} • SEM {seasonWeek}/38</span>
                    {legacyLevel && <span>{legacyLevel.emoji} {legacyLevel.label}</span>}
                </div>
            </div>

            {/* === ALERTS — 16-BIT ARCADE === */}
            {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {injured.length > 0 && <span style={{background:'#1A0A0A',border:'4px solid',borderColor:'#FF3333 #AA1111 #AA1111 #FF3333',padding:'6px 12px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#FF3333'}}>🏥 {injured.length} LESIONADO{injured.length > 1 ? 'S' : ''}</span>}
                    {expiringContracts.length > 0 && <span style={{background:'#1A1A0A',border:'4px solid',borderColor:'#FFD700 #AA8800 #AA8800 #FFD700',padding:'6px 12px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#FFD700'}}>📋 {expiringContracts.length} CONTRATO{expiringContracts.length > 1 ? 'S' : ''}</span>}
                    {avgEnergy < 50 && <span style={{background:'#1A0A0A',border:'4px solid',borderColor:'#FF3333 #AA1111 #AA1111 #FF3333',padding:'6px 12px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#FF3333'}}>⚡ CANSADO ({avgEnergy.toFixed(0)}%)</span>}
                    {(engine.transferOffers?.length ?? 0) > 0 && <span style={{background:'#0A0A1A',border:'4px solid',borderColor:'#40BAF7 #2070A0 #2070A0 #40BAF7',padding:'6px 12px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#40BAF7',cursor:'pointer'}} onClick={() => setTab('transfers')}>📬 {(engine.transferOffers?.length ?? 0)} OFERTA{(engine.transferOffers?.length ?? 0) > 1 ? 'S' : ''}</span>}
                </div>
            )}

            {/* === NEXT MATCH CTA — 16-BIT ARCADE === */}
            <div style={{background:'#111417',border:'4px solid',borderColor:'#39FF14 #1A8A0A #1A8A0A #39FF14',padding:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                    <div>
                        <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#888',display:'block',marginBottom:'6px'}}>PRÓXIMO JOGO</span>
                        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                            <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color:'#FFF'}}>{team.formation}</span>
                            <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#555'}}>•</span>
                            <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.6rem',color:'#39FF14'}}>{TACTICS[engine.currentTactic]?.name}</span>
                        </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                        {cond && <span style={{background:'#0A0A1A',border:'3px solid #40BAF7',padding:'4px 10px',fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color:'#40BAF7'}}>{cond.name}</span>}
                    </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:'8px',marginBottom:'12px'}}>
                    <Help id="sector.gol"><div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}}><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color:'#FFD700',display:'block'}}><AnimatedStat value={sectors.goalkeeper} /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>GOL</span></div></Help>
                    <Help id="sector.def"><div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}}><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color:'#40BAF7',display:'block'}}><AnimatedStat value={sectors.defense} /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>DEF</span></div></Help>
                    <Help id="sector.mei"><div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}}><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color:'#39FF14',display:'block'}}><AnimatedStat value={sectors.midfield} /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>MEI</span></div></Help>
                    <Help id="sector.ata"><div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}}><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color:'#FF3333',display:'block'}}><AnimatedStat value={sectors.attack} /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>ATA</span></div></Help>
                    <div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}} title="Moral média do plantel"><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color: avgMoral > 60 ? '#39FF14' : avgMoral < 40 ? '#FF3333' : '#FFD700',display:'block'}}><AnimatedStat value={Math.round(avgMoral)} suffix="%" /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>MOR</span></div>
                    <div style={{background:'#1E2124',border:'3px solid #000',padding:'8px',textAlign:'center'}} title="Energia média"><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.7rem',color: avgEnergy < 50 ? '#FF3333' : '#39FF14',display:'block'}}><AnimatedStat value={Math.round(avgEnergy)} suffix="%" /></span><span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#888'}}>NRG</span></div>
                </div>
                <div
                    onClick={() => {
                        engine.checkPressConference();
                        if (!engine.pressQuestion) changeView('match');
                        else forceUpdate();
                    }}
                    style={{background:'#0A1A0A',border:'4px solid',borderColor:'#39FF14 #1A8A0A #1A8A0A #39FF14',padding:'14px',textAlign:'center',cursor:'pointer',fontFamily:"'Press Start 2P', monospace",fontSize:'0.8rem',color:'#39FF14',textShadow:'2px 2px 0 #000',boxShadow:'0 4px 0 #0A4A0A'}}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0F2F0F'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#0A1A0A'}
                >⚽ JOGAR PARTIDA</div>
            </div>

            {/* === TABS — 16-BIT ARCADE === */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '4px' }}>
                {[{id:'overview',label:'VISÃO GERAL'},{id:'tactics',label:'TÁTICAS'},{id:'training',label:'TREINO'},{id:'club',label:'CLUBE'},...((engine.transferOffers?.length ?? 0) > 0 ? [{id:'transfers',label:'OFERTAS'}] : [])].map(t => (
                    <div key={t.id} onClick={() => setTab(t.id)} style={{
                        background: tab === t.id ? '#1E2124' : '#111',
                        border: '4px solid',
                        borderColor: tab === t.id ? '#FFD700 #AA8800 #AA8800 #FFD700' : '#333 #000 #000 #333',
                        padding: '10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.5rem',
                        color: tab === t.id ? '#FFD700' : '#888'
                    }}>{t.label}</div>
                ))}
            </div>

            {/* Feedback log */}
            {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

            {/* === TAB: OVERVIEW === */}
            {tab === 'overview' && (
                <>
                    {/* Onboarding hints */}
                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#0F2942', border: '2px solid #3B82F6', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#40BAF7',marginBottom:'0.3rem'}}>💡 PLAYBOOK DO TREINADOR</h4>
                            <div style={{fontSize:'0.75rem',color:'#888',lineHeight:1.6}}>
                                <p>1️⃣ <strong>Táticas:</strong> escolha formação e tática antes de jogar</p>
                                <p>2️⃣ <strong>Treino:</strong> treine o plantel toda semana para melhorar atributos</p>
                                <p>3️⃣ <strong>Plantel:</strong> escale seus melhores 11 e monitore energia</p>
                                <p>4️⃣ <strong>Clube:</strong> upgrade estádio e base para crescer</p>
                                <p>5️⃣ <strong>Jogo:</strong> no intervalo, ajuste tática e faça substituições</p>
                            </div>
                        </EfPanel>
                    )}
                    {/* §12.4 #6: Scarcity urgency */}
                    <ScarcityBanner engine={engine} />

                    {/* §12.4 #8: Loss Avoidance dread */}
                    <DreadIndicator engine={engine} />

                    {/* §19.3: Aha Moment — contextual teaching */}
                    <AhaMomentCard engine={engine} />

                    {/* Season Awards (if any) */}
                    {engine.seasonAwards && engine.seasonAwards.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3D280B', border: '2px solid #F59E0B', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#FFD700',marginBottom:'0.3rem'}}>🏆 PRÊMIOS DA TEMPORADA</h4>
                            {engine.seasonAwards.map((a, i) => (
                                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',padding:'0.2rem 0',borderBottom:'2px solid #111'}}>
                                    <span>{a.emoji} {a.name}</span>
                                    <strong style={{color:'#FFD700'}}>{a.player} ({a.value})</strong>
                                </div>
                            ))}
                        </EfPanel>
                    )}

                    {/* AKITA-142: Board Tension Widget */}
                    {typeof engine.boardTension === 'number' && (
                        <EfPanel variant="sunk" padding="sm" style={{
                            backgroundColor: engine.boardTension < -20 ? '#3A1010' : engine.boardTension > 40 ? '#0B2015' : '#3D280B',
                            border: `2px solid ${engine.boardTension < -20 ? '#EF4444' : engine.boardTension > 40 ? '#10B981' : '#F59E0B'}`,
                            marginBottom: '0.5rem'
                        }}>
                            <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>🏛️ TENSÃO DA DIRETORIA</h4>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.78rem'}}>
                                <span>
                                    {engine.boardTension >= 40 ? '🟢 Estável' :
                                     engine.boardTension >= 0 ? '🟡 Atenção' :
                                     engine.boardTension >= -40 ? '🟠 Pressão' : '🔴 Crise'}
                                </span>
                                <strong style={{color: engine.boardTension >= 0 ? '#39FF14' : '#FF3333'}}>
                                    {engine.boardTension > 0 ? '+' : ''}{engine.boardTension}
                                </strong>
                            </div>
                            <div style={{height:'6px',background:'#000',border:'1px solid #444',overflow:'hidden',marginTop:'0.3rem'}}>
                                <div style={{
                                    width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%`,
                                    height:'100%',
                                    background: engine.boardTension >= 0 ? '#39FF14' : '#FF3333',
                                }} />
                            </div>
                        </EfPanel>
                    )}

                    {/* AKITA-142: Loss Streak Warning */}
                    {stats.lossStreak >= 3 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3A1010', border: '2px solid #EF4444', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#FF3333',marginBottom:'0.3rem'}}>🔥 CRISE DE RESULTADOS</h4>
                            <p style={{fontSize:'0.78rem',color:'#888',margin:0}}>
                                {stats.lossStreak} derrotas seguidas — moral do elenco abalada!
                            </p>
                        </EfPanel>
                    )}

                    {/* DDA & Rolling Form */}
                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>📊 FORMA RECENTE & DDA</h4>
                            <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.4rem'}}>
                                {stats.rollingForm.map((r, i) => (
                                    <span key={i} style={{
                                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                                        width:'1.5rem', height:'1.5rem', border: '2px solid #000', fontSize:'0.7rem', fontWeight:600,
                                        backgroundColor: r === 'W' ? '#0B2015' : r === 'D' ? '#3D280B' : '#3A1010',
                                        color: r === 'W' ? '#39FF14' : r === 'D' ? '#FFD700' : '#FF3333'
                                    }}>{r}</span>
                                ))}
                            </div>
                            {(() => {
                                if (stats.rollingForm.length >= 5) {
                                    const wins = stats.rollingForm.filter(r => r === 'W').length;
                                    const winRate = wins / stats.rollingForm.length;
                                    if (winRate > 0.8) return <span style={{fontSize:'0.7rem',color:'#FF3333'}}>⚠️ DDA Ativo: Oponentes com Boost (+15%)</span>;
                                    if (winRate <= 0.2) return <span style={{fontSize:'0.7rem',color:'#39FF14'}}>⚖️ DDA Ativo: Oponentes com Debuff (-15%)</span>;
                                    return <span style={{fontSize:'0.7rem',color:'#888'}}>DDA: Flow Channel (Balanceado)</span>;
                                }
                                return <span style={{fontSize:'0.7rem',color:'#888'}}>DDA: Calibrando (mín. 5 jogos)</span>;
                            })()}
                        </EfPanel>
                    )}

                    {/* AKITA-142: Coach Proposal */}
                    {engine.pendingCoachProposal && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#0F2942', border: '2px solid #3B82F6', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#40BAF7',marginBottom:'0.3rem'}}>📨 PROPOSTA DE EMPREGO</h4>
                            <p style={{fontSize:'0.78rem',color:'#888',margin:'0 0 0.3rem'}}>
                                <strong>{engine.pendingCoachProposal.fromClubName}</strong> quer contratá-lo!
                                <br/><span style={{fontSize:'0.72rem'}}>{engine.pendingCoachProposal.reason}</span>
                            </p>
                        </EfPanel>
                    )}

                    {/* AKITA-142: Active Challenge */}
                    {engine.activeChallenge && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#270F3A', border: '2px solid #A855F7', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#A855F7',marginBottom:'0.3rem'}}>🎯 DESAFIO ATIVO</h4>
                            <p style={{fontSize:'0.78rem',color:'#888',margin:0}}>
                                {engine.activeChallenge.description}
                            </p>
                        </EfPanel>
                    )}

                    {/* §14: Weekly Challenges Widget */}
                    <ChallengesWidget />

                    {/* §14.3: Meta-Progression Cross-Career Achievements (compact) */}
                    {(() => {
                        try {
                            const metaAchs = getAllAchievements();
                            const unlocked = metaAchs.filter(a => a.unlocked);
                            if (unlocked.length === 0) return null;
                            return (
                                <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E0D33', border: '2px solid #7B2CBF', marginBottom: '0.5rem'}}>
                                    <h4 style={{fontSize:'0.8rem',color:'#A855F7',marginBottom:'0.3rem'}}>
                                        🏅 CONQUISTAS DE CARREIRA ({unlocked.length}/{metaAchs.length})
                                    </h4>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                        {unlocked.map(a => (
                                            <span key={a.id} style={{fontSize:'0.72rem',padding:'0.15rem 0.4rem',border:'2px solid #000',backgroundColor:'#270F3A',color:'#A855F7'}} title={a.description}>
                                                {a.emoji} {a.name}
                                            </span>
                                        ))}
                                    </div>
                                </EfPanel>
                            );
                        } catch { return null; }
                    })()}

                    {/* AKITA-142: Hall of Legends (compact) */}
                    {engine.hallOfLegends && engine.hallOfLegends.filledCount > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3D280B', border: '2px solid #F59E0B', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#FFD700',marginBottom:'0.3rem'}}>⭐ HALL DE LENDAS ({engine.hallOfLegends.filledCount}/{engine.hallOfLegends.slots?.length || 6})</h4>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                {(engine.hallOfLegends.slots || []).filter(s => s.filled).map((s, i) => (
                                    <span key={i} style={{fontSize:'0.72rem',padding:'0.15rem 0.4rem',border:'2px solid #000',backgroundColor:'#4A320E',color:'#FFD700'}}>
                                        {s.playerName || `Lenda #${i+1}`}
                                    </span>
                                ))}
                            </div>
                        </EfPanel>
                    )}

                    {(engine.weekEvents?.length ?? 0) > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>📰 EVENTOS DA SEMANA</h4>
                            <div className="event-feed">
                                {(engine.weekEvents || []).map((ev, i) => {
                                    const evText = typeof ev === 'string' ? ev : (ev?.text || ev?.msg || '');
                                    const isGood = evText.includes('📈') || evText.includes('🎉') || evText.includes('📚') || evText.includes('🇧🇷') || evText.includes('🎂');
                                    const isBad = evText.includes('📉') || evText.includes('☠️') || evText.includes('👴') || evText.includes('🕺') || evText.includes('🥊');
                                    return <div key={i} className={`event-item ${isGood ? 'highlight' : ''} ${isBad ? 'danger' : ''}`}>{evText}</div>;
                                })}
                            </div>
                        </EfPanel>
                    )}

                    {/* §19.1: Unlock tooltip */}
                    {pendingUnlock && (
                        <UnlockTooltip viewId={pendingUnlock} onDismiss={() => setPendingUnlock(null)} />
                    )}

                    {/* §17: Achievement celebration popup */}
                    {pendingAchievement && (
                        <AchievementPopup achievement={pendingAchievement} onDismiss={() => setPendingAchievement(null)} />
                    )}

                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>💰 FINANÇAS</h4>
                        {engine.weeklyFinance ? (
                            <ul className="stats-list">
                                {engine.weeklyFinance.details.map((d, i) => (
                                    <li key={i}>
                                        <span>{d.label}</span>
                                        <strong style={{color: d.type === 'income' ? '#39FF14' : '#FF3333'}}>
                                            {d.type === 'income' ? '+' : '-'}R$ {(d.amount / 1000).toFixed(0)}K
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        ) : <p style={{color:'#888',fontSize:'0.78rem'}}>Jogue a próxima partida para ver o relatório.</p>}
                    </EfPanel>

                    {/* Loan System */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>🏦 EMPRÉSTIMO</h4>
                        {engine.activeLoan ? (
                            <div>
                                <ul className="stats-list">
                                    <li><span>Principal</span><strong>R$ {(engine.activeLoan.principal / 1_000_000).toFixed(1)}M</strong></li>
                                    <li><span>Juros</span><strong>{(engine.activeLoan.interestRate * 100).toFixed(0)}%</strong></li>
                                    <li><span>Parcela semanal</span><strong style={{color:'#FF3333'}}>R$ {(engine.activeLoan.weeklyPayment / 1000).toFixed(0)}K</strong></li>
                                    <li><span>Semanas restantes</span><strong>{engine.activeLoan.weeksRemaining}</strong></li>
                                    <li><span>Total restante</span><strong style={{color:'#FF3333'}}>R$ {(engine.activeLoan.totalOwed / 1_000_000).toFixed(1)}M</strong></li>
                                </ul>
                                {team.balance >= engine.activeLoan.totalOwed && (
                                    <EfButton variant="primary" size="sm" style={{marginTop:'0.3rem',width:'100%'}}
                                        onClick={() => { engine.payOffLoan(); forceUpdate(); }}>
                                        Quitar Antecipadamente
                                    </EfButton>
                                )}
                            </div>
                        ) : (() => {
                            const loanOpts = engine.getLoanOptions();
                            if (!loanOpts.available) return <p style={{color:'#888',fontSize:'0.72rem'}}>{loanOpts.reason || 'Indisponível'}</p>;
                            return (
                                <div className="action-bar" style={{flexWrap:'wrap',gap:'0.3rem'}}>
                                    {loanOpts.options.map((opt, i) => (
                                        <EfButton key={i} variant="secondary" size="sm"
                                            onClick={() => { engine.takeLoan(opt.amount); forceUpdate(); }}>
                                            {opt.label}: R$ {(opt.amount / 1_000_000).toFixed(1)}M
                                            <span style={{display:'block',fontSize:'0.6rem',opacity:0.7}}>
                                                {(loanOpts.interestRate * 100).toFixed(0)}% • R${(opt.weeklyPayment / 1000).toFixed(0)}K/sem
                                            </span>
                                        </EfButton>
                                    ))}
                                </div>
                            );
                        })()}
                    </EfPanel>

                    {injured.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3A1010', border: '2px solid #EF4444', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#FF3333',marginBottom:'0.3rem'}}>🏥 D.M. ({injured.length})</h4>
                            <ul className="stats-list">
                                {injured.map((p, i) => (
                                    <li key={i}><span>{p.injury.emoji} {p.name} — {p.injury.name}</span><strong style={{color:'#FF3333'}}>{p.injury.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </EfPanel>
                    )}

                    {expiringContracts.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3D280B', border: '2px solid #F59E0B', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#FFD700',marginBottom:'0.3rem'}}>📋 CONTRATOS VENCENDO</h4>
                            <ul className="stats-list">
                                {expiringContracts.map((p, i) => (
                                    <li key={i}><span>{p.name} (OVR {p.ovr})</span><strong style={{color: p.contract.weeksLeft <= 4 ? '#FF3333' : '#FFD700'}}>{p.contract.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </EfPanel>
                    )}
                </>
            )}

            {/* === TAB: TACTICS === */}
            {tab === 'tactics' && (
                <EfPanel variant="elev" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #4A5059', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.4rem'}}>FORMAÇÃO</h4>
                    <div className="action-bar">
                        {Object.keys(FORMATIONS).map(f => (
                            <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'} size="sm"
                                onClick={() => { engine.setFormation(f); forceUpdate(); }}>
                                {f}
                            </EfButton>
                        ))}
                    </div>
                    <h4 style={{fontSize:'0.8rem',color:'#888',margin:'0.75rem 0 0.4rem'}}>TÁTICA</h4>
                    <div className="action-bar">
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'} size="sm"
                                onClick={() => { engine.setTactic(k); forceUpdate(); }}>
                                {v.name}
                            </EfButton>
                        ))}
                    </div>
                    <p style={{color:'#888',fontSize:'0.75rem',marginTop:'0.4rem'}}>{TACTICS[engine.currentTactic]?.description}</p>

                    <h4 style={{fontSize:'0.8rem',color:'#888',margin:'0.75rem 0 0.4rem'}}>📢 PRELEÇÃO</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        {TEAM_TALKS.map(t => (
                            <EfButton key={t.id} variant="secondary" size="sm" style={{justifyContent:'flex-start'}}
                                onClick={() => handleTeamTalk(t.id)}>
                                <span>{t.name}</span>
                            </EfButton>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* === TAB: TRAINING === */}
            {tab === 'training' && (
                <EfPanel variant="elev" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #4A5059', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.4rem'}}>TREINO SEMANAL</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        {TRAINING_TYPES.map(t => (
                            <EfButton key={t.id} variant={engine.currentTraining === t.id ? 'primary' : 'secondary'}
                                style={{justifyContent:'space-between',fontSize:'0.8rem'}}
                                onClick={() => handleTrain(t.id)}>
                                <span>{t.name}</span>
                                <span style={{fontSize:'0.68rem',color:'#888'}}>{t.description}</span>
                            </EfButton>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* === TAB: CLUB === */}
            {tab === 'club' && (
                <>
                    {/* Stadium + Progress */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'#888'}}>🏟️ {stadiumInfo.name}</h4>
                                <span style={{fontSize:'0.72rem',color:'#888'}}>Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem', border: '2px solid #000'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.stadiumLevel / 5) * 100}%`}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'#888'}}>Nível {engine.stadiumLevel}/5</span>
                            </div>
                            {engine.stadiumLevel < 5 && (
                                <EfButton variant="primary" size="sm" onClick={() => {
                                    const result = engine.upgradeStadium();
                                    setLog(result.msg);
                                    forceUpdate();
                                }}>Upgrade</EfButton>
                            )}
                        </div>
                    </EfPanel>

                    {/* Staff */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>👥 STAFF ({STAFF_ROLES.filter(r => engine.staff?.getStaff(r.id)).length}/{STAFF_ROLES.length})</h4>
                        {STAFF_ROLES.map(role => {
                            const member = engine.staff?.getStaff(role.id);
                            return (
                                <div key={role.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.2rem 0',fontSize:'0.78rem',borderBottom:'2px solid #111'}}>
                                    <span>{role.emoji} {role.name}: {member ? <strong style={{color:'#39FF14'}}>{member.name}</strong> : <span style={{color:'#888'}}>Vago</span>}</span>
                                    {!member && (
                                        <EfButton variant="secondary" size="sm" onClick={() => {
                                            const result = engine.hireStaff(role.id);
                                            setLog(result.msg || 'Staff contratado!');
                                            forceUpdate();
                                        }}>Contratar</EfButton>
                                    )}
                                </div>
                            );
                        })}
                    </EfPanel>

                    {/* Youth Academy + Progress */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'#888'}}>🎓 BASE Nv.{engine.academyLevel}</h4>
                                <span style={{fontSize:'0.72rem',color:'#888'}}>Produz {engine.academyLevel + 1} jovens/temporada</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem', border: '2px solid #000'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.academyLevel / 5) * 100}%`,backgroundColor:'#FFD700'}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'#888'}}>Nível {engine.academyLevel}/5</span>
                            </div>
                            {engine.academyLevel < 5 && (
                                <EfButton variant="primary" size="sm" onClick={() => {
                                    const result = engine.upgradeAcademy();
                                    setLog(result.msg);
                                    forceUpdate();
                                }}>Upgrade (R$ {(getAcademyUpgradeCost(engine.academyLevel)/1000000).toFixed(1)}M)</EfButton>
                            )}
                        </div>
                    </EfPanel>

                    {/* Scouting */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>🔎 SCOUTING</h4>
                        <div className="action-bar">
                            {SCOUT_REGIONS.map(r => (
                                <EfButton key={r.id} variant="secondary" size="sm" onClick={() => {
                                    const result = engine.scoutRegionAction(r.id);
                                    setLog(result.msg || `Scout encontrou ${result.players?.length || 0} jogadores!`);
                                    forceUpdate();
                                }}>
                                    {r.emoji} {r.name} (R$ {(r.cost/1000).toFixed(0)}K)
                                </EfButton>
                            ))}
                        </div>
                        {engine.scoutedPlayers?.length > 0 && (
                            <div style={{marginTop:'0.4rem'}}>
                                {engine.scoutedPlayers.map((p, i) => (
                                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',padding:'0.2rem 0',borderBottom:'2px solid #111'}}>
                                        <span>{p.name} ({p.position}, {p.age}a, OVR {p.ovr})</span>
                                        <EfButton variant="primary" size="sm" onClick={() => {
                                            const result = engine.signScoutedPlayer(i);
                                            setLog(result?.msg || 'Contratado!');
                                            forceUpdate();
                                        }}>Contratar</EfButton>
                                    </div>
                                ))}
                            </div>
                        )}
                    </EfPanel>

                    {/* Board */}
                    {engine.board && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>🏛️ DIRETORIA</h4>
                            <ul className="stats-list">
                                <li><span>Confiança:</span><strong style={{color: boardStatus?.color}}>{engine.board.confidence}%</strong></li>
                                <li><span>Status:</span><strong style={{color: boardStatus?.color}}>{boardStatus?.label}</strong></li>
                            </ul>
                            {engine.legacy && (engine.legacy.history?.length ?? 0) > 0 && (
                                <div style={{marginTop:'0.4rem',borderTop:'2px solid #111',paddingTop:'0.3rem'}}>
                                    <span style={{fontSize:'0.7rem',color:'#888'}}>Histórico:</span>
                                    {engine.legacy.history.map((h, i) => (
                                        <div key={i} style={{fontSize:'0.7rem',color:'#888',padding:'0.1rem 0'}}>
                                            T{h.season}: {h.team} ({h.position}º) — {h.record}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </EfPanel>
                    )}
                </>
            )}

            {/* === TAB: TRANSFERS === */}
            {tab === 'transfers' && (engine.transferOffers?.length ?? 0) > 0 && (
                <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#1E2124', border: '2px solid #111', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.3rem'}}>📬 OFERTAS</h4>
                    {engine.transferOffers.map((offer, i) => (
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem 0',borderBottom:'2px solid #111'}}>
                            <div style={{fontSize:'0.78rem'}}>
                                <strong>{offer.playerName}</strong> (OVR {offer.playerOvr})
                                <div style={{fontSize:'0.68rem',color:'#888'}}>{offer.buyerClub} • R$ {(offer.offerAmount / 1000000).toFixed(1)}M</div>
                            </div>
                            <div style={{display:'flex',gap:'0.25rem'}}>
                                <EfButton variant="primary" size="sm" onClick={() => handleAcceptOffer(offer.playerId)}>✓</EfButton>
                                <EfButton variant="danger" size="sm" onClick={() => handleRejectOffer(offer.playerId)}>✗</EfButton>
                            </div>
                        </div>
                    ))}
                </EfPanel>
            )}

            {/* Press Conference Modal */}
            {engine.pressQuestion && (
                <EfModal title="🎙️ Coletiva de Imprensa" onClose={() => {}}>
                    <p style={{marginBottom: '1rem'}}>{engine.pressQuestion.text}</p>
                    <div className="modal-options">
                        {engine.pressQuestion.options.map(opt => (
                            <EfButton key={opt.id} variant="secondary" onClick={() => {
                                const result = engine.answerPress(opt.id);
                                if (result) setLog(`Coletiva: ${result.answer}`);
                                forceUpdate();
                            }} style={{textAlign:'left',fontSize:'0.8rem', width: '100%', marginBottom: '0.5rem', justifyContent: 'flex-start'}}>
                                {opt.text}
                            </EfButton>
                        ))}
                    </div>
                </EfModal>
            )}

            {/* Bottom Nav — 16-bit */}
            <div style={{display:'flex',gap:'4px',marginTop:'12px'}}>
                {[{view:'squad',icon:'👥',label:'PLANTEL'},{view:'market',icon:'🛒',label:'MERCADO'},{view:'standings',icon:'📊',label:'TABELA'}].map(n => (
                    <div key={n.view} onClick={() => changeView(n.view)} style={{
                        flex:1,background:'#111',border:'4px solid',borderColor:'#333 #000 #000 #333',
                        padding:'10px',textAlign:'center',cursor:'pointer',
                        fontFamily:"'Press Start 2P', monospace",fontSize:'0.5rem',color:'#888'
                    }}
                    onMouseEnter={(e) => {e.currentTarget.style.borderColor='#4A5059 #111417 #111417 #4A5059';e.currentTarget.style.color='#FFF';}}
                    onMouseLeave={(e) => {e.currentTarget.style.borderColor='#333 #000 #000 #333';e.currentTarget.style.color='#888';}}
                    >{n.icon} {n.label}</div>
                ))}
            </div>

            {/* Status Footer — Arcade bar */}
            <div style={{background:'#111417',border:'4px solid',borderColor:'#4A5059 #111417 #111417 #4A5059',padding:'10px 12px',display:'flex',justifyContent:'space-between',marginTop:'8px'}}>
                <div style={{display:'flex',gap:'20px',flexWrap:'wrap'}}>
                    <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color:'#888'}}><span style={{color:'#FFD700'}}>LIGA:</span> SÉRIE {['A','B','C','D'][team.division - 1]}</span>
                    <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color:'#888'}}><span style={{color:'#FFD700'}}>RODADA:</span> {seasonWeek}/38</span>
                    <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.45rem',color:'#888'}}><span style={{color:'#FFD700'}}>TEMP:</span> {engine.seasonNumber}</span>
                </div>
                <span style={{fontFamily:"'Press Start 2P', monospace",fontSize:'0.4rem',color:'#555'}}>OLÉ FUT 2.0 SNES</span>
            </div>

            {/* §17: Step-by-step tutorial */}
            <TutorialOverlay visible={showTutorial} onDismiss={() => setShowTutorial(false)} />
            </div>
        </div>
    );
}
