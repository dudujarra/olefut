import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';
import { BOARD_MEMBERS } from '../engine/BoardSystem';
import { STAFF_ROLES, SCOUT_REGIONS, getStadiumInfo } from '../engine/StadiumSystem';
import { YOUTH_COORDINATOR, getAcademyUpgradeCost } from '../engine/YouthAcademy';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return <div className="main-content">Time não encontrado.</div>;

    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview');

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

    const handleTrain = (id) => {
        const result = engine.doTraining(id);
        setLog(result.msg);
        forceUpdate();
    };

    const handleTeamTalk = (id) => {
        const result = engine.doTeamTalk(id);
        if (result.success) setLog(`Preleção: "${result.talk.text}"`);
        forceUpdate();
    };

    const handleAcceptOffer = (playerId) => {
        const result = engine.acceptTransferOffer(playerId);
        setLog(result.msg);
        forceUpdate();
    };

    const handleRejectOffer = (playerId) => {
        engine.rejectTransferOffer(playerId);
        setLog('Oferta recusada.');
        forceUpdate();
    };

    return (
        <div className="main-content fade-in">
            {/* Header */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2>{team.name}</h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Temp {engine.seasonNumber} • Semana {((engine.currentWeek - 1) % 38) + 1}/38 • {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                        {legacyLevel && <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{legacyLevel.emoji} {legacyLevel.label} (Rep: {engine.legacy.reputation})</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pos}º lugar • Série {['A','B','C','D'][team.division - 1]}</div>
                        {boardStatus && <div style={{ fontSize: '0.7rem', color: boardStatus.color, marginTop: '2px' }}>{boardStatus.emoji} Diretoria: {boardStatus.label} ({engine.board.confidence}%)</div>}
                        {engine.currentSponsor && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{engine.currentSponsor.name}</div>}
                    </div>
                </div>
                <div className="grid-3">
                    <ul className="stats-list">
                        <li><span>Formação:</span> <strong>{team.formation}</strong></li>
                        <li><span>Tática:</span> <strong>{TACTICS[engine.currentTactic]?.name}</strong></li>
                        <li><span>Moral:</span> <strong style={{color: avgMoral > 60 ? 'var(--primary)' : avgMoral < 40 ? 'var(--danger)' : 'var(--accent)'}}>{avgMoral.toFixed(0)}%</strong></li>
                    </ul>
                    <ul className="stats-list">
                        <li><span>🧤 GOL:</span> <strong>{sectors.goalkeeper}</strong></li>
                        <li><span>🛡️ DEF:</span> <strong>{sectors.defense}</strong></li>
                        <li><span>🎯 MEI:</span> <strong>{sectors.midfield}</strong></li>
                        <li><span>⚡ ATA:</span> <strong>{sectors.attack}</strong></li>
                    </ul>
                    <ul className="stats-list">
                        <li><span>Energia:</span> <strong style={{color: avgEnergy < 50 ? 'var(--danger)' : 'var(--primary)'}}>{avgEnergy.toFixed(0)}%</strong></li>
                        <li><span>🏟️ Estádio:</span> <strong>{stadiumInfo.name}</strong></li>
                        {injured.length > 0 && <li><span>🏥 Lesionados:</span> <strong style={{color:'var(--danger)'}}>{injured.length}</strong></li>}
                    </ul>
                </div>
            </div>

            {/* Nav Tabs */}
            <div className="nav-tabs">
                <button className={`nav-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📋 Geral</button>
                <button className={`nav-tab ${tab === 'tactics' ? 'active' : ''}`} onClick={() => setTab('tactics')}>⚔️ Táticas</button>
                <button className={`nav-tab ${tab === 'training' ? 'active' : ''}`} onClick={() => setTab('training')}>🏃 Treino</button>
                <button className={`nav-tab ${tab === 'teamtalk' ? 'active' : ''}`} onClick={() => setTab('teamtalk')}>📢 Preleção</button>
                <button className={`nav-tab ${tab === 'club' ? 'active' : ''}`} onClick={() => setTab('club')}>🏟️ Clube</button>
                <button className={`nav-tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>🏛️ Diretoria</button>
                {engine.transferOffers.length > 0 && <button className={`nav-tab ${tab === 'transfers' ? 'active' : ''}`} onClick={() => setTab('transfers')}>📬 Ofertas ({engine.transferOffers.length})</button>}
            </div>

            {/* === TAB: OVERVIEW === */}
            {tab === 'overview' && (
                <>
                    {/* Week Events */}
                    {engine.weekEvents.length > 0 && (
                        <div className="card">
                            <h3 style={{marginBottom: '0.75rem'}}>📰 Eventos da Semana</h3>
                            {engine.weekEvents.map((ev, i) => (
                                <p key={i} style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom:'0.25rem'}}>{ev}</p>
                            ))}
                        </div>
                    )}

                    <div className="card">
                        <h3 style={{marginBottom: '0.75rem'}}>Finanças da Semana</h3>
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
                        ) : <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Avance a semana para ver o relatório.</p>}
                    </div>

                    {injured.length > 0 && (
                        <div className="card">
                            <h3 style={{marginBottom: '0.75rem'}}>🏥 Departamento Médico ({injured.length})</h3>
                            <ul className="stats-list">
                                {injured.map((p, i) => (
                                    <li key={i}><span>{p.injury.emoji} {p.name} — {p.injury.name}</span><strong style={{color: 'var(--danger)'}}>{p.injury.weeksLeft} sem</strong></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {expiringContracts.length > 0 && (
                        <div className="card">
                            <h3 style={{marginBottom: '0.75rem'}}>📋 Contratos Vencendo</h3>
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
                <div className="card">
                    <h3 style={{marginBottom: '0.75rem'}}>Formação</h3>
                    <div className="action-bar">
                        {Object.keys(FORMATIONS).map(f => (
                            <button key={f} className={`btn btn-sm ${team.formation === f ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { engine.setFormation(f); forceUpdate(); }}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <h3 style={{margin: '1rem 0 0.75rem'}}>Tática</h3>
                    <div className="action-bar">
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <button key={k} className={`btn btn-sm ${engine.currentTactic === k ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { engine.setTactic(k); forceUpdate(); }}>
                                {v.name}
                            </button>
                        ))}
                    </div>
                    <p style={{color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem'}}>
                        {TACTICS[engine.currentTactic]?.description}
                    </p>
                    {cond && <p style={{color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem'}}>🌤️ Próximo jogo: {cond.name}</p>}
                </div>
            )}

            {/* === TAB: TRAINING === */}
            {tab === 'training' && (
                <div className="card">
                    <h3 style={{marginBottom: '0.75rem'}}>Treino Semanal</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                        {TRAINING_TYPES.map(t => (
                            <button key={t.id} className={`btn ${engine.currentTraining === t.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleTrain(t.id)}>
                                <span>{t.name}</span>
                                <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'var(--text-muted)'}}>{t.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* === TAB: TEAM TALK === */}
            {tab === 'teamtalk' && (
                <div className="card">
                    <h3 style={{marginBottom: '0.75rem'}}>Preleção Pré-Jogo</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                        {TEAM_TALKS.map(tt => (
                            <button key={tt.id} className="btn btn-secondary" onClick={() => handleTeamTalk(tt.id)} style={{textAlign:'left'}}>
                                <span>{tt.name}</span>
                                <span style={{marginLeft:'0.5rem',fontSize:'0.75rem',color:'var(--text-muted)'}}>"{tt.text}"</span>
                            </button>
                        ))}
                    </div>
                    {engine.lastTeamTalk && (
                        <p style={{color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.75rem'}}>
                            Última preleção: {engine.lastTeamTalk.name} (ATA {engine.teamTalkModifiers.ata}x, DEF {engine.teamTalkModifiers.def}x)
                        </p>
                    )}
                </div>
            )}

            {/* === TAB: CLUB (Stadium + Staff + Youth + Scouting) === */}
            {tab === 'club' && (
                <>
                    {/* Stadium */}
                    <div className="card">
                        <h3 style={{marginBottom: '0.75rem'}}>🏟️ {stadiumInfo.name}</h3>
                        <ul className="stats-list">
                            <li><span>Nível:</span> <strong>{engine.stadiumLevel}/5</strong></li>
                            <li><span>Capacidade:</span> <strong>{stadiumInfo.capacity.toLocaleString()}</strong></li>
                            <li><span>VIP:</span> <strong>{stadiumInfo.vipSeats.toLocaleString()}</strong></li>
                            <li><span>Ingresso:</span> <strong>R$ {stadiumInfo.ticketPrice}</strong></li>
                        </ul>
                        {engine.stadiumLevel < 5 && (
                            <button className="btn btn-primary btn-sm" style={{marginTop:'0.5rem'}} onClick={() => {
                                const r = engine.upgradeStadium();
                                setLog(r.msg);
                                forceUpdate();
                            }}>
                                ⬆️ Upgrade (R$ {(getStadiumInfo(engine.stadiumLevel + 1).upgradeCost / 1000000).toFixed(0)}M)
                            </button>
                        )}
                    </div>

                    {/* Staff */}
                    <div className="card">
                        <h3 style={{marginBottom: '0.75rem'}}>👔 Staff ({engine.staff.hired.length}/5)</h3>
                        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                            {STAFF_ROLES.map(role => {
                                const isHired = engine.staff.has(role.id);
                                return (
                                    <div key={role.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.4rem',background: isHired ? 'var(--bg-panel-hover)' : 'transparent', borderRadius:'var(--radius-sm)'}}>
                                        <div>
                                            <strong>{role.emoji} {role.npc.name}</strong>
                                            <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{role.name} — {role.description}</div>
                                        </div>
                                        {isHired ? (
                                            <button className="btn btn-danger btn-sm" onClick={() => { engine.fireStaff(role.id); forceUpdate(); }}>Demitir</button>
                                        ) : (
                                            <button className="btn btn-primary btn-sm" onClick={() => { const r = engine.hireStaff(role.id); setLog(r.msg); forceUpdate(); }}>
                                                R$ {(role.cost/1000).toFixed(0)}K/sem
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Youth Academy */}
                    <div className="card">
                        <h3 style={{marginBottom: '0.75rem'}}>🎓 Base — {YOUTH_COORDINATOR.name}</h3>
                        <ul className="stats-list">
                            <li><span>Nível da Academia:</span> <strong>{engine.academyLevel}/5</strong></li>
                            <li><span>Jovens no elenco:</span> <strong>{team.squad.filter(p => p.isYouth).length}</strong></li>
                        </ul>
                        {engine.academyLevel < 5 && (
                            <button className="btn btn-primary btn-sm" style={{marginTop:'0.5rem'}} onClick={() => {
                                const r = engine.upgradeAcademy();
                                setLog(r.msg);
                                forceUpdate();
                            }}>
                                ⬆️ Upgrade Base (R$ {(getAcademyUpgradeCost(engine.academyLevel) / 1000000).toFixed(0)}M)
                            </button>
                        )}
                    </div>

                    {/* Scouting */}
                    <div className="card">
                        <h3 style={{marginBottom: '0.75rem'}}>🔍 Scouting {engine.staff.has('scout') ? '(Olheiro ativo)' : '(Sem olheiro)'}</h3>
                        <div className="action-bar">
                            {SCOUT_REGIONS.map(r => (
                                <button key={r.id} className="btn btn-secondary btn-sm" onClick={() => {
                                    const result = engine.doScouting(r.id);
                                    if (result.success) setLog(`${result.players.length} jogadores encontrados em ${r.name}`);
                                    else setLog(result.msg);
                                    forceUpdate();
                                }}>
                                    {r.name} {r.cost > 0 ? `(R$ ${(r.cost/1000).toFixed(0)}K)` : '(grátis)'}
                                </button>
                            ))}
                        </div>
                        {engine.scoutedPlayers.length > 0 && (
                            <div style={{marginTop:'0.75rem'}}>
                                {engine.scoutedPlayers.map((p, i) => (
                                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.4rem',borderBottom:'1px solid var(--border-subtle)'}}>
                                        <div>
                                            <strong>{p.name}</strong> <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{p.position} • OVR {p.ovr} • {p.age} anos</span>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => {
                                            if (team.balance >= p.askingPrice) {
                                                team.balance -= p.askingPrice;
                                                team.squad.push({...p, isTitular: false, contract: {weeksLeft: 76, salary: p.askingPrice / 100}, injury: null, moral: 60});
                                                engine.scoutedPlayers = engine.scoutedPlayers.filter((_, j) => j !== i);
                                                setLog(`${p.name} contratado por R$ ${(p.askingPrice/1000000).toFixed(1)}M!`);
                                                forceUpdate();
                                            } else setLog('Saldo insuficiente.');
                                        }}>
                                            R$ {(p.askingPrice/1000000).toFixed(1)}M
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* === TAB: BOARD === */}
            {tab === 'board' && engine.board && (
                <div className="card">
                    <h3 style={{marginBottom: '0.75rem'}}>🏛️ Diretoria</h3>
                    <div style={{display:'flex',gap:'1.5rem',marginBottom:'1rem'}}>
                        <div>
                            <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{BOARD_MEMBERS.president.emoji} {BOARD_MEMBERS.president.role}</div>
                            <strong>{BOARD_MEMBERS.president.name}</strong>
                        </div>
                        <div>
                            <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{BOARD_MEMBERS.director.emoji} {BOARD_MEMBERS.director.role}</div>
                            <strong>{BOARD_MEMBERS.director.name}</strong>
                        </div>
                    </div>
                    <div className="rel-bar" style={{marginBottom:'1rem'}}>
                        <label><span>Confiança</span><span style={{color: boardStatus?.color}}>{engine.board.confidence}%</span></label>
                        <div className="bar"><div className="bar-fill boss" style={{width: `${engine.board.confidence}%`, background: boardStatus?.color}}/></div>
                    </div>
                    <h4 style={{fontSize:'0.85rem',marginBottom:'0.5rem'}}>Objetivos da Temporada</h4>
                    <ul className="stats-list">
                        {engine.board.objectives.map((o, i) => (
                            <li key={i}><span>{o.text}</span><strong style={{color:'var(--text-muted)'}}>{o.weight}%</strong></li>
                        ))}
                    </ul>
                    {engine.board.warningGiven && <div className="bench-warning" style={{marginTop:'1rem'}}>⚠️ A diretoria está insatisfeita. Melhore ou será demitido.</div>}
                    {engine.board.isFired && <div className="bench-warning" style={{marginTop:'1rem',background:'rgba(239,68,68,0.3)'}}>🔴 VOCÊ FOI DEMITIDO.</div>}

                    {/* Legacy */}
                    {engine.legacy && engine.legacy.seasons.length > 0 && (
                        <>
                            <h4 style={{fontSize:'0.85rem',marginTop:'1rem',marginBottom:'0.5rem'}}>📜 Histórico</h4>
                            <ul className="stats-list">
                                {engine.legacy.seasons.map((s, i) => (
                                    <li key={i}><span>Temp {i+1}: {s.teamName} — {s.record}</span><strong>{s.title || `${s.position}º`}</strong></li>
                                ))}
                            </ul>
                            {engine.legacy.titles.length > 0 && <p style={{color:'var(--primary)',fontSize:'0.8rem',marginTop:'0.5rem'}}>🏆 Títulos: {engine.legacy.titles.join(', ')}</p>}
                        </>
                    )}
                </div>
            )}

            {/* === TAB: TRANSFERS === */}
            {tab === 'transfers' && (
                <div className="card">
                    <h3 style={{marginBottom: '0.75rem'}}>Propostas de Transferência</h3>
                    {engine.transferOffers.length === 0 ? (
                        <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Nenhuma oferta no momento.</p>
                    ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                            {engine.transferOffers.map((o, i) => (
                                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem',background:'var(--bg-panel-hover)',borderRadius:'var(--radius-sm)'}}>
                                    <div>
                                        <strong>{o.playerName}</strong> <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>OVR {o.playerOvr}</span>
                                        <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{o.buyerClub} oferece <strong style={{color:'var(--primary)'}}>R$ {(o.offerAmount / 1000000).toFixed(1)}M</strong></div>
                                    </div>
                                    <div style={{display:'flex',gap:'0.4rem'}}>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAcceptOffer(o.playerId)}>✅</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleRejectOffer(o.playerId)}>❌</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Log */}
            {log && <p style={{ color: 'var(--accent)', fontSize: '0.8rem', margin: '0.5rem 0' }}>📰 {log}</p>}

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
                                }} style={{textAlign:'left'}}>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="action-bar">
                <button className="btn btn-primary" onClick={() => {
                    engine.checkPressConference();
                    if (!engine.pressQuestion) changeView('match');
                    else forceUpdate();
                }}>⚽ Jogar Partida</button>
                <button className="btn btn-secondary" onClick={() => changeView('squad')}>👥 Plantel</button>
                <button className="btn btn-secondary" onClick={() => changeView('market')}>🛒 Mercado</button>
                <button className="btn btn-secondary" onClick={() => changeView('standings')}>📊 Tabela</button>
            </div>
        </div>
    );
}
