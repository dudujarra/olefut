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

import React, { useState } from 'react';
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
    const [collapsed, setCollapsed] = useState(false);

    if (!gameState.started) return null;
    if (gameState.view === 'start' || gameState.view === 'tutorial') return null;

    const items = gameState.mode === 'player' ? NAV_ITEMS_PLAYER : NAV_ITEMS_MANAGER;
    const currentView = gameState.view;

    return (
        <>
            {/* Burger button — 16-bit metal toggle */}
            <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle menu"
                style={{
                    position: 'fixed',
                    top: '8px',
                    left: '8px',
                    zIndex: 999,
                    background: '#1E2124',
                    color: '#FFD700',
                    border: '3px solid',
                    borderColor: '#4A5059 #111417 #111417 #4A5059',
                    borderRadius: '0px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.8rem',
                    boxShadow: '2px 2px 0 #000'
                }}
            >
                {collapsed ? '☰' : '✕'}
            </button>

            <nav
                className={`elifoot-sidebar ${collapsed ? 'collapsed' : ''}`}
                style={{
                    position: 'fixed',
                    left: collapsed ? '-200px' : '0',
                    top: 0,
                    bottom: 0,
                    width: '180px',
                    background: '#111417',
                    borderRight: '4px solid #4A5059',
                    padding: '3.5rem 8px 16px',
                    transition: 'left 200ms ease-out',
                    zIndex: 998,
                    overflowY: 'auto',
                    boxShadow: '8px 0 0 rgba(0,0,0,0.6)'
                }}
            >
                {/* Mode label */}
                <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.5rem',
                    color: '#888',
                    padding: '0 8px 12px',
                    borderBottom: '2px solid #333',
                    marginBottom: '12px'
                }}>
                    {gameState.mode === 'player' ? '⚽ JOGADOR' : '🧑‍💼 TÉCNICO'}
                </div>

                {items.map(item => {
                    const isActive = currentView === item.view;
                    return (
                        <div
                            key={item.view}
                            onClick={() => { changeView(item.view); setCollapsed(true); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '10px 8px',
                                marginBottom: '2px',
                                cursor: 'pointer',
                                background: isActive ? '#1E2124' : 'transparent',
                                borderLeft: isActive ? '4px solid #FFD700' : '4px solid transparent',
                                borderRight: isActive ? '2px solid #4A5059' : '2px solid transparent',
                                boxSizing: 'border-box',
                                transition: 'background 0.1s, border-left-color 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = '#1A1C20';
                                    e.currentTarget.style.borderLeftColor = '#555';
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
                                color: isActive ? '#FFD700' : '#888',
                                textShadow: isActive ? '1px 1px 0 #000' : 'none'
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </nav>
        </>
    );
}

export default Sidebar;
