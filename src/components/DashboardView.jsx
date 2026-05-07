import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../engine/ManagerSystems';

export function DashboardView() {
    const { gameState, changeView, getEngine, forceUpdate } = useGame();
    const engine = getEngine();
    const team = engine.getTeam(gameState.teamId);
    if (!team) return <div className="main-content">Time não encontrado.</div>;

    const [log, setLog] = useState('');
    const [tab, setTab] = useState('overview'); // overview | tactics | training | transfers

    const sectors = engine.getTeamSectors(team.id);
    const standings = engine.getStandings(team.zone, team.division);
    const pos = standings.findIndex(s => s.teamId === team.id) + 1;
    const avgMoral = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
    const avgEnergy = team.squad.reduce((s, p) => s + p.energy, 0) / team.squad.length;
    const stats = engine.managerStats;
    const cond = engine.matchCondition;

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
                            Semana {engine.currentWeek}/38 • {stats.wins}V {stats.draws}E {stats.losses}D
                            {stats.streak > 0 ? ` 🔥${stats.streak}` : stats.streak < 0 ? ` ❄️${Math.abs(stats.streak)}` : ''}
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: team.balance > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            R$ {(team.balance / 1000000).toFixed(1)}M
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pos}º lugar • Série {['A','B','C','D'][team.division - 1]}</div>
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
                        <li><span>Energia Média:</span> <strong style={{color: avgEnergy < 50 ? 'var(--danger)' : 'var(--primary)'}}>{avgEnergy.toFixed(0)}%</strong></li>
                        {cond && <li><span>Próximo Jogo:</span> <strong>{cond.name}</strong></li>}
                        {engine.transferOffers.length > 0 && <li><span>📬 Ofertas:</span> <strong style={{color:'var(--accent)'}}>{engine.transferOffers.length}</strong></li>}
                    </ul>
                </div>
            </div>

            {/* Nav Tabs */}
            <div className="nav-tabs">
                <button className={`nav-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📋 Visão Geral</button>
                <button className={`nav-tab ${tab === 'tactics' ? 'active' : ''}`} onClick={() => setTab('tactics')}>⚔️ Táticas</button>
                <button className={`nav-tab ${tab === 'training' ? 'active' : ''}`} onClick={() => setTab('training')}>🏃 Treino</button>
                <button className={`nav-tab ${tab === 'teamtalk' ? 'active' : ''}`} onClick={() => setTab('teamtalk')}>📢 Preleção</button>
                {engine.transferOffers.length > 0 && <button className={`nav-tab ${tab === 'transfers' ? 'active' : ''}`} onClick={() => setTab('transfers')}>📬 Ofertas ({engine.transferOffers.length})</button>}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && (
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
            )}

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
                </div>
            )}

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

            {/* Action Bar */}
            <div className="action-bar">
                <button className="btn btn-primary" onClick={() => changeView('match')}>⚽ Jogar Partida</button>
                <button className="btn btn-secondary" onClick={() => changeView('squad')}>👥 Plantel</button>
                <button className="btn btn-secondary" onClick={() => changeView('market')}>🛒 Mercado</button>
                <button className="btn btn-secondary" onClick={() => changeView('standings')}>📊 Tabela</button>
            </div>
        </div>
    );
}
