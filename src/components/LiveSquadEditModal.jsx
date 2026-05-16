import { useState } from 'react';
import { TACTICS } from '../engine/ManagerSystems';
import { getFormEmoji } from '../engine/systems/FormSystem.js';
import { Help } from './Help';
import { EfTooltip, EfModal, EfButton } from './ui';
import {
    ArrowsLeftRight, Strategy, Lightning, Users, CheckCircle, Warning, XCircle, Play,
    Heart
} from '@phosphor-icons/react';
import '../styles/live-squad-edit-modal.css';

const DEFAULT_MAX_SUBS = 3;

function energyMod(energy) {
    if (energy < 50) return 'low';
    if (energy < 75) return 'mid';
    return 'high';
}

function moralLabel(moral) {
    if (moral >= 80) return { text: 'Motivado', color: 'var(--color-primary)' };
    if (moral >= 60) return { text: 'Normal', color: 'var(--text-main)' };
    if (moral >= 40) return { text: 'Abatido', color: 'var(--color-secondary)' };
    return { text: 'Desmotivado', color: 'var(--color-danger)' };
}

/**
 * Full player info card for substitution decisions.
 * Shows: Position, Name, OVR, Energy, Moral, Age, Form
 */
function PlayerCard({ player, onClick, actionLabel, actionVariant = 'primary', showAction = false, onAction }) {
    const eMod = energyMod(player.energy);
    const moral = moralLabel(player.moral || 50);
    const formEmoji = getFormEmoji ? getFormEmoji(player.form?.trend) : '';

    return (
        <div
            className={`ef-livesq__player-row${onClick ? ' ef-livesq__player-row--clickable' : ''}${showAction ? ' ef-livesq__player-row--reserve' : ''}`}
            onClick={onClick}
        >
            <div className="ef-livesq__player-identity">
                <span className="ef-livesq__pos-badge">
                    {player.position}
                </span>
                <div className="ef-livesq__player-meta">
                    <span className="ef-livesq__player-name">
                        {player.name} {player._isCaptain ? '[C]' : ''} {formEmoji}
                    </span>
                    <div className="ef-livesq__player-stats-row">
                        <span className="ef-livesq__stat">
                            OVR: <strong>{player.ovr}</strong>
                        </span>
                        <span className={`ef-livesq__stat ef-livesq__energy--${eMod}`}>
                            <Lightning size={12} weight="fill" /> {player.energy}%
                        </span>
                        <span className="ef-livesq__stat" style={{ color: moral.color }}>
                            <Heart size={12} weight="fill" /> {moral.text}
                        </span>
                        <span className="ef-livesq__stat ef-text-muted">
                            {player.age} anos
                        </span>
                    </div>
                    {/* SPEC-161: Exibir todas as infos dos players na tela de substituição */}
                    <div className="ef-livesq__player-skills-row" style={{ display: 'flex', gap: '8px', fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>
                        <span>PAS: {player.skills?.PAS || '?'}</span>
                        <span>FIN: {player.skills?.FIN || '?'}</span>
                        <span>DRI: {player.skills?.DRI || '?'}</span>
                        <span>MAR: {player.skills?.MAR || '?'}</span>
                        <span>FIS: {player.skills?.FIS || '?'}</span>
                        <span>VEL: {player.skills?.VEL || '?'}</span>
                    </div>
                </div>
            </div>
            {showAction && (
                <EfButton
                    variant={actionVariant}
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onAction(); }}
                    className="ef-livesq__sub-action"
                >
                    {actionLabel} <ArrowsLeftRight size={14} />
                </EfButton>
            )}
        </div>
    );
}

