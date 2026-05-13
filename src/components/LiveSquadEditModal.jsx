import { useState } from 'react';
import { TACTICS } from '../engine/ManagerSystems';
import { Help } from './Help';
import { EfTooltip, EfModal, EfButton } from './ui';
import {
    ArrowsLeftRight, Strategy, Lightning, Users, CheckCircle, Warning, XCircle, Play
} from '@phosphor-icons/react';
import '../styles/live-squad-edit-modal.css';

const MAX_LIVE_SUBS = 5;

function energyMod(energy) {
    if (energy < 50) return 'low';
    if (energy < 75) return 'mid';
    return 'high';
}

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
                    <EfTooltip content="Limite FIFA: 5 substituições por jogo">
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
                                    <Users size={16} /> SUBSTITUIR QUEM?
                                </div>
                                <div className="ef-livesq__player-list">
                                    {titulares.map(p => {
                                        const eMod = energyMod(p.energy);
                                        return (
                                            <div key={p.id}
                                                className="ef-livesq__player-row ef-livesq__player-row--clickable"
                                                onClick={() => setSelectedOut(p)}
                                            >
                                                <div className="ef-livesq__player-identity">
                                                    <span className="ef-livesq__pos-badge">
                                                        {p.position}
                                                    </span>
                                                    <span className="ef-livesq__player-name">{p.name}</span>
                                                </div>
                                                <div className={`ef-livesq__player-energy ef-livesq__energy--${eMod}`}>
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
                                <div className="ef-livesq__selected-banner">
                                    <div className="ef-livesq__selected-row">
                                        <XCircle size={20} color="var(--danger)" />
                                        <span className="ef-livesq__selected-text">SAINDO:</span>
                                        <strong className="ef-livesq__selected-name">{selectedOut.name} ({selectedOut.position})</strong>
                                    </div>
                                    <EfButton variant="secondary" size="sm" onClick={() => setSelectedOut(null)}>CANCELAR</EfButton>
                                </div>

                                <div className="ef-livesq__section-label">
                                    <Users size={16} /> ESCOLHER RESERVA
                                </div>

                                <div className="ef-livesq__player-list ef-livesq__player-list--reserves">
                                    {reserves.length === 0 && (
                                        <div className="ef-livesq__no-reserves">
                                            NENHUM RESERVA COM ENERGIA DISPONÍVEL
                                        </div>
                                    )}
                                    {reserves.map(p => (
                                        <div key={p.id} className="ef-livesq__player-row ef-livesq__player-row--reserve">
                                            <div className="ef-livesq__player-identity">
                                                <span className="ef-livesq__pos-badge">
                                                    {p.position}
                                                </span>
                                                <div className="ef-livesq__player-meta">
                                                    <span className="ef-livesq__player-name">{p.name}</span>
                                                    <span className="ef-livesq__player-stats">
                                                        OVR: <strong>{p.ovr}</strong> • ENERGIA: <strong className="ef-livesq__player-stats--energy">{p.energy}%</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <EfButton
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleSub(selectedOut, p)}
                                                className="ef-livesq__sub-action"
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
