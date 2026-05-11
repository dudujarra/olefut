/**
 * Sidebar — SPEC-099 Persistent Nav
 *
 * Always visible nav. Reduces 30-40 cliques/session.
 * Mobile: collapses to burger menu.
 * 
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 * Resembles the bottom nav bar from SNES football games:
 * [SQUAD] [TACTICS] [TEAM] [GAME] [EXIT]
 */

import React from 'react';
import { useGame } from '../context/GameContext';

const NAV_ITEMS_MANAGER = [
    { view: 'dashboard',    icon: '🏠', label: 'DASHBOARD' },
    { view: 'squad',        icon: '👥', label: 'PLANTEL' },
    { view: 'market',       icon: '🛒', label: 'MERCADO' },
    { view: 'standings',    icon: '📊', label: 'TABELA' },
    { view: 'achievements', icon: '🏆', label: 'CONQUISTAS' },
    { view: 'press',        icon: '🎙️', label: 'COLETIVA' },
    { view: 'shop',         icon: '🛍️', label: 'LOJA' },
    { view: 'rivalries',    icon: '⚔️', label: 'RIVALIDADES' },
    { view: 'chronicle',    icon: '📜', label: 'CRÔNICA' },
    { view: 'saves',        icon: '💾', label: 'SAVES' },
    { view: 'autoplay',     icon: '🤖', label: 'AUTOPLAY' }
];

const NAV_ITEMS_PLAYER = [
    { view: 'player_dashboard', icon: '🏠', label: 'DASHBOARD' },
    { view: 'standings',        icon: '📊', label: 'TABELA' },
    { view: 'achievements',     icon: '🏆', label: 'CONQUISTAS' },
    { view: 'saves',            icon: '💾', label: 'SAVES' }
];

export function Sidebar() {
    const { gameState, changeView } = useGame();

    if (!gameState.started) return null;
    if (gameState.view === 'start' || gameState.view === 'tutorial') return null;

    const items = gameState.mode === 'player' ? NAV_ITEMS_PLAYER : NAV_ITEMS_MANAGER;
    const currentView = gameState.view;

    return (
        <aside
            className="elifoot-sidebar"
            style={{
                width: '180px',
                minWidth: '180px',
                background: '#0B0D0F', // Slightly darker than main bg to recede
                borderRight: '4px solid #4A5059',
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                position: 'sticky',
                top: 0,
                zIndex: 998,
                overflowY: 'auto'
            }}
        >
            <div style={{
                padding: '24px 8px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* Mode label */}
                <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.5rem',
                    color: '#888',
                    padding: '0 8px 12px',
                    borderBottom: '2px solid #333',
                    marginBottom: '12px',
                    textAlign: 'center',
                    letterSpacing: '0.05em'
                }}>
                    {gameState.mode === 'player' ? '⚽ JOGADOR' : '🧑‍💼 TÉCNICO'}
                </div>

                {items.map(item => {
                    const isActive = currentView === item.view;
                    return (
                        <div
                            key={item.view}
                            onClick={() => changeView(item.view)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '12px 10px',
                                cursor: 'pointer',
                                background: isActive ? '#1E2124' : 'transparent',
                                borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                                borderRight: isActive ? '2px solid #4A5059' : '2px solid transparent',
                                boxSizing: 'border-box',
                                transition: 'background 0.1s, border-left-color 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = '#14171A';
                                    e.currentTarget.style.borderLeftColor = '#333';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderLeftColor = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1rem', filter: isActive ? 'none' : 'grayscale(0.5)' }}>{item.icon}</span>
                            <span style={{
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '0.5rem',
                                color: isActive ? 'var(--primary)' : '#888',
                                textShadow: isActive ? '1px 1px 0 #000' : 'none'
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

export default Sidebar;
