import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';

import { STAFF_ROLES, SCOUT_REGIONS, getStadiumInfo } from '../engine/StadiumSystem';
import { getAcademyUpgradeCost } from '../engine/YouthAcademy';
import { Help } from './Help';
import { Tooltip } from './Tooltip';
import { DashboardHeader, DashboardAlerts, DashboardFooter } from './dashboard';
import { EfBanner } from './ui';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);

    // BUG-021 fix: hooks BEFORE early return (Rules of Hooks)
    // React error #310 fires when team transitions exists→null across renders.
    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview');
    const [banner, setBanner] = React.useState(null);
    const prevOffersRef = React.useRef(engine.transferOffers?.length || 0);
    const prevConfidenceRef = React.useRef(engine.board?.confidence ?? 60);
    const prevSeasonRef = React.useRef(engine.seasonNumber);
    const prevSponsorRef = React.useRef(engine.currentSponsor?.name || null);
    const prevInjuriesRef = React.useRef((engine.getTeam(gameState.teamId)?.squad || []).filter(p => p.injury).length);
    const prevSuspensionsRef = React.useRef((engine.getTeam(gameState.teamId)?.squad || []).filter(p => p.suspension > 0).length);

    // Hook: detect engine events and surface as full-screen banners
    React.useEffect(() => {
        if (!team) return;
        const offerCount = engine.transferOffers?.length || 0;
        if (offerCount > prevOffersRef.current) setBanner('offer');
        prevOffersRef.current = offerCount;

        const conf = engine.board?.confidence ?? 60;
        if (conf < 10 && prevConfidenceRef.current >= 10) setBanner('fired');
        prevConfidenceRef.current = conf;

        // Season transition: champion / promotion / relegation
        if (engine.seasonNumber > prevSeasonRef.current) {
            const lastSeasonRecord = engine.legacy?.history?.[engine.legacy.history.length - 1];
            if (lastSeasonRecord) {
                if (lastSeasonRecord.position === 1) setBanner('champion');
                else if (/sub|promo/i.test(lastSeasonRecord.title || '')) setBanner('promotion');
                else if (/cai|releg/i.test(lastSeasonRecord.title || '')) setBanner('relegation');
            }
            prevSeasonRef.current = engine.seasonNumber;
        }

        // Sponsor signed
        const curSponsor = engine.currentSponsor?.name || null;
        if (curSponsor && curSponsor !== prevSponsorRef.current) {
            if (prevSponsorRef.current !== null) setBanner('sponsor');
            prevSponsorRef.current = curSponsor;
        }

        // New injury / suspension
        const teamRef = engine.getTeam(gameState.teamId);
        if (teamRef) {
            const injCount = teamRef.squad.filter(p => p.injury).length;
            if (injCount > prevInjuriesRef.current) setBanner('injury');
            prevInjuriesRef.current = injCount;

            const suspCount = teamRef.squad.filter(p => p.suspension > 0).length;
            if (suspCount > prevSuspensionsRef.current) setBanner('suspension');
            prevSuspensionsRef.current = suspCount;
        }
    });

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
            {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}
            {/* === HEADER (Stitch refactor) === */}
            <DashboardHeader
                team={team}
                stats={{ ...stats, position: pos }}
                boardStatus={boardStatus}
                board={engine.board}
                balance={team.balance}
                seasonWeek={seasonWeek}
                seasonNumber={engine.seasonNumber}
                legacyLevel={legacyLevel}
                division={team.division}
            />

            {/* === ALERTS (Stitch refactor) === */}
            <DashboardAlerts
                injured={injured}
                expiringContracts={expiringContracts}
                avgEnergy={avgEnergy}
                transferOffersCount={engine.transferOffers?.length ?? 0}
                onOpenTransfers={() => setTab('transfers')}
            />

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
                    <Help id="sector.gol"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}>{sectors.goalkeeper}</span><span className="stat-label">GOL</span></div></Help>
                    <Help id="sector.def"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}>{sectors.defense}</span><span className="stat-label">DEF</span></div></Help>
                    <Help id="sector.mei"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}>{sectors.midfield}</span><span className="stat-label">MEI</span></div></Help>
                    <Help id="sector.ata"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem'}}>{sectors.attack}</span><span className="stat-label">ATA</span></div></Help>
                    <Help id="sector.moral_avg"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem',color: avgMoral > 60 ? 'var(--primary)' : avgMoral < 40 ? 'var(--danger)' : 'var(--accent)'}}>{avgMoral.toFixed(0)}%</span><span className="stat-label">MORAL</span></div></Help>
                    <Help id="stat.energia"><div className="inline-stat"><span className="stat-value" style={{fontSize:'0.9rem',color: avgEnergy < 50 ? 'var(--danger)' : 'var(--primary)'}}>{avgEnergy.toFixed(0)}%</span><span className="stat-label">ENERGIA</span></div></Help>
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

            {/* === TAB CONTENT WRAPPER (for animation) === */}
            <div key={tab} className="ef-anim-fade-in">

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

            </div>
            {/* === END TAB CONTENT WRAPPER === */}

            {/* Bottom Nav */}
            <div className="action-bar" style={{marginTop:'0.5rem', flexWrap:'wrap'}}>
                <button className="btn btn-secondary" onClick={() => changeView('squad')}>👥 Plantel</button>
                <button className="btn btn-secondary" onClick={() => changeView('market')}>🛒 Mercado</button>
                <button className="btn btn-secondary" onClick={() => changeView('standings')}>📊 Tabela</button>
                <button className="btn btn-secondary" onClick={() => changeView('achievements')}>🏆 Conquistas</button>
                <button className="btn btn-secondary" onClick={() => changeView('press')}>🎙️ Coletiva</button>
                <button className="btn btn-secondary" onClick={() => changeView('saves')}>💾 Saves</button>
            </div>

            {/* Status Footer (Stitch refactor) */}
            <DashboardFooter
                division={team.division}
                seasonWeek={seasonWeek}
                seasonNumber={engine.seasonNumber}
            />
        </div>
    );
}
