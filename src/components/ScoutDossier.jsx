/**
 * ScoutDossier — SPEC-071
 *
 * Modal completo dossier scout com side-by-side comparison até 4 jogadores.
 */

import React, { useState } from 'react';
import { EfModal } from './ui/EfModal';
import { EfButton } from './ui/EfButton';

function fitScore(player, teamNeed) {
    if (!player || !teamNeed) return 50;
    const posMatch = player.position === teamNeed.position ? 30 : 0;
    const ovr = (player.attrs?.atk ?? 60) + (player.attrs?.def ?? 60) + (player.attrs?.mid ?? 60);
    const ovrScore = Math.min(50, ovr / 6);
    const ageScore = player.age <= 25 ? 20 : player.age >= 32 ? 5 : 15;
    return Math.round(posMatch + ovrScore + ageScore);
}

function aiOpinion(player) {
    const ovr = ((player.attrs?.atk ?? 60) + (player.attrs?.def ?? 60) + (player.attrs?.mid ?? 60)) / 3;
    const age = player.age || 25;

    if (ovr >= 85 && age <= 24) return { tag: 'TALENTO RARO', color: '#FFD700', desc: 'Joia. Comprar antes que outro perceba.' };
    if (ovr >= 80 && age <= 28) return { tag: 'ELITE', color: '#7B2CBF', desc: 'Pronto pra liga top. Caro mas vale.' };
    if (ovr >= 70 && age <= 30) return { tag: 'BOA OPÇÃO', color: '#6ABC3A', desc: 'Sólido. Reforço razoável pro orçamento.' };
    if (ovr >= 60) return { tag: 'OK', color: '#3A7DCE', desc: 'Mediano. Considere se barato.' };
    return { tag: 'EVITAR', color: '#D62828', desc: 'Abaixo do nível. Não recomendo.' };
}

export function ScoutDossier({ player, onClose, onSign, comparePlayers = [] }) {
    if (!player) return null;

    const opinion = aiOpinion(player);

    const renderPlayer = (p, isMain = false) => (
        <div style={{
            border: `1px solid ${isMain ? 'var(--accent)' : 'var(--border-subtle, var(--ef-color-border-subtle))'}`,
            borderRadius: '4px',
            padding: '0.75rem',
            flex: 1,
            minWidth: '180px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#6ABC3A',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: 'white'
                }}>
                    {p.position}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.age} anos • {p.nationality || 'BR'}</div>
                </div>
            </div>
            <div style={{ fontSize: '0.78rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>⚔️ ATK: <strong>{p.attrs?.atk ?? '-'}</strong></div>
                <div>🛡️ DEF: <strong>{p.attrs?.def ?? '-'}</strong></div>
                <div>🎯 MID: <strong>{p.attrs?.mid ?? '-'}</strong></div>
                <div>💰 R$ {(p.value || 0).toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Wage: R$ {(p.wage || 0).toLocaleString('pt-BR')}/sem
            </div>
        </div>
    );

    return (
        <EfModal title="🔍 Dossier Scout" onClose={onClose}>
            {/* AI Opinion */}
            <div style={{
                padding: '0.75rem',
                background: `${opinion.color}22`,
                border: `2px solid ${opinion.color}`,
                borderRadius: '4px',
                marginBottom: '1rem'
            }}>
                <div style={{ fontSize: '0.7rem', color: opinion.color, fontWeight: 700, letterSpacing: '0.05em' }}>
                    OPINIÃO DO OLHEIRO
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: opinion.color, margin: '4px 0' }}>
                    {opinion.tag}
                </div>
                <div style={{ fontSize: '0.85rem' }}>{opinion.desc}</div>
            </div>

            {/* Main + comparisons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {renderPlayer(player, true)}
                {comparePlayers.slice(0, 3).map((p, i) => (
                    <React.Fragment key={i}>
                        {renderPlayer(p, false)}
                    </React.Fragment>
                ))}
            </div>

            {onSign && (
                <EfButton
                    variant="primary"
                    onClick={() => onSign(player)}
                    style={{ width: '100%' }}
                >
                    💼 Fazer Proposta R$ {(player.value || 0).toLocaleString('pt-BR')}
                </EfButton>
            )}
        </EfModal>
    );
}

export default ScoutDossier;
