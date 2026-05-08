/**
 * OldTeammatesWidget — v1.2 (AKITA-053)
 *
 * Lista ex-companheiros disponíveis no mercado pós-transição jogador→técnico.
 * Bias positivo de aceitação (visualmente destacado).
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { useCareer } from '../hooks/useCareer';

export function OldTeammatesWidget() {
    const { getEngine } = useGame();
    const { proPlayer, managerCareer } = useCareer();
    const engine = getEngine();

    if (!proPlayer || !proPlayer.retired) return null;
    if (!managerCareer) return null;

    // Resolve ex-companheiros: jogadores que estiveram em mesmos clubes que ProPlayer
    const oldClubs = proPlayer.clubsPlayed || [];
    if (oldClubs.length === 0) return null;

    const exTeammates = [];
    for (const team of engine.teams || []) {
        for (const p of team.squad || []) {
            // Heurística: jogador esteve em mesmos clubes em alguma fase
            // (no v1.2 simples: assume mesma idade range + mesmo nível seria ex-companheiro)
            // Mais elaborado em v1.2.1: track player.clubHistory
            if (p.clubHistory?.some?.(c => oldClubs.includes(c))) {
                exTeammates.push({ player: p, currentClubId: team.id, currentClubName: team.name });
            }
        }
    }

    if (exTeammates.length === 0) {
        return (
            <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}>👥 Ex-Companheiros</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Nenhum ex-companheiro ativo encontrado. Eles também envelheceram.
                </p>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                👥 Ex-Companheiros Ativos ({exTeammates.length})
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Aceitação +30% em negociações com {proPlayer.name}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                {exTeammates.slice(0, 8).map(({ player, currentClubId, currentClubName }) => (
                    <div key={player.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.82rem'
                    }}>
                        <span>
                            <strong>{player.name}</strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                                {player.position} • OVR {player.ovr || '?'}
                            </span>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {currentClubName}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OldTeammatesWidget;
