/**
 * PresidentBar — v2.0 (AKITA-142)
 *
 * Barra de tensão da diretoria usando engine.boardTension (-100..+100).
 * Thresholds adaptados ao range real do BoardTensionSystem.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel } from './ui/EfPanel';

const TENSION_LABELS = [
    { min: 70,  label: '🟢 Carta Branca', color: 'var(--primary)', mood: 'Diretoria encantada. Faça o que quiser.' },
    { min: 40,  label: '🟢 Confiante', color: 'var(--primary)', mood: 'Presidente satisfeito com o trabalho.' },
    { min: 10,  label: '🟡 Atento', color: 'var(--accent)', mood: 'Presidente acompanha de perto.' },
    { min: -20, label: '🟠 Cobrança', color: 'orange', mood: 'Presidente cobra resultados urgentes.' },
    { min: -60, label: '🔴 Ultimato', color: 'var(--danger)', mood: 'Presidente avalia demissão.' },
    { min: -101, label: '💀 Demissão', color: 'var(--danger)', mood: 'Seu emprego está por um fio!' }
];

export function PresidentBar() {
    const { getEngine } = useGame();
    const engine = getEngine();
    if (!engine) return null;

    const tension = engine.boardTension ?? 50;
    const boardConf = engine.board?.confidence ?? 60;
    const status = TENSION_LABELS.find(t => tension >= t.min) || TENSION_LABELS[TENSION_LABELS.length - 1];

    // Normalize tension (-100..+100) to percentage (0..100) for the bar
    const barPct = Math.max(0, Math.min(100, (tension + 100) / 2));

    return (
        <EfPanel variant="elev" padding="md" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>🏛️ Diretoria</h4>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: status.color }}>
                    {status.label}
                </span>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>Tensão Board</span>
                    <span style={{ color: status.color }}>{tension > 0 ? '+' : ''}{tension}</span>
                </div>
                <div style={{
                    height: '8px',
                    background: 'var(--bg-panel-solid)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${barPct}%`,
                        height: '100%',
                        background: status.color,
                        transition: 'width 0.3s'
                    }} />
                </div>
            </div>

            {engine.board && (
                <div style={{ marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        <span>Confiança</span>
                        <span>{boardConf}%</span>
                    </div>
                    <div style={{
                        height: '6px',
                        background: 'var(--bg-panel-solid)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${boardConf}%`,
                            height: '100%',
                            background: boardConf >= 60 ? 'var(--primary)' : boardConf >= 30 ? 'var(--accent)' : 'var(--danger)',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                </div>
            )}

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {status.mood}
            </p>
        </EfPanel>
    );
}

export default PresidentBar;
