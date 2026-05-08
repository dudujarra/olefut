/**
 * ClubGalleryView — v1.1 Hall de Lendas UI
 *
 * Apresenta os 6 slots míticos do clube + retired players + counter total.
 * Estilo: prosa estática (não interativa).
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useMyth } from '../hooks/useMyth';
import { MYTH_SLOTS } from '../services/MythService';
import { EfClubBadge } from './ui';

const SLOT_LABELS = {
    idoloEterno: '👑 Ídolo Eterno',
    carrasco: '⚔️ Carrasco',
    goleirao: '🧤 Goleirão',
    criaDaBase: '🌱 Cria da Base',
    traidor: '⚠️ Traidor',
    lendaTragica: '💔 Lenda Trágica'
};

const SLOT_DESCRIPTIONS = {
    idoloEterno: 'Símbolo eterno do clube. 200+ gols, títulos, lealdade absoluta.',
    carrasco: 'Definiu clássicos. Marcou contra o rival vezes demais pra esquecer.',
    goleirao: 'Paredão. 50+ jogos sem sofrer gol. Decisivo em finais.',
    criaDaBase: 'Joia formada em casa. Carreira inteira pelo clube.',
    traidor: 'Transferiu pro rival após anos de promessa. Outdoor "fico até morrer" ainda no CT.',
    lendaTragica: 'Carreira interrompida no auge. Memória eterna na arquibancada.'
};

export function ClubGalleryView({ clubId }) {
    const { gameState, getEngine, changeView, getDashboardView } = useGame();
    const { getHallOfFame, countHallSlots, legends } = useMyth();
    const engine = getEngine();
    const team = engine.getTeam(clubId || gameState.teamId);

    if (!team) return <div className="main-content">Clube não encontrado.</div>;

    const hall = getHallOfFame(team.id);
    const slotsFilled = countHallSlots(team.id);

    // Resolve playerId → player object via squad ou retiredPlayers
    function resolvePlayer(playerId) {
        if (!playerId) return null;
        const inSquad = team.squad?.find(p => p.id === playerId);
        if (inSquad) return inSquad;
        const retired = engine.retiredPlayers?.find(r => r.playerId === playerId);
        if (retired) return retired;
        return { id: playerId, name: `Jogador #${playerId}` };
    }

    return (
        <div className="main-content fade-in">
            <div className="card-header" style={{ marginBottom: '1rem', display:'flex', alignItems:'center', gap:'12px' }}>
                <EfClubBadge name={team.name} size="lg" />
                <h2 style={{margin:0,flex:1}}>🏛️ Galeria de Lendas — {team.name}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => changeView(getDashboardView())}>← Voltar</button>
            </div>

            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Slots Preenchidos: {slotsFilled} / 6</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {slotsFilled === 0 && 'Nenhuma lenda canonizada ainda. Construa o legado.'}
                    {slotsFilled > 0 && slotsFilled < 6 && `${slotsFilled} ídolo${slotsFilled > 1 ? 's' : ''} eternizado${slotsFilled > 1 ? 's' : ''}. Caminho até o panteão completo.`}
                    {slotsFilled === 6 && 'Panteão completo. Mito do clube consolidado.'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {MYTH_SLOTS.map(slot => {
                    const player = resolvePlayer(hall[slot]);
                    const filled = !!player;

                    return (
                        <div key={slot} className={`card ${filled ? 'ef-anim-pop-in' : ''}`} style={{
                            padding: '1rem',
                            opacity: filled ? 1 : 0.5,
                            border: filled ? '2px solid var(--primary)' : '2px dashed var(--text-muted)',
                            position: 'relative'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {filled && <span className="ef-anim-pulse-glow" style={{display:'inline-block',width:'8px',height:'8px',background:'var(--ef-color-func-warning)',borderRadius:'50%'}} />}
                                {SLOT_LABELS[slot]}
                            </h4>
                            {filled ? (
                                <>
                                    <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {player.name}
                                    </p>
                                    {player.position && (
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {player.position}
                                            {player.retired && ' • Aposentado'}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Slot vago
                                </p>
                            )}
                            <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {SLOT_DESCRIPTIONS[slot]}
                            </p>
                        </div>
                    );
                })}
            </div>

            {legends && legends.length > 0 && (
                <div className="card" style={{ padding: '1rem', marginTop: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        Lendas Canonizadas ({legends.length})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Jogadores eternizados pelo clube. Suas histórias persistem entre saves.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ClubGalleryView;
