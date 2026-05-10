import React, { useState } from 'react';
import { FormationBoard } from './FormationBoard';
import { Tooltip } from './Tooltip';
import { Help } from './Help';
import { EfClubBadge, EfPanel, EfButton, EfModal } from './ui';

/**
 * PreMatchScreen — 3-panel layout pre-match info
 *
 * Layout (estilo ELIFOOT clássico):
 *  - Left: nosso campo + formação (FormationBoard editable)
 *  - Center: VS + scoreboard
 *  - Right: adversário info (sectors, formação típica, H2H, casa/fora, competição)
 *
 * Props:
 *  - team
 *  - context: { opponent, isHome, location, tournament, h2h, oppSectors, opponentStyle, ... }
 *  - sectors (our team sectors)
 *  - engine
 *  - onSaveLayout: (newLayout) => void
 */
export function PreMatchScreen({ team, context, sectors, engine, onSaveLayout }) {
    const [showFormationModal, setShowFormationModal] = useState(false);

    if (!team) return null;
    const opp = context?.opponent;

    // SPEC-104 Detect derby (clássico) — same state opponents
    const isDerby = context?.opponent?.zone === team.zone && context?.opponent?.division === team.division &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(context?.opponent?.name) &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(team.name);

    return (
        <div
            className={`prematch-screen ef-art-bg ef-art-locker-room ${isDerby ? 'ef-anim-pulse-glow' : ''}`}
            style={isDerby ? { border: '3px solid #D62828', borderRadius: '4px', boxShadow: '0 0 20px rgba(214,40,40,0.4)' } : {}}
        >
            <EfPanel variant="elev" padding="lg">
                {isDerby && (
                    <div style={{
                        marginBottom: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        background: '#D62828',
                        color: '#FFF',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        borderRadius: '4px',
                        animation: 'ef-anim-shake 800ms ease-in-out 3'
                    }}>
                        🔥 CLÁSSICO! 🔥
                    </div>
                )}
                <h3 style={{margin:'0 0 0.6rem 0'}}>⚽ Pré-Jogo</h3>

                <div style={{
                    display:'grid',
                    gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
                    gap:'1rem',
                    alignItems:'start'
                }}>
                    {/* LEFT: Nosso time */}
                    <div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'0.4rem'}}>
                            <EfClubBadge name={team.name} size="md" />
                            <Tooltip content="Sectors do seu time: GOL/DEF/MEI/ATA">
                                <h4 style={{fontSize:'0.85rem',color:'var(--text-muted)',margin:0}}>NOSSO TIME — {team.name}</h4>
                            </Tooltip>
                        </div>
                        <div className="inline-stats" style={{justifyContent:'space-between'}}>
                            <Help id="sector.gol"><div className="inline-stat"><span className="stat-value">{sectors?.goalkeeper ?? '-'}</span><span className="stat-label">GOL</span></div></Help>
                            <Help id="sector.def"><div className="inline-stat"><span className="stat-value">{sectors?.defense ?? '-'}</span><span className="stat-label">DEF</span></div></Help>
                            <Help id="sector.mei"><div className="inline-stat"><span className="stat-value">{sectors?.midfield ?? '-'}</span><span className="stat-label">MEI</span></div></Help>
                            <Help id="sector.ata"><div className="inline-stat"><span className="stat-value">{sectors?.attack ?? '-'}</span><span className="stat-label">ATA</span></div></Help>
                        </div>
                        <div style={{marginTop:'0.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>
                            Formação: <strong>{team.formation || '4-3-3'}</strong>
                        </div>
                        <EfButton
                            variant="primary"
                            size="sm"
                            style={{marginTop:'0.5rem',width:'100%'}}
                            onClick={() => setShowFormationModal(true)}
                        >
                            🎯 Editar Posicionamento
                        </EfButton>
                    </div>

                    {/* CENTER: VS */}
                    <div style={{textAlign:'center',minWidth:'80px'}}>
                        <div className="ef-anim-pulse-glow" style={{fontSize:'1.8rem',fontWeight:700,color:'var(--accent)',display:'inline-block',padding:'4px 12px',borderRadius:'4px'}}>VS</div>
                        <Tooltip content={context?.isHome ? 'Você joga em casa: +5% bilheteria, +3 moral' : 'Você joga fora: público adversário, sem boost casa'}>
                            <div style={{
                                fontSize:'0.78rem',
                                fontWeight:700,
                                padding:'0.2rem 0.5rem',
                                borderRadius:'var(--radius-xs)',
                                background: context?.isHome ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
                                color: context?.isHome ? 'var(--primary)' : 'var(--danger)',
                                marginTop:'0.3rem'
                            }}>
                                {context?.location || 'CASA'}
                            </div>
                        </Tooltip>
                        <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'0.4rem'}}>
                            Sem {context?.seasonWeek}/38
                        </div>
                    </div>

                    {/* RIGHT: Adversário */}
                    <div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'0.4rem'}}>
                            {opp?.name && <EfClubBadge name={opp.name} size="md" />}
                            <Tooltip content="Estilo derivado da tática preferida do adversário">
                                <h4 style={{fontSize:'0.85rem',color:'var(--text-muted)',margin:0}}>
                                    ADVERSÁRIO — {opp?.name || '—'}
                                </h4>
                            </Tooltip>
                        </div>
                        {opp && (
                            <>
                                <div className="inline-stats" style={{justifyContent:'space-between'}}>
                                    <Tooltip content="Goleiro adversário"><div className="inline-stat"><span className="stat-value">{context.oppSectors?.goalkeeper ?? '-'}</span><span className="stat-label">GOL</span></div></Tooltip>
                                    <Tooltip content="Defesa adversária"><div className="inline-stat"><span className="stat-value">{context.oppSectors?.defense ?? '-'}</span><span className="stat-label">DEF</span></div></Tooltip>
                                    <Tooltip content="Meio-campo adversário"><div className="inline-stat"><span className="stat-value">{context.oppSectors?.midfield ?? '-'}</span><span className="stat-label">MEI</span></div></Tooltip>
                                    <Tooltip content="Ataque adversário"><div className="inline-stat"><span className="stat-value">{context.oppSectors?.attack ?? '-'}</span><span className="stat-label">ATA</span></div></Tooltip>
                                </div>
                                <div style={{marginTop:'0.4rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>
                                    Formação: <strong>{opp.formation || '4-3-3'}</strong>
                                    <br />
                                    Estilo: <strong>{context.opponentStyle}</strong>
                                </div>
                                <div style={{marginTop:'0.4rem',fontSize:'0.78rem'}}>
                                    🏆 {context.tournament}
                                </div>
                                {context.h2h && context.h2h.length > 0 && (
                                    <div style={{marginTop:'0.4rem'}}>
                                        <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>H2H últimos {context.h2h.length}:</span>
                                        <div style={{display:'flex',gap:'0.2rem',marginTop:'0.2rem'}}>
                                            {context.h2h.map((m, i) => {
                                                const ourGoals = m.home === team.id ? m.homeGoals : m.awayGoals;
                                                const theirGoals = m.home === team.id ? m.awayGoals : m.homeGoals;
                                                const result = ourGoals > theirGoals ? 'V' : ourGoals < theirGoals ? 'D' : 'E';
                                                const color = result === 'V' ? '#10B981' : result === 'D' ? '#EF4444' : '#FBBF24';
                                                return (
                                                    <Tooltip key={i} content={`${ourGoals}x${theirGoals} — Sem ${m.week ?? '?'}`}>
                                                        <span style={{
                                                            display:'inline-block',
                                                            width:'18px',
                                                            height:'18px',
                                                            borderRadius:'50%',
                                                            background: color,
                                                            color:'#000',
                                                            fontSize:'0.65rem',
                                                            fontWeight:700,
                                                            textAlign:'center',
                                                            lineHeight:'18px'
                                                        }}>{result}</span>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </EfPanel>

            {/* Formation modal */}
            {showFormationModal && (
                <EfModal
                    open={showFormationModal}
                    onClose={() => setShowFormationModal(false)}
                    title="🎯 Posicionamento Tático"
                    size="lg"
                    footer={null}
                >
                    <FormationBoard
                        team={team}
                        onSave={(payload) => {
                            if (engine && engine.saveFormationLayout) {
                                engine.saveFormationLayout(payload);
                            }
                            if (onSaveLayout) onSaveLayout(payload);
                            setShowFormationModal(false);
                        }}
                    />
                </EfModal>
            )}
        </div>
    );
}

export default PreMatchScreen;
