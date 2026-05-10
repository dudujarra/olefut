/**
 * LiveOpsBanner — SPEC-098
 *
 * Banner top dashboard com evento ativo da semana.
 */

import React from 'react';
import { useGame } from '../context/GameContext';
import { getActiveLiveOps } from '../services/LiveOpsService';

export function LiveOpsBanner() {
    const { getEngine } = useGame();
    const engine = getEngine();
    if (!engine) return null;

    const events = getActiveLiveOps(engine.currentWeek);
    if (events.length === 0) return null;

    return (
        <div style={{ marginBottom: '0.5rem' }}>
            {events.map(ev => (
                <div key={ev.id} style={{
                    padding: '0.5rem 0.75rem',
                    background: '#3A2C11',
                    border: '1px solid rgba(247,181,56,0.4)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>{ev.emoji}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)' }}>
                            {ev.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {ev.desc}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LiveOpsBanner;
