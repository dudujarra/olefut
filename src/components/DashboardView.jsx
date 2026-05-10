import React, { useState } from 'react';
import { AnimatedStat } from '../hooks/useCountUp';
import { Help } from './Help';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';

import { STAFF_ROLES, SCOUT_REGIONS, getStadiumInfo } from '../engine/StadiumSystem';
import { getAcademyUpgradeCost } from '../engine/YouthAcademy';
import { ChallengesWidget } from './ChallengesWidget';
import { getAllAchievements } from '../engine/MetaProgression';
import TrophyCeremony from './TrophyCeremony';
import '../styles/trophy-ceremony.css';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    // BUG-021: all hooks declared before early return
    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview');
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
        <div className="main-content fade-in">
            {/* §16.2: Trophy ceremony overlay */}
            <TrophyCeremony
                trophy={engine.trophyCeremony?.trophy}
                season={engine.trophyCeremony?.season}
                visible={!!engine.trophyCeremony}
                onDismiss={() => { engine.trophyCeremony = null; forceUpdate(); }}
            />
            {/* === COMPACT HEADER === */}
            <div className="card" style={{padding:'0.75rem 1rem'}}>
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
                <div className="progress-bar" style={{marginTop:'0.4rem'}}>
                    <div className="progress-bar-fill" style={{width: `${(seasonWeek / 38) * 100}%`}}></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.65rem',color:'var(--text-muted)'}}>
                    <span>Temp {engine.seasonNumber} • Semana {seasonWeek}/38</span>
                    {legacyLevel && <span>{legacyLevel.emoji} {legacyLevel.label}</span>}
                </div>
            </div>

            {/* === ALERTS === */}
            {(injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || (engine.transferOffers?.length ?? 0) > 0) && (
                <div className="alert-strip">
                    {injured.length > 0 && <span className="alert-badge danger">🏥 {injured.length} lesionado{injured.length > 1 ? 's' : ''}</span>}
                    {expiringContracts.length > 0 && <span className="alert-badge warning">📋 {expiringContracts.length} contrato{expiringContracts.length > 1 ? 's' : ''} vencendo</span>}
                    {avgEnergy < 50 && <span className="alert-badge danger">⚡ Elenco cansado ({avgEnergy.toFixed(0)}%)</span>}
                    {(engine.transferOffers?.length ?? 0) > 0 && <span className="alert-badge info" style={{cursor:'pointer'}} onClick={() => setTab('transfers')}>📬 {(engine.transferOffers?.length ?? 0)} oferta{(engine.transferOffers?.length ?? 0) > 1 ? 's' : ''}</span>}
                </div>
            )}

            {/* === NEXT MATCH CTA (Stitch scoreboard-card style) === */}
            <div className="card scoreboard-card next-match-card" style={{padding:'0.75rem 1rem',background:'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(16,185,129,0.05))'}}>
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
                <button className="btn-cta" onClick={() => {
                    engine.checkPressConference();
                    if (!engine.pressQuestion) changeView('match');
                    else forceUpdate();
                }}>⚽ JOGAR PARTIDA</button>
            </div>

            {/* === TABS === */}
            <div className="nav-tabs">
                <button className={`nav-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Visão Geral</button>
                <button className={`nav-tab ${tab === 'tactics' ? 'active' : ''}`} onClick={() => setTab('tactics')}>Táticas</button>
                <button className={`nav-tab ${tab === 'training' ? 'active' : ''}`} onClick={() => setTab('training')}>Treino</button>
                <button className={`nav-tab ${tab === 'club' ? 'active' : ''}`} onClick={() => setTab('club')}>Clube</button>
                {(engine.transferOffers?.length ?? 0) > 0 && <button className={`nav-tab ${tab === 'transfers' ? 'active' : ''}`} onClick={() => setTab('transfers')}>Ofertas</button>}
            </div>

            {/* Feedback log */}
            {log && <div className="event-toast success" onClick={() => setLog('')}>{log}</div>}

            {/* === TAB: OVERVIEW === */}
            {tab === 'overview' && (
                <>
                    {/* Onboarding hints — Stitch playbook quote style */}
                    {seasonWeek <= 2 && engine.seasonNumber === 1 && (
                        <div className="card card-compact quote-card" style={{background:'rgba(59,130,246,0.08)',borderColor:'rgba(59,130,246,0.2)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--info)',marginBottom:'0.3rem'}}>💡 PLAYBOOK DO TREINADOR</h4>
                            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',lineHeight:1.6}}>
                                <p>1️⃣ <strong>Táticas:</strong> escolha formação e tática antes de jogar</p>
                                <p>2️⃣ <strong>Treino:</strong> treine o plantel toda semana para melhorar atributos</p>
                                <p>3️⃣ <strong>Plantel:</strong> escale seus melhores 11 e monitore energia</p>
                                <p>4️⃣ <strong>Clube:</strong> upgrade estádio e base para crescer</p>
                                <p>5️⃣ <strong>Jogo:</strong> no intervalo, ajuste tática e faça substituições</p>
                            </div>
                        </div>
                    )}

                    {/* Season Awards (if any) */}
                    {engine.seasonAwards && engine.seasonAwards.length > 0 && (
                        <div className="card card-compact" style={{background:'rgba(245,158,11,0.08)',borderColor:'rgba(245,158,11,0.2)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>🏆 PRÊMIOS DA TEMPORADA</h4>
                            {engine.seasonAwards.map((a, i) => (
                                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',padding:'0.2rem 0',borderBottom:'1px solid var(--border-subtle)'}}>
                                    <span>{a.emoji} {a.name}</span>
                                    <strong style={{color:'var(--accent)'}}>{a.player} ({a.value})</strong>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AKITA-142: Board Tension Widget */}
                    {typeof engine.boardTension === 'number' && (
                        <div className="card card-compact" style={{
                            background: engine.boardTension < -20 ? 'rgba(239,68,68,0.08)' : engine.boardTension > 40 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                            borderColor: engine.boardTension < -20 ? 'rgba(239,68,68,0.2)' : engine.boardTension > 40 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
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
                            <div style={{height:'6px',background:'var(--bg-panel-solid)',borderRadius:'3px',overflow:'hidden',marginTop:'0.3rem'}}>
                                <div style={{
                                    width: `${Math.max(0, Math.min(100, (engine.boardTension + 100) / 2))}%`,
                                    height:'100%',
                                    background: engine.boardTension >= 0 ? 'var(--primary)' : 'var(--danger)',
                                    transition:'width 0.3s'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* AKITA-142: Loss Streak Warning */}
                    {stats.lossStreak >= 3 && (
                        <div className="card card-compact" style={{background:'rgba(239,68,68,0.12)',borderColor:'rgba(239,68,68,0.3)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--danger)',marginBottom:'0.3rem'}}>🔥 CRISE DE RESULTADOS</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:0}}>
                                {stats.lossStreak} derrotas seguidas — moral do elenco abalada!
                            </p>
                        </div>
                    )}

                    {/* DDA & Rolling Form */}
                    {stats.rollingForm && stats.rollingForm.length > 0 && (
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📊 FORMA RECENTE & DDA</h4>
                            <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.4rem'}}>
                                {stats.rollingForm.map((r, i) => (
                                    <span key={i} style={{
                                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                                        width:'1.5rem', height:'1.5rem', borderRadius:'3px', fontSize:'0.7rem', fontWeight:600,
                                        background: r === 'W' ? 'rgba(16,185,129,0.2)' : r === 'D' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
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
                        </div>
                    )}

                    {/* AKITA-142: Coach Proposal */}
                    {engine.pendingCoachProposal && (
                        <div className="card card-compact" style={{background:'rgba(59,130,246,0.08)',borderColor:'rgba(59,130,246,0.2)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--info)',marginBottom:'0.3rem'}}>📨 PROPOSTA DE EMPREGO</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:'0 0 0.3rem'}}>
                                <strong>{engine.pendingCoachProposal.fromClubName}</strong> quer contratá-lo!
                                <br/><span style={{fontSize:'0.72rem'}}>{engine.pendingCoachProposal.reason}</span>
                            </p>
                        </div>
                    )}

                    {/* AKITA-142: Active Challenge */}
                    {engine.activeChallenge && (
                        <div className="card card-compact" style={{background:'rgba(168,85,247,0.08)',borderColor:'rgba(168,85,247,0.2)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'#A855F7',marginBottom:'0.3rem'}}>🎯 DESAFIO ATIVO</h4>
                            <p style={{fontSize:'0.78rem',color:'var(--text-muted)',margin:0}}>
                                {engine.activeChallenge.description}
                            </p>
                        </div>
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
                                <div className="card card-compact" style={{background:'rgba(123,44,191,0.06)',borderColor:'rgba(123,44,191,0.15)'}}>
                                    <h4 style={{fontSize:'0.8rem',color:'#A855F7',marginBottom:'0.3rem'}}>
                                        🏅 CONQUISTAS DE CARREIRA ({unlocked.length}/{metaAchs.length})
                                    </h4>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                        {unlocked.map(a => (
                                            <span key={a.id} style={{fontSize:'0.72rem',padding:'0.15rem 0.4rem',borderRadius:'3px',background:'rgba(123,44,191,0.12)',color:'#A855F7'}} title={a.description}>
                                                {a.emoji} {a.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        } catch { return null; }
                    })()}

                    {/* AKITA-142: Hall of Legends (compact) */}
                    {engine.hallOfLegends && engine.hallOfLegends.filledCount > 0 && (
                        <div className="card card-compact" style={{background:'rgba(245,158,11,0.05)',borderColor:'rgba(245,158,11,0.15)'}}>
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>⭐ HALL DE LENDAS ({engine.hallOfLegends.filledCount}/{engine.hallOfLegends.slots?.length || 6})</h4>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                                {(engine.hallOfLegends.slots || []).filter(s => s.filled).map((s, i) => (
                                    <span key={i} style={{fontSize:'0.72rem',padding:'0.15rem 0.4rem',borderRadius:'3px',background:'rgba(245,158,11,0.12)',color:'var(--accent)'}}>
                                        {s.playerName || `Lenda #${i+1}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(engine.weekEvents?.length ?? 0) > 0 && (
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📰 EVENTOS DA SEMANA</h4>
                            <div className="event-feed">
                                {(engine.weekEvents || []).map((ev, i) => {
                                    const isGood = ev.includes('📈') || ev.includes('🎉') || ev.includes('📚') || ev.includes('🇧🇷') || ev.includes('🎂');
                                    const isBad = ev.includes('📉') || ev.includes('☠️') || ev.includes('👴') || ev.includes('🕺') || ev.includes('🥊');
                                    return <div key={i} className={`event-item ${isGood ? 'highlight' : ''} ${isBad ? 'danger' : ''}`}>{ev}</div>;
                                })}
                            </div>
                        </div>
                    )}

                    <div className="card card-compact">
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
                    </div>

                    {injured.length > 0 && (
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--danger)',marginBottom:'0.3rem'}}>🏥 D.M. ({injured.length})</h4>
                            <ul className="stats-list">
                                {injured.map((p, i) => (
                                    <li key={i}><span>{p.injury.emoji} {p.name} — {p.injury.name}</span><strong style={{color:'var(--danger)'}}>{p.injury.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {expiringContracts.length > 0 && (
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--accent)',marginBottom:'0.3rem'}}>📋 CONTRATOS VENCENDO</h4>
                            <ul className="stats-list">
                                {expiringContracts.map((p, i) => (
                                    <li key={i}><span>{p.name} (OVR {p.ovr})</span><strong style={{color: p.contract.weeksLeft <= 4 ? 'var(--danger)' : 'var(--accent)'}}>{p.contract.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {/* === TAB: TACTICS === */}
            {tab === 'tactics' && (
                <div className="card card-compact">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>FORMAÇÃO</h4>
                    <div className="action-bar">
                        {Object.keys(FORMATIONS).map(f => (
                            <button key={f} className={`btn btn-sm ${team.formation === f ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { engine.setFormation(f); forceUpdate(); }}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'0.75rem 0 0.4rem'}}>TÁTICA</h4>
                    <div className="action-bar">
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <button key={k} className={`btn btn-sm ${engine.currentTactic === k ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { engine.setTactic(k); forceUpdate(); }}>
                                {v.name}
                            </button>
                        ))}
                    </div>
                    <p style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:'0.4rem'}}>{TACTICS[engine.currentTactic]?.description}</p>

                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',margin:'0.75rem 0 0.4rem'}}>📢 PRELEÇÃO</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        {TEAM_TALKS.map(t => (
                            <button key={t.id} className="btn btn-secondary btn-sm" style={{justifyContent:'flex-start'}}
                                onClick={() => handleTeamTalk(t.id)}>
                                <span>{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* === TAB: TRAINING === */}
            {tab === 'training' && (
                <div className="card card-compact">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>TREINO SEMANAL</h4>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                        {TRAINING_TYPES.map(t => (
                            <button key={t.id} className={`btn ${engine.currentTraining === t.id ? 'btn-primary' : 'btn-secondary'}`}
                                style={{justifyContent:'space-between',fontSize:'0.8rem'}}
                                onClick={() => handleTrain(t.id)}>
                                <span>{t.name}</span>
                                <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{t.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* === TAB: CLUB === */}
            {tab === 'club' && (
                <>
                    {/* Stadium + Progress */}
                    <div className="card card-compact">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>🏟️ {stadiumInfo.name}</h4>
                                <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Cap: {stadiumInfo.capacity.toLocaleString()} • R$ {stadiumInfo.ticketPrice}/ingresso</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.stadiumLevel / 5) * 100}%`}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>Nível {engine.stadiumLevel}/5</span>
                            </div>
                            {engine.stadiumLevel < 5 && (
                                <button className="btn btn-sm btn-primary" onClick={() => {
                                    const result = engine.upgradeStadium();
                                    setLog(result.msg);
                                    forceUpdate();
                                }}>Upgrade</button>
                            )}
                        </div>
                    </div>

                    {/* Staff */}
                    <div className="card card-compact">
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>👥 STAFF ({STAFF_ROLES.filter(r => engine.staff?.getStaff(r.id)).length}/{STAFF_ROLES.length})</h4>
                        {STAFF_ROLES.map(role => {
                            const member = engine.staff?.getStaff(role.id);
                            return (
                                <div key={role.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.2rem 0',fontSize:'0.78rem',borderBottom:'1px solid var(--border-subtle)'}}>
                                    <span>{role.emoji} {role.name}: {member ? <strong style={{color:'var(--primary)'}}>{member.name}</strong> : <span style={{color:'var(--text-muted)'}}>Vago</span>}</span>
                                    {!member && (
                                        <button className="btn btn-sm btn-secondary" onClick={() => {
                                            const result = engine.hireStaff(role.id);
                                            setLog(result.msg || 'Staff contratado!');
                                            forceUpdate();
                                        }}>Contratar</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Youth Academy + Progress */}
                    <div className="card card-compact">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>🎓 BASE Nv.{engine.academyLevel}</h4>
                                <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Produz {engine.academyLevel + 1} jovens/temporada</span>
                                <div className="progress-bar" style={{marginTop:'0.3rem'}}>
                                    <div className="progress-bar-fill" style={{width:`${(engine.academyLevel / 5) * 100}%`,background:'var(--accent)'}}></div>
                                </div>
                                <span style={{fontSize:'0.6rem',color:'var(--text-muted)'}}>Nível {engine.academyLevel}/5</span>
                            </div>
                            {engine.academyLevel < 5 && (
                                <button className="btn btn-sm btn-primary" onClick={() => {
                                    const result = engine.upgradeAcademy();
                                    setLog(result.msg);
                                    forceUpdate();
                                }}>Upgrade (R$ {(getAcademyUpgradeCost(engine.academyLevel)/1000000).toFixed(1)}M)</button>
                            )}
                        </div>
                    </div>

                    {/* Scouting */}
                    <div className="card card-compact">
                        <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🔎 SCOUTING</h4>
                        <div className="action-bar">
                            {SCOUT_REGIONS.map(r => (
                                <button key={r.id} className="btn btn-sm btn-secondary" onClick={() => {
                                    const result = engine.scoutRegionAction(r.id);
                                    setLog(result.msg || `Scout encontrou ${result.players?.length || 0} jogadores!`);
                                    forceUpdate();
                                }}>
                                    {r.emoji} {r.name} (R$ {(r.cost/1000).toFixed(0)}K)
                                </button>
                            ))}
                        </div>
                        {engine.scoutedPlayers?.length > 0 && (
                            <div style={{marginTop:'0.4rem'}}>
                                {engine.scoutedPlayers.map((p, i) => (
                                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',padding:'0.2rem 0',borderBottom:'1px solid var(--border-subtle)'}}>
                                        <span>{p.name} ({p.position}, {p.age}a, OVR {p.ovr})</span>
                                        <button className="btn btn-sm btn-primary" onClick={() => {
                                            const result = engine.signScoutedPlayer(i);
                                            setLog(result?.msg || 'Contratado!');
                                            forceUpdate();
                                        }}>Contratar</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Board */}
                    {engine.board && (
                        <div className="card card-compact">
                            <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>🏛️ DIRETORIA</h4>
                            <ul className="stats-list">
                                <li><span>Confiança:</span><strong style={{color: boardStatus?.color}}>{engine.board.confidence}%</strong></li>
                                <li><span>Status:</span><strong style={{color: boardStatus?.color}}>{boardStatus?.label}</strong></li>
                            </ul>
                            {engine.legacy && (engine.legacy.history?.length ?? 0) > 0 && (
                                <div style={{marginTop:'0.4rem',borderTop:'1px solid var(--border-subtle)',paddingTop:'0.3rem'}}>
                                    <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Histórico:</span>
                                    {engine.legacy.history.map((h, i) => (
                                        <div key={i} style={{fontSize:'0.7rem',color:'var(--text-muted)',padding:'0.1rem 0'}}>
                                            T{h.season}: {h.team} ({h.position}º) — {h.record}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* === TAB: TRANSFERS === */}
            {tab === 'transfers' && (engine.transferOffers?.length ?? 0) > 0 && (
                <div className="card card-compact">
                    <h4 style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.3rem'}}>📬 OFERTAS</h4>
                    {engine.transferOffers.map((offer, i) => (
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.3rem 0',borderBottom:'1px solid var(--border-subtle)'}}>
                            <div style={{fontSize:'0.78rem'}}>
                                <strong>{offer.playerName}</strong> (OVR {offer.playerOvr})
                                <div style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{offer.buyerClub} • R$ {(offer.offerAmount / 1000000).toFixed(1)}M</div>
                            </div>
                            <div style={{display:'flex',gap:'0.25rem'}}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleAcceptOffer(offer.playerId)}>✓</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRejectOffer(offer.playerId)}>✗</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Press Conference Modal */}
            {engine.pressQuestion && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>🎙️ Coletiva de Imprensa</h3>
                        <p>{engine.pressQuestion.text}</p>
                        <div className="modal-options">
                            {engine.pressQuestion.options.map(opt => (
                                <button key={opt.id} className="btn btn-secondary" onClick={() => {
                                    const result = engine.answerPress(opt.id);
                                    if (result) setLog(`Coletiva: ${result.answer}`);
                                    forceUpdate();
                                }} style={{textAlign:'left',fontSize:'0.8rem'}}>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav */}
            <div className="action-bar" style={{marginTop:'0.5rem'}}>
                <button className="btn btn-secondary" onClick={() => changeView('squad')}>👥 Plantel</button>
                <button className="btn btn-secondary" onClick={() => changeView('market')}>🛒 Mercado</button>
                <button className="btn btn-secondary" onClick={() => changeView('standings')}>📊 Tabela</button>
            </div>

            {/* Status Footer (Stitch v2 design) */}
            <div className="status-footer">
                <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                    <span><span className="label">LIGA:</span>SÉRIE {['A','B','C','D'][team.division - 1]}</span>
                    <span><span className="label">RODADA:</span>{seasonWeek}/38</span>
                    <span><span className="label">TEMP:</span>{engine.seasonNumber}</span>
                </div>
                <div className="build">ELIFOOT MANAGER 2026 — BUILD 0.9.0</div>
            </div>
        </div>
    );
}