export function LiveSquadEditModal({ team, engine, currentMinute, liveSubsCount, maxSubs, benchPlayerIds, onSubMade, onTacticChanged, onClose }) {
    const [selectedOut, setSelectedOut] = useState(null);
    const [tactic, setTactic] = useState(engine.currentTactic);
    const [feedback, setFeedback] = useState('');
    const MAX_LIVE_SUBS = maxSubs || DEFAULT_MAX_SUBS;

    if (!team) return null;

    const titulares = team.squad.filter(p => p.isTitular && !p.injury);
    // Filter reserves: only players on the bench list if provided, otherwise all non-titular
    const reserves = benchPlayerIds && benchPlayerIds.length > 0
        ? benchPlayerIds.map(id => team.squad.find(p => p.id === id)).filter(p => p && !p.isTitular && !p.injury && !p.suspension && p.energy > 10)
        : team.squad.filter(p => !p.isTitular && !p.injury && !p.suspension && p.energy > 10);

    const subsLeft = MAX_LIVE_SUBS - liveSubsCount;

    const handleSub = (outPlayer, inPlayer) => {
        if (subsLeft <= 0) {
            setFeedback('error:Limite de substituições atingido.');
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
            if (onTacticChanged) onTacticChanged();
        }
    };

    const isFeedbackSuccess = feedback.startsWith('success:');
    const cleanFeedback = feedback.replace('success:', '').replace('error:', '');

    return (
        <EfModal
            open={true}
            onClose={onClose}
            title={
                <div className="ef-livesq__title">
                    <Strategy size={24} color="var(--ef-livesq-info)" />
                    <span>GESTÃO TÁTICA ({currentMinute}')</span>
                </div>
            }
            size="md"
            footer={
                <EfButton variant="primary" onClick={onClose} size="lg" className="ef-livesq__footer-btn">
                    RETOMAR PARTIDA <Play weight="fill" />
                </EfButton>
            }
        >
            <div className="ef-livesq ef-livesq__body">
                <div className="ef-livesq__status-bar">
                    <EfTooltip content={`Limite: ${MAX_LIVE_SUBS} substituições por jogo`}>
                        <div className={`ef-livesq__status-cell${subsLeft <= 0 ? ' ef-livesq__status-cell--alert' : ''}`}>
                            <div className="ef-livesq__status-label">
                                <ArrowsLeftRight size={16} /> SUBSTITUIÇÕES
                            </div>
                            <div className={`ef-livesq__status-value${subsLeft <= 0 ? ' ef-livesq__status-value--alert' : ''}`}>
                                {liveSubsCount} / {MAX_LIVE_SUBS}
                            </div>
                        </div>
                    </EfTooltip>
                </div>

                {feedback && (
                    <div className={`ef-livesq__feedback ef-livesq__feedback--${isFeedbackSuccess ? 'success' : 'error'}`}>
                        {isFeedbackSuccess ? <CheckCircle size={20} /> : <Warning size={20} />}
                        {cleanFeedback}
                    </div>
                )}

                <div>
                    <Help id="btn.set_tactics">
                        <div className="ef-livesq__section-label">
                            <Strategy size={16} /> TÁTICA ATUAL
                        </div>
                    </Help>
                    <div className="ef-livesq__tactic-grid">
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

                {subsLeft > 0 && (
                    <div className="ef-livesq__sub-block">
                        {!selectedOut && (
                            <div>
                                <div className="ef-livesq__section-label">
                                    <Users size={16} /> SUBSTITUIR QUEM? <span className="ef-text-muted" style={{ fontWeight: 400, fontSize: '0.85em' }}>({subsLeft} restante{subsLeft !== 1 ? 's' : ''})</span>
                                </div>
                                <div className="ef-livesq__player-list">
                                    {titulares.map(p => (
                                        <PlayerCard
                                            key={p.id}
                                            player={p}
                                            onClick={() => setSelectedOut(p)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedOut && (
                            <div>
                                <div className="ef-livesq__selected-banner">
                                    <div className="ef-livesq__selected-row">
                                        <XCircle size={20} color="var(--danger)" />
                                        <span className="ef-livesq__selected-text">SAINDO:</span>
                                        <strong className="ef-livesq__selected-name">{selectedOut.name} ({selectedOut.position}) — OVR {selectedOut.ovr}</strong>
                                    </div>
                                    <EfButton variant="secondary" size="sm" onClick={() => setSelectedOut(null)}>CANCELAR</EfButton>
                                </div>

                                <div className="ef-livesq__section-label">
                                    <Users size={16} /> ESCOLHER DO BANCO
                                </div>

                                <div className="ef-livesq__player-list ef-livesq__player-list--reserves">
                                    {reserves.length === 0 && (
                                        <div className="ef-livesq__no-reserves">
                                            NENHUM RESERVA DISPONÍVEL NO BANCO
                                        </div>
                                    )}
                                    {reserves.map(p => (
                                        <PlayerCard
                                            key={p.id}
                                            player={p}
                                            showAction
                                            actionLabel="ENTRAR"
                                            onAction={() => handleSub(selectedOut, p)}
                                        />
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
