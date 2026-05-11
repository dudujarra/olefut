/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { TACTICS } from '../engine/ManagerSystems';
import { Help } from './Help';
import { EfTooltip, EfModal, EfButton } from './ui';
import { 
    ArrowsLeftRight, Strategy, Lightning, Users, CheckCircle, Warning, XCircle, Play
} from '@phosphor-icons/react';

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

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    if (!team) return null;

    const titulares = team.squad.filter(p => p.isTitular && !p.injury);
    const reserves = team.squad.filter(p => !p.isTitular && !p.injury && p.energy > 10);

    const subsLeft = MAX_LIVE_SUBS - liveSubsCount;

    const handleSub = (outPlayer, inPlayer) => {
        if (subsLeft <= 0) {
            setFeedback('error:Limite de 5 substituições atingido.');
            return;
        }
        if (engine.applyLiveSubstitution) {
            const result = engine.applyLiveSubstitution(outPlayer.id, inPlayer.id, currentMinute);
            if (result?.success) {
                setFeedback(`success:${outPlayer.name} substituído por ${inPlayer.name} aos ${currentMinute}'`);
                setSelectedOut(null);
                onSubMade();
            } else {
                setFeedback(`error:${result?.msg || 'Erro na substituição.'}`);
            }
        } else {
            // Fallback inline if engine method missing
            outPlayer.isTitular = false;
            inPlayer.isTitular = true;
            inPlayer.energy = Math.min(100, inPlayer.energy + 10);
            outPlayer.energy = Math.max(outPlayer.energy, 30);
            setFeedback(`success:${outPlayer.name} substituído por ${inPlayer.name} aos ${currentMinute}'`);
            setSelectedOut(null);
            onSubMade();
        }
    };

    const handleTacticChange = (newTacticKey) => {
        if (engine.setTactic) {
            engine.setTactic(newTacticKey);
            setTactic(newTacticKey);
            setFeedback(`success:Tática alterada para ${TACTICS[newTacticKey]?.name}`);
        }
    };

    const isFeedbackSuccess = feedback.startsWith('success:');
    const isFeedbackError = feedback.startsWith('error:');
    const cleanFeedback = feedback.replace('success:', '').replace('error:', '');

    return (
        <EfModal
            open={true}
            onClose={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Strategy size={24} color={colors.secondary} /> 
                    <span>GESTÃO TÁTICA ({currentMinute}')</span>
                </div>
            }
            size="md"
            footer={
                <EfButton variant="primary" onClick={onClose} size="lg" style={{ width: '100%', display: 'flex', gap: '8px' }}>
                    RETOMAR PARTIDA <Play weight="fill" />
                </EfButton>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Status Bar */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <EfTooltip content="Limite FIFA: 5 substituições por jogo">
                        <div style={{
                            flex: 1,
                            backgroundColor: colors.bg,
                            padding: '12px',
                            border: `1px solid ${subsLeft <= 0 ? colors.danger : colors.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
                                <ArrowsLeftRight size={16} /> SUBSTITUIÇÕES
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: subsLeft <= 0 ? colors.danger : colors.text }}>
                                {liveSubsCount} / {MAX_LIVE_SUBS}
                            </div>
                        </div>
                    </EfTooltip>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div style={{
                        backgroundColor: isFeedbackSuccess ? '#1B4332' : '#8B0000',
                        border: `1px solid ${isFeedbackSuccess ? colors.accent : colors.danger}`,
                        color: isFeedbackSuccess ? colors.accent : colors.danger,
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {isFeedbackSuccess ? <CheckCircle size={20} /> : <Warning size={20} />}
                        {cleanFeedback}
                    </div>
                )}

                {/* Tactic switch */}
                <div>
                    <Help id="btn.set_tactics">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: colors.textMuted, marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                            <Strategy size={16} /> TÁTICA ATUAL
                        </div>
                    </Help>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Object.entries(TACTICS).map(([k, v]) => (
                            <EfTooltip key={k} content={v.description || `Tática ${v.name}`}>
                                <EfButton
                                    variant={tactic === k ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => handleTacticChange(k)}
                                >
                                    {v.name}
                                </EfButton>
                            </EfTooltip>
                        ))}
                    </div>
                </div>

                {/* Substituição UI */}
                {subsLeft > 0 && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
                        {!selectedOut && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: colors.textMuted, marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                                    <Users size={16} /> SUBSTITUIR QUEM?
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {titulares.map(p => {
                                        const energyColor = p.energy < 50 ? colors.danger : p.energy < 75 ? colors.warning : colors.accent;
                                        return (
                                            <div key={p.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                backgroundColor: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }} 
                                            onClick={() => setSelectedOut(p)}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = colors.secondary}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ 
                                                        backgroundColor: colors.panelElevated, 
                                                        color: colors.textMuted, 
                                                        padding: '2px 6px', 
                                                        fontSize: '0.75rem', 
                                                        fontFamily: 'var(--font-mono)',
                                                        width: '36px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {p.position}
                                                    </span>
                                                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{p.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: energyColor, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                                    <Lightning size={14} weight="fill" /> {p.energy}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedOut && (
                            <div>
                                <div style={{
                                    backgroundColor: '#8B0000',
                                    border: `1px solid ${colors.danger}`,
                                    padding: '12px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <XCircle size={20} color={colors.danger} />
                                        <span style={{ color: colors.danger, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>SAINDO:</span>
                                        <strong style={{ fontFamily: 'var(--font-sans)' }}>{selectedOut.name} ({selectedOut.position})</strong>
                                    </div>
                                    <EfButton variant="secondary" size="sm" onClick={() => setSelectedOut(null)}>CANCELAR</EfButton>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: colors.textMuted, marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                                    <Users size={16} /> ESCOLHER RESERVA
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {reserves.length === 0 && (
                                        <div style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>
                                            NENHUM RESERVA COM ENERGIA DISPONÍVEL
                                        </div>
                                    )}
                                    {reserves.map(p => (
                                        <div key={p.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            backgroundColor: colors.bg,
                                            border: `1px solid ${colors.border}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ 
                                                    backgroundColor: colors.panelElevated, 
                                                    color: colors.textMuted, 
                                                    padding: '2px 6px', 
                                                    fontSize: '0.75rem', 
                                                    fontFamily: 'var(--font-mono)',
                                                    width: '36px',
                                                    textAlign: 'center'
                                                }}>
                                                    {p.position}
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{p.name}</span>
                                                    <span style={{ color: colors.textMuted, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                                                        OVR: <strong style={{ color: colors.text }}>{p.ovr}</strong> • ENERGIA: <strong style={{ color: colors.accent }}>{p.energy}%</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <EfButton
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleSub(selectedOut, p)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                ENTRAR <ArrowsLeftRight size={14} />
                                            </EfButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </EfModal>
    );
}

export default LiveSquadEditModal;
