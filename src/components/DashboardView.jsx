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
            color: 'var(--ef-color-neutral-text-hi)',
            backgroundColor: '#0A130E' // Fallback solid background
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* §16.2: Trophy ceremony overlay */}
            <TrophyCeremony
                trophy={engine.trophyCeremony?.trophy}
                season={engine.trophyCeremony?.season}
                visible={!!engine.trophyCeremony}
                onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }}
            />
            {/* === COMPACT HEADER === */}
            <EfPanel variant="elev" padding="md" style={{ backgroundColor: 'var(--ef-bevel-dark)', border: '2px solid var(--ef-bevel-light)' }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                        <h2 style={{fontSize:'1.2rem',margin:0}}>{team.name}</h2>
                        <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>
                            {pos}º • Série {['A','B','C','D'][team.division - 1]} • {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'1.1rem',fontWeight:700,color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)'}}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        {boardStatus && <div style={{fontSize:'0.65rem',color: boardStatus.color}} title={`Diretoria: ${boardStatus.label} (${engine.board?.confidence ?? 60}%). Demissão se < 10%.`}>{boardStatus.emoji} {boardStatus.label}</div>}
                    </div>
                </div>
                {/* Season progress */}
                <div className="progress-bar" style={{marginTop:'0.4rem', border: '2px solid #000', backgroundColor: '#333'}}>
                    <div className="progress-bar-fill" style={{width: `${(seasonWeek / 38) * 100}%`, backgroundColor: 'var(--primary)'}}></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.65rem',color:'var(--text-muted)'}}>
                    <span>Temp {engine.seasonNumber} • Semana {seasonWeek}/38</span>
                    {legacyLevel && <span>{legacyLevel.emoji} {legacyLevel.label}</span>}
                </div>
            </EfPanel>

            {/* === ALERTS === */}
            {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                <div className="alert-strip">
                    {injured.length > 0 && <span className="alert-badge danger">🏥 {injured.length} lesionado{injured.length > 1 ? 's' : ''}</span>}
                    {expiringContracts.length > 0 && <span className="alert-badge warning">📋 {expiringContracts.length} contrato{expiringContracts.length > 1 ? 's' : ''} vencendo</span>}
                    {avgEnergy < 50 && <span className="alert-badge danger">⚡ Elenco cansado ({avgEnergy.toFixed(0)}%)</span>}
                    {(engine.transferOffers?.length ?? 0) > 0 && <span className="alert-badge info" style={{cursor:'pointer'}} onClick={() => setTab('transfers')}>📬 {(engine.transferOffers?.length ?? 0)} oferta{(engine.transferOffers?.length ?? 0) > 1 ? 's' : ''}</span>}
                </div>
            )}

            {/* === NEXT MATCH CTA === */}
            <EfPanel variant="sunk" padding="md" style={{ backgroundColor: '#0B2015', border: '2px solid #000' }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                    <div>
                        <span style={{fontSize:'0.7rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Próximo Jogo</span>
                        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginTop:'0.15rem'}}>
                            <span style={{fontWeight:600,fontSize:'0.85rem'}}>{team.formation}</span>
                            <span style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>•</span>
                            <span style={{fontSize:'0.85rem',color:'var(--primary)'}}>{TACTICS[engine.currentTactic]?.name}</span>
                        </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                        {cond && <div className="alert-badge info">{cond.name}</div>}
                    </div>
                </div>
                <div className="inline-stats" style={{marginBottom:'0.5rem'}}>
                    <Help id="sector.gol"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}><AnimatedStat value={sectors.goalkeeper} /></span><span className="stat-label">GOL</span></div></Help>
                    <Help id="sector.def"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}><AnimatedStat value={sectors.defense} /></span><span className="stat-label">DEF</span></div></Help>
                    <Help id="sector.mei"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}><AnimatedStat value={sectors.midfield} /></span><span className="stat-label">MEI</span></div></Help>
                    <Help id="sector.ata"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}><AnimatedStat value={sectors.attack} /></span><span className="stat-label">ATA</span></div></Help>
                    <div className="inline-stat" title="Moral média do plantel (>60 bom, <40 crítico)"><span className="stat-value" style={{fontSize:'0.9rem',color: avgMoral > 60 ? 'var(--primary)' : avgMoral < 40 ? 'var(--danger)' : 'var(--accent)'}}><AnimatedStat value={Math.round(avgMoral)} suffix="%" /></span><span className="stat-label">MORAL</span></div>
                    <div className="inline-stat" title="Energia média (<50 risco lesão)"><span className="stat-value" style={{fontSize:'0.9rem',color: avgEnergy < 50 ? 'var(--danger)' : 'var(--primary)'}}><AnimatedStat value={Math.round(avgEnergy)} suffix="%" /></span><span className="stat-label">ENERGIA</span></div>
                </div>
                <EfButton variant="primary" size="lg" style={{width: '100%', justifyContent: 'center', marginTop: '12px'}} onClick={() => {
                    engine.checkPressConference();
                    if (!engine.pressQuestion) changeView('match');
                    else forceUpdate();
                }}>⚽ JOGAR PARTIDA</EfButton>
            </EfPanel>

            {/* === TABS === */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                <EfButton variant={tab === 'overview' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('overview')} style={{justifyContent: 'center'}}>VISÃO GERAL</EfButton>
                <EfButton variant={tab === 'tactics' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('tactics')} style={{justifyContent: 'center'}}>TÁTICAS</EfButton>
                <EfButton variant={tab === 'training' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('training')} style={{justifyContent: 'center'}}>TREINO</EfButton>
                <EfButton variant={tab === 'club' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('club')} style={{justifyContent: 'center'}}>CLUBE</EfButton>
                {(engine.transferOffers?.length ?? 0) > 0 && <EfButton variant={tab === 'transfers' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('transfers')} style={{justifyContent: 'center'}}>OFERTAS</EfButton>}
            </div>

            {/* Feedback log */}
            {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

            {/* === TAB: OVERVIEW === */}
            {tab === 'overview' && (
                <>
                    {/* Onboarding hints */}
                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#0F2942', border: '2px solid #3B82F6', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--info)',marginBottom:'0.3rem'}}>💡 PLAYBOOK DO TREINADOR</h4>
                            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',lineHeight:1.6}}>
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
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>🏆 PRÊMIOS DA TEMPORADA</h4>
                            {engine.seasonAwards.map((a, i) => (
                                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',padding:'0.2rem 0',borderBottom:'2px solid #111'}}>
                                    <span>{a.emoji} {a.name}</span>
                                    <strong style={{color:'var(--accent)'}}>{a.player} ({a.value})</strong>
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
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🏛️ TENSÃO DA DIRETORIA</h4>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.78rem'}}>
                                <span>
                                    {engine.boardTension >= 40 ? '🟢 Estável' :
                                     engine.boardTension >= 0 ? '🟡 Atenção' :
                                     engine.boardTension >= -40 ? '🟠 Pressão' : '🔴 Crise'}
                                </span>
                                <strong style={{color: engine.boardTension >= 0 ? 'var(--primary)' : 'var(--danger)'}}>
                                    {engine.boardTension > 0 ? '+' : ''}{engine.boardTension}
                                </strong>
                            </div>
                            <div style={{height:'6px',background:'#000',border:'1px solid #444',overflow:'hidden',marginTop:'0.3rem'}}>
                                <div style={{
                                    width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%`,
                                    height:'100%',
                                    background: engine.boardTension >= 0 ? 'var(--primary)' : 'var(--danger)',
                                }} />
                            </div>
                        </EfPanel>
                    )}

                    {/* AKITA-142: Loss Streak Warning */}
                    {stats.lossStreak >= 3 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3A1010', border: '2px solid #EF4444', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--danger)',marginBottom:'0.3rem'}}>🔥 CRISE DE RESULTADOS</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:0}}>
                                {stats.lossStreak} derrotas seguidas — moral do elenco abalada!
                            </p>
                        </EfPanel>
                    )}

                    {/* DDA & Rolling Form */}
                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📊 FORMA RECENTE & DDA</h4>
                            <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.4rem'}}>
                                {stats.rollingForm.map((r, i) => (
                                    <span key={i} style={{
                                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                                        width:'1.5rem', height:'1.5rem', border: '2px solid #000', fontSize:'0.7rem', fontWeight:600,
                                        backgroundColor: r === 'W' ? '#0B2015' : r === 'D' ? '#3D280B' : '#3A1010',
                                        color: r === 'W' ? 'var(--primary)' : r === 'D' ? 'var(--accent)' : 'var(--danger)'
                                    }}>{r}</span>
                                ))}
                            </div>
                            {(() => {
                                if (stats.rollingForm.length >= 5) {
                                    const wins = stats.rollingForm.filter(r => r === 'W').length;
                                    const winRate = wins / stats.rollingForm.length;
                                    if (winRate > 0.8) return <span style={{fontSize:'0.7rem',color:'var(--danger)'}}>⚠️ DDA Ativo: Oponentes com Boost (+15%)</span>;
                                    if (winRate <= 0.2) return <span style={{fontSize:'0.7rem',color:'var(--primary)'}}>⚖️ DDA Ativo: Oponentes com Debuff (-15%)</span>;
                                    return <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>DDA: Flow Channel (Balanceado)</span>;
                                }
                                return <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>DDA: Calibrando (mín. 5 jogos)</span>;
                            })()}
                        </EfPanel>
                    )}

                    {/* AKITA-142: Coach Proposal */}
                    {engine.pendingCoachProposal && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#0F2942', border: '2px solid #3B82F6', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--info)',marginBottom:'0.3rem'}}>📨 PROPOSTA DE EMPREGO</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:'0 0 0.3rem'}}>
                                <strong>{engine.pendingCoachProposal.fromClubName}</strong> quer contratá-lo!
                                <br/><span style={{fontSize:'0.72rem'}}>{engine.pendingCoachProposal.reason}</span>
                            </p>
                        </EfPanel>
                    )}

                    {/* AKITA-142: Active Challenge */}
                    {engine.activeChallenge && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#270F3A', border: '2px solid #A855F7', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#A855F7',marginBottom:'0.3rem'}}>🎯 DESAFIO ATIVO</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:0}}>
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
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>⭐ HALL DE LENDAS ({engine.hallOfLegends.filledCount}/{engine.hallOfLegends.slots?.length || 6})</h4>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                {(engine.hallOfLegends.slots || []).filter(s => s.filled).map((s, i) => (
                                    <span key={i} style={{fontSize:'0.72rem',padding:'0.15rem 0.4rem',border:'2px solid #000',backgroundColor:'#4A320E',color:'var(--accent)'}}>
                                        {s.playerName || `Lenda #${i+1}`}
                                    </span>
                                ))}
                            </div>
                        </EfPanel>
                    )}

                    {(engine.weekEvents?.length ?? 0) > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📰 EVENTOS DA SEMANA</h4>
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

                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>💰 FINANÇAS</h4>
                        {engine.weeklyFinance ? (
                            <ul className="stats-list">
                                {engine.weeklyFinance.details.map((d, i) => (
                                    <li key={i}>
                                        <span>{d.label}</span>
                                        <strong style={{color: d.type === 'income' ? 'var(--primary)' : 'var(--danger)'}}>
                                            {d.type === 'income' ? '+' : '-'}R$ {(d.amount / 1000).toFixed(0)}K
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        ) : <p style={{color:'var(--text-muted)',fontSize:'0.78rem'}}>Jogue a próxima partida para ver o relatório.</p>}
                    </EfPanel>

                    {/* Loan System */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🏦 EMPRÉSTIMO</h4>
                        {engine.activeLoan ? (
                            <div>
                                <ul className="stats-list">
                                    <li><span>Principal</span><strong>R$ {(engine.activeLoan.principal / 1_000_000).toFixed(1)}M</strong></li>
                                    <li><span>Juros</span><strong>{(engine.activeLoan.interestRate * 100).toFixed(0)}%</strong></li>
                                    <li><span>Parcela semanal</span><strong style={{color:'var(--danger)'}}>R$ {(engine.activeLoan.weeklyPayment / 1000).toFixed(0)}K</strong></li>
                                    <li><span>Semanas restantes</span><strong>{engine.activeLoan.weeksRemaining}</strong></li>
                                    <li><span>Total restante</span><strong style={{color:'var(--danger)'}}>R$ {(engine.activeLoan.totalOwed / 1_000_000).toFixed(1)}M</strong></li>
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
                            if (!loanOpts.available) return <p style={{color:'var(--text-muted)',fontSize:'0.72rem'}}>{loanOpts.reason || 'Indisponível'}</p>;
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
                            <h4 style={{fontSize:'0.8rem',color:'var(--danger)',marginBottom:'0.3rem'}}>🏥 D.M. ({injured.length})</h4>
                            <ul className="stats-list">
                                {injured.map((p, i) => (
                                    <li key={i}><span>{p.injury.emoji} {p.name} — {p.injury.name}</span><strong style={{color:'var(--danger)'}}>{p.injury.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </EfPanel>
                    )}

                    {expiringContracts.length > 0 && (
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: '#3D280B', border: '2px solid #F59E0B', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>📋 CONTRATOS VENCENDO</h4>
                            <ul className="stats-list">
                                {expiringContracts.map((p, i) => (
                                    <li key={i}><span>{p.name} (OVR {p.ovr})</span><strong style={{color: p.contract.weeksLeft <= 4 ? 'var(--danger)' : 'var(--accent)'}}>{p.contract.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </EfPanel>
                    )}
                </>
            )}

            {/* === TAB: TACTICS === */}
            {tab === 'tactics' && (
                <EfPanel variant="elev" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid var(--ef-bevel-light)', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>FORMAÇÃO</h4>
                    <div className="action-bar">
                        {Object.keys(FORMATIONS).map(f => (
                            <EfButton key={f} variant={team.formation === f ? 'primary' : 'secondary'} size="sm"
                                onClick={() => { engine.setFormation(f); forceUpdate(); }}>
                                {f}
                            </EfButton>
                        ))}
                    </div>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'0.75rem 0 0.4rem'}}>TÁTICA</h4>
                    <div className="action-bar">
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <EfButton key={k} variant={engine.currentTactic === k ? 'primary' : 'secondary'} size="sm"
                                onClick={() => { engine.setTactic(k); forceUpdate(); }}>
                                {v.name}
                            </EfButton>
                        ))}
                    </div>
                    <p style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:'0.4rem'}}>{TACTICS[engine.currentTactic]?.description}</p>

                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'0.75rem 0 0.4rem'}}>📢 PRELEÇÃO</h4>
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
                <EfPanel variant="elev" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid var(--ef-bevel-light)', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>TREINO SEMANAL</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        {TRAINING_TYPES.map(t => (
                            <EfButton key={t.id} variant={engine.currentTraining === t.id ? 'primary' : 'secondary'}
                                style={{justifyContent:'space-between',fontSize:'0.8rem'}}
                                onClick={() => handleTrain(t.id)}>
                                <span>{t.name}</span>
                                <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{t.description}</span>
                            </EfButton>
                        ))}
                    </div>
                </EfPanel>
            )}

            {/* === TAB: CLUB === */}
            {tab === 'club' && (
                <>
                    {/* Stadium + Progress */}
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>🏟️ {stadiumInfo.name}</h4>
                                <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem', border: '2px solid #000'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.stadiumLevel / 5) * 100}%`}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>Nível {engine.stadiumLevel}/5</span>
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
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>👥 STAFF ({STAFF_ROLES.filter(r => engine.staff?.getStaff(r.id)).length}/{STAFF_ROLES.length})</h4>
                        {STAFF_ROLES.map(role => {
                            const member = engine.staff?.getStaff(role.id);
                            return (
                                <div key={role.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.2rem 0',fontSize:'0.78rem',borderBottom:'2px solid #111'}}>
                                    <span>{role.emoji} {role.name}: {member ? <strong style={{color:'var(--primary)'}}>{member.name}</strong> : <span style={{color:'var(--text-muted)'}}>Vago</span>}</span>
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
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>🎓 BASE Nv.{engine.academyLevel}</h4>
                                <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Produz {engine.academyLevel + 1} jovens/temporada</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem', border: '2px solid #000'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.academyLevel / 5) * 100}%`,backgroundColor:'var(--accent)'}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>Nível {engine.academyLevel}/5</span>
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
                    <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🔎 SCOUTING</h4>
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
                        <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🏛️ DIRETORIA</h4>
                            <ul className="stats-list">
                                <li><span>Confiança:</span><strong style={{color: boardStatus?.color}}>{engine.board.confidence}%</strong></li>
                                <li><span>Status:</span><strong style={{color: boardStatus?.color}}>{boardStatus?.label}</strong></li>
                            </ul>
                            {engine.legacy && (engine.legacy.history?.length ?? 0) > 0 && (
                                <div style={{marginTop:'0.4rem',borderTop:'2px solid #111',paddingTop:'0.3rem'}}>
                                    <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Histórico:</span>
                                    {engine.legacy.history.map((h, i) => (
                                        <div key={i} style={{fontSize:'0.7rem',color:'var(--text-muted)',padding:'0.1rem 0'}}>
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
                <EfPanel variant="sunk" padding="sm" style={{backgroundColor: 'var(--bg-panel-solid)', border: '2px solid #111', marginBottom: '0.5rem'}}>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📬 OFERTAS</h4>
                    {engine.transferOffers.map((offer, i) => (
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem 0',borderBottom:'2px solid #111'}}>
                            <div style={{fontSize:'0.78rem'}}>
                                <strong>{offer.playerName}</strong> (OVR {offer.playerOvr})
                                <div style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{offer.buyerClub} • R$ {(offer.offerAmount / 1000000).toFixed(1)}M</div>
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

            {/* Bottom Nav */}
            <div className="action-bar" style={{marginTop:'0.5rem'}}>
                <EfButton variant="secondary" onClick={() => changeView('squad')}>👥 Plantel</EfButton>
                <EfButton variant="secondary" onClick={() => changeView('market')}>🛒 Mercado</EfButton>
                <EfButton variant="secondary" onClick={() => changeView('standings')}>📊 Tabela</EfButton>
            </div>

            {/* Status Footer */}
            <div className="status-footer" style={{ marginTop: 'auto', backgroundColor: '#0A130E', padding: '12px', borderTop: '4px solid #1A2E22' }}>
                <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap', fontSize: '10px', color: 'var(--ef-color-neutral-text-muted)', letterSpacing: '0.1em'}}>
                    <span><span style={{color: 'var(--ef-color-neutral-text-hi)'}}>LIGA:</span> SÉRIE {['A','B','C','D'][team.division - 1]}</span>
                    <span><span style={{color: 'var(--ef-color-neutral-text-hi)'}}>RODADA:</span> {seasonWeek}/38</span>
                    <span><span style={{color: 'var(--ef-color-neutral-text-hi)'}}>TEMP:</span> {engine.seasonNumber}</span>
                </div>
            </div>

            {/* §17: Step-by-step tutorial */}
            <TutorialOverlay visible={showTutorial} onDismiss={() => setShowTutorial(false)} />
            </div>
        </div>
    );
}
