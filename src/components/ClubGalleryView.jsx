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
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgTrophyRoom from '../assets/environments/bg_trophy_room.png';

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

    if (!team) return <div style={{padding:'16px',color:'var(--text-main)'}}>Clube não encontrado.</div>;

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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgTrophyRoom})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: '#0A130E',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '16px',
            color: 'var(--ef-color-neutral-text-hi)'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EfPanel variant="elev" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <EfClubBadge name={team.name} size="lg" />
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🏛️ GALERIA DE LENDAS — {team.name}</h2>
                    </div>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(getDashboardView())}>← VOLTAR</EfButton>
                </EfPanel>

                <EfPanel variant="elev" padding="md">
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Slots Preenchidos: {slotsFilled} / 6</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {slotsFilled === 0 && 'Nenhuma lenda canonizada ainda. Construa o legado.'}
                        {slotsFilled > 0 && slotsFilled < 6 && `${slotsFilled} ídolo${slotsFilled > 1 ? 's' : ''} eternizado${slotsFilled > 1 ? 's' : ''}. Caminho até o panteão completo.`}
                        {slotsFilled === 6 && 'Panteão completo. Mito do clube consolidado.'}
                    </p>
                </EfPanel>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {MYTH_SLOTS.map(slot => {
                        const player = resolvePlayer(hall[slot]);
                        const filled = !!player;

                        return (
                            <EfPanel key={slot} variant={filled ? 'elev' : 'sunk'} padding="md" className={filled ? 'ef-anim-pop-in' : ''} style={{
                                opacity: filled ? 1 : 0.65,
                                border: filled ? '2px solid var(--primary)' : '2px dashed var(--border-subtle)'
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
                                <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {SLOT_DESCRIPTIONS[slot]}
                                </p>
                            </EfPanel>
                        );
                    })}
                </div>

                {legends && legends.length > 0 && (
                    <EfPanel variant="elev" padding="md">
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                            Lendas Canonizadas ({legends.length})
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Jogadores eternizados pelo clube. Suas histórias persistem entre saves.
                        </p>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default ClubGalleryView;
