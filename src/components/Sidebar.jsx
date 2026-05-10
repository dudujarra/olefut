/**
 * Sidebar — SPEC-099 Persistent Nav
 *
 * Always visible nav. Reduces 30-40 cliques/session.
 * Mobile: collapses to burger menu.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfButton } from './ui/EfButton';

const NAV_ITEMS_MANAGER = [
    { view: 'dashboard',    icon: '🏠', label: 'Dashboard' },
    { view: 'squad',        icon: '👥', label: 'Plantel' },
    { view: 'market',       icon: '🛒', label: 'Mercado' },
    { view: 'standings',    icon: '📊', label: 'Tabela' },
    { view: 'achievements', icon: '🏆', label: 'Conquistas' },
    { view: 'press',        icon: '🎙️', label: 'Coletiva' },
    { view: 'shop',         icon: '🛍️', label: 'Loja' },
    { view: 'rivalries',    icon: '⚔️', label: 'Rivalidades' },
    { view: 'chronicle',    icon: '📜', label: 'Crônica' },
    { view: 'saves',        icon: '💾', label: 'Saves' },
    { view: 'autoplay',     icon: '🤖', label: 'AutoPlay' }
];

const NAV_ITEMS_PLAYER = [
    { view: 'player_dashboard', icon: '🏠', label: 'Dashboard' },
    { view: 'standings',        icon: '📊', label: 'Tabela' },
    { view: 'achievements',     icon: '🏆', label: 'Conquistas' },
    { view: 'saves',            icon: '💾', label: 'Saves' }
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
            {/* Burger button mobile */}
            <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle menu"
                style={{
                    position: 'fixed',
                    top: '0.5rem',
                    left: '0.5rem',
                    zIndex: 999,
                    background: 'var(--accent)',
                    color: '#0F1A14',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
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
                    background: 'rgba(15, 26, 20, 0.95)',
                    borderRight: '2px solid var(--accent)',
                    padding: '3rem 0.5rem 1rem',
                    transition: 'left 200ms ease-out',
                    zIndex: 998,
                    overflowY: 'auto'
                }}
            >
                <div style={{ marginBottom: '1rem', padding: '0 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {gameState.mode === 'player' ? '⚽ MODO JOGADOR' : '🧑‍💼 MODO TÉCNICO'}
                </div>

                {items.map(item => (
                    <EfButton
                        key={item.view}
                        variant={currentView === item.view ? 'primary' : 'secondary'}
                        onClick={() => { changeView(item.view); setCollapsed(true); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            textAlign: 'left',
                            marginBottom: '4px'
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                        <span>{item.label}</span>
                    </EfButton>
                ))}
            </nav>
        </>
    );
}

export default Sidebar;
