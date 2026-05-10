import React, { useState } from 'react';
import { TACTICS } from '../engine/ManagerSystems';
import { Help } from './Help';
import { Tooltip } from './Tooltip';
import { EfModal, EfButton } from './ui';

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
        <EfModal
            open={true}
            onClose={onClose}
            title={`⏸️ PAUSA — Min ${currentMinute}'`}
            size="md"
            footer={
                <EfButton variant="primary" onClick={onClose}>▶️ Retomar Partida</EfButton>
            }
        >

                {/* Subs counter */}
                <Tooltip content="Limite FIFA: 5 substituições por jogo. Mudanças aplicam ao plantel.">
                    <div style={{
                        background: '#1E2124',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0',
                        fontSize: '0.85rem',
                        marginBottom: '0.75rem'
                    }}>
                        🔄 Substituições: <strong>{liveSubsCount}</strong> / {MAX_LIVE_SUBS}
                        {subsLeft <= 0 && <span style={{color:'#FF3333',marginLeft:'0.5rem'}}> (limite atingido)</span>}
                    </div>
                </Tooltip>

                {/* Tactic switch */}
                <div style={{marginBottom: '1rem'}}>
                    <Help id="btn.set_tactics">
                        <h4 style={{fontSize:'0.85rem',color:'#888',marginBottom:'0.4rem'}}>⚔️ TÁTICA ATUAL</h4>
                    </Help>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <Tooltip key={k} content={v.description || `Tática ${v.name}`}>
                                <EfButton
                                    variant={tactic === k ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => handleTacticChange(k)}
                                >
                                    {v.name}
                                </EfButton>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div style={{
                        background: feedback.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: feedback.startsWith('✅') ? '#39FF14' : '#FF3333',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0',
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
                                <h4 style={{fontSize:'0.85rem',color:'#888',marginBottom:'0.4rem'}}>👥 ESCOLHA QUEM SAI</h4>
                                <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',maxHeight:'200px',overflowY:'auto'}}>
                                    {titulares.map(p => (
                                        <div key={p.id} style={{
                                            display:'flex',
                                            justifyContent:'space-between',
                                            alignItems:'center',
                                            padding:'0.4rem 0.65rem',
                                            background:'#1E2124',
                                            borderRadius:'0',
                                            fontSize:'0.85rem',
                                            cursor:'pointer'
                                        }} onClick={() => setSelectedOut(p)}>
                                            <span>
                                                <span className={`pos-badge ${p.position}`} style={{marginRight:'0.4rem'}}>{p.position}</span>
                                                {p.name}
                                            </span>
                                            <span style={{
                                                color: p.energy < 50 ? '#FF3333' : p.energy < 70 ? '#FFD700' : '#39FF14',
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
                                    borderRadius:'0',
                                    fontSize:'0.85rem',
                                    marginBottom:'0.5rem'
                                }}>
                                    Sai: <strong>{selectedOut.name}</strong> ({selectedOut.position})
                                    <EfButton variant="secondary" size="sm" style={{marginLeft:'0.5rem',padding:'0.15rem 0.5rem',fontSize:'0.75rem'}} onClick={() => setSelectedOut(null)}>Cancelar</EfButton>
                                </div>
                                <h4 style={{fontSize:'0.85rem',color:'#888',marginBottom:'0.4rem'}}>👤 ESCOLHA QUEM ENTRA</h4>
                                <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',maxHeight:'200px',overflowY:'auto'}}>
                                    {reserves.length === 0 && (
                                        <div style={{color:'#888',fontSize:'0.85rem'}}>Nenhuma reserva disponível.</div>
                                    )}
                                    {reserves.map(p => (
                                        <div key={p.id} style={{
                                            display:'flex',
                                            justifyContent:'space-between',
                                            alignItems:'center',
                                            padding:'0.4rem 0.65rem',
                                            background:'#1E2124',
                                            borderRadius:'0',
                                            fontSize:'0.85rem'
                                        }}>
                                            <span>
                                                <span className={`pos-badge ${p.position}`} style={{marginRight:'0.4rem'}}>{p.position}</span>
                                                {p.name}
                                                <span style={{color:'#888',marginLeft:'0.4rem',fontSize:'0.75rem'}}>OVR {p.ovr}</span>
                                            </span>
                                            <EfButton
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleSub(selectedOut, p)}
                                            >
                                                Entrar
                                            </EfButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

        </EfModal>
    );
}

export default LiveSquadEditModal;
