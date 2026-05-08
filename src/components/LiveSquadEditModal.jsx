import React, { useState } from 'react';
import { TACTICS } from '../engine/ManagerSystems';
import { Help } from './Help';
import { Tooltip } from './Tooltip';

const MAX_LIVE_SUBS = 5;

/**
 * LiveSquadEditModal — Modal aberto durante pause da partida ao vivo
 *
 * Permite:
 * - Substituições live (até 5/jogo, FIFA realista)
 * - Mudança tática (sem cooldown)
 * - Visualização energia/moral plantel atual
 *
 * Limitação v1.0: subs visuais + state commit, não recalcula resultado
 * (engine sync). Refactor para generator é v1.3.
 */
export function LiveSquadEditModal({ team, engine, currentMinute, liveSubsCount, onSubMade, onClose }) {
    const [selectedOut, setSelectedOut] = useState(null);
    const [tactic, setTactic] = useState(engine.currentTactic);
    const [feedback, setFeedback] = useState('');

    if (!team) return null;

    const titulares = team.squad.filter(p => p.isTitular && !p.injury);
    const reserves = team.squad.filter(p => !p.isTitular && !p.injury && p.energy > 10);

    const subsLeft = MAX_LIVE_SUBS - liveSubsCount;

    const handleSub = (outPlayer, inPlayer) => {
        if (subsLeft <= 0) {
            setFeedback('❌ Limite de 5 substituições atingido.');
            return;
        }
        if (engine.applyLiveSubstitution) {
            const result = engine.applyLiveSubstitution(outPlayer.id, inPlayer.id, currentMinute);
            if (result?.success) {
                setFeedback(`✅ ${outPlayer.name} → ${inPlayer.name} aos ${currentMinute}'`);
                setSelectedOut(null);
                onSubMade();
            } else {
                setFeedback(`❌ ${result?.msg || 'Erro na substituição.'}`);
            }
        } else {
            // Fallback inline if engine method missing
            outPlayer.isTitular = false;
            inPlayer.isTitular = true;
            inPlayer.energy = Math.min(100, inPlayer.energy + 10);
            outPlayer.energy = Math.max(outPlayer.energy, 30);
            setFeedback(`✅ ${outPlayer.name} → ${inPlayer.name} aos ${currentMinute}'`);
            setSelectedOut(null);
            onSubMade();
        }
    };

    const handleTacticChange = (newTacticKey) => {
        if (engine.setTactic) {
            engine.setTactic(newTacticKey);
            setTactic(newTacticKey);
            setFeedback(`✅ Tática mudada para ${TACTICS[newTacticKey]?.name}`);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9000,
            padding: '1rem'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.25rem'
            }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                    <h3 style={{margin:0}}>⏸️ PAUSA — Min {currentMinute}'</h3>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>✕ Retomar</button>
                </div>

                {/* Subs counter */}
                <Tooltip content="Limite FIFA: 5 substituições por jogo. Mudanças aplicam ao plantel.">
                    <div style={{
                        background: 'var(--bg-panel-solid)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        marginBottom: '0.75rem'
                    }}>
                        🔄 Substituições: <strong>{liveSubsCount}</strong> / {MAX_LIVE_SUBS}
                        {subsLeft <= 0 && <span style={{color:'var(--danger)',marginLeft:'0.5rem'}}> (limite atingido)</span>}
                    </div>
                </Tooltip>

                {/* Tactic switch */}
                <div style={{marginBottom: '1rem'}}>
                    <Help id="btn.set_tactics">
                        <h4 style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>⚔️ TÁTICA ATUAL</h4>
                    </Help>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <Tooltip key={k} content={v.description || `Tática ${v.name}`}>
                                <button
                                    className={`btn btn-sm ${tactic === k ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleTacticChange(k)}
                                >
                                    {v.name}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div style={{
                        background: feedback.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: feedback.startsWith('✅') ? 'var(--primary)' : 'var(--danger)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        marginBottom: '0.75rem'
                    }}>
                        {feedback}
                    </div>
                )}

                {/* Substituição UI */}
                {subsLeft > 0 && (
                    <>
                        {!selectedOut && (
                            <div style={{marginBottom:'0.75rem'}}>
                                <h4 style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>👥 ESCOLHA QUEM SAI</h4>
                                <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',maxHeight:'200px',overflowY:'auto'}}>
                                    {titulares.map(p => (
                                        <div key={p.id} style={{
                                            display:'flex',
                                            justifyContent:'space-between',
                                            alignItems:'center',
                                            padding:'0.4rem 0.65rem',
                                            background:'var(--bg-panel-solid)',
                                            borderRadius:'var(--radius-xs)',
                                            fontSize:'0.85rem',
                                            cursor:'pointer'
                                        }} onClick={() => setSelectedOut(p)}>
                                            <span>
                                                <span className={`pos-badge ${p.position}`} style={{marginRight:'0.4rem'}}>{p.position}</span>
                                                {p.name}
                                            </span>
                                            <span style={{
                                                color: p.energy < 50 ? 'var(--danger)' : p.energy < 70 ? 'var(--accent)' : 'var(--primary)',
                                                fontSize:'0.8rem'
                                            }}>
                                                ⚡{p.energy}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedOut && (
                            <div>
                                <div style={{
                                    background:'rgba(239,68,68,0.1)',
                                    padding:'0.5rem 0.75rem',
                                    borderRadius:'var(--radius-sm)',
                                    fontSize:'0.85rem',
                                    marginBottom:'0.5rem'
                                }}>
                                    Sai: <strong>{selectedOut.name}</strong> ({selectedOut.position})
                                    <button className="btn btn-sm btn-secondary" style={{marginLeft:'0.5rem',padding:'0.15rem 0.5rem',fontSize:'0.75rem'}} onClick={() => setSelectedOut(null)}>Cancelar</button>
                                </div>
                                <h4 style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'0.4rem'}}>👤 ESCOLHA QUEM ENTRA</h4>
                                <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',maxHeight:'200px',overflowY:'auto'}}>
                                    {reserves.length === 0 && (
                                        <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Nenhuma reserva disponível.</div>
                                    )}
                                    {reserves.map(p => (
                                        <div key={p.id} style={{
                                            display:'flex',
                                            justifyContent:'space-between',
                                            alignItems:'center',
                                            padding:'0.4rem 0.65rem',
                                            background:'var(--bg-panel-solid)',
                                            borderRadius:'var(--radius-xs)',
                                            fontSize:'0.85rem'
                                        }}>
                                            <span>
                                                <span className={`pos-badge ${p.position}`} style={{marginRight:'0.4rem'}}>{p.position}</span>
                                                {p.name}
                                                <span style={{color:'var(--text-muted)',marginLeft:'0.4rem',fontSize:'0.75rem'}}>OVR {p.ovr}</span>
                                            </span>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleSub(selectedOut, p)}
                                            >
                                                Entrar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom — close */}
                <div style={{marginTop:'1rem',display:'flex',justifyContent:'flex-end'}}>
                    <button className="btn btn-primary" onClick={onClose}>▶️ Retomar Partida</button>
                </div>
            </div>
        </div>
    );
}

export default LiveSquadEditModal;
