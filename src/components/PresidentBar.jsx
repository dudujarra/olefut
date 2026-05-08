/**
 * PresidentBar — v1.2 (AKITA-053)
 *
 * Barra de paciência presidente + cor por threshold.
 * Thresholds: 80 carta branca, 50 cobrança, 25 ultimato.
 */

import React from 'react';
import { useRelationships } from '../hooks/useRelationships';

const THRESHOLD_LABELS = [
    { min: 80, label: '🟢 Carta Branca', color: 'var(--primary)', mood: 'Presidente confia plenamente' },
    { min: 50, label: '🟡 Atento', color: 'var(--accent)', mood: 'Presidente acompanha de perto' },
    { min: 25, label: '🟠 Cobrança', color: 'orange', mood: 'Presidente cobra resultados' },
    { min: 0, label: '🔴 Ultimato', color: 'var(--danger)', mood: 'Presidente avalia demissão' }
];

export function PresidentBar() {
    const { getCoachReputation, getPresidentPatience } = useRelationships();
    const trust = getCoachReputation();
    const patience = getPresidentPatience();

    const status = THRESHOLD_LABELS.find(t => patience >= t.min) || THRESHOLD_LABELS[3];

    return (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>👔 Diretoria</h4>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: status.color }}>
                    {status.label}
                </span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>Paciência</span>
                    <span>{patience}/100</span>
                </div>
                <div style={{
                    height: '8px',
                    background: 'var(--bg-panel-solid)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${patience}%`,
                        height: '100%',
                        background: status.color,
                        transition: 'width 0.3s'
                    }} />
                </div>
            </div>

            <div style={{ marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>Confiança</span>
                    <span style={{ color: trust >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                        {trust >= 0 ? '+' : ''}{trust}
                    </span>
                </div>
                <div style={{
                    height: '6px',
                    background: 'var(--bg-panel-solid)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: 'var(--text-muted)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: trust >= 0 ? '50%' : `${50 + (trust / 2)}%`,
                        height: '100%',
                        width: `${Math.abs(trust) / 2}%`,
                        background: trust >= 0 ? 'var(--primary)' : 'var(--danger)',
                        transition: 'all 0.3s'
                    }} />
                </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {status.mood}
            </p>
        </div>
    );
}

export default PresidentBar;
