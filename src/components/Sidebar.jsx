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

import { useGame } from '../context/GameContext';
import { 
    House, Users, ShoppingCart, ListNumbers, Trophy, 
    MicrophoneStage, Storefront, Sword, Scroll, FloppyDisk, Robot 
} from '@phosphor-icons/react';

const NAV_ITEMS_MANAGER = [
    { view: 'dashboard',    icon: House, label: 'DASHBOARD' },
    { view: 'squad',        icon: Users, label: 'PLANTEL' },
    { view: 'market',       icon: ShoppingCart, label: 'MERCADO' },
    { view: 'standings',    icon: ListNumbers, label: 'TABELA' },
    { view: 'achievements', icon: Trophy, label: 'CONQUISTAS' },
    { view: 'press',        icon: MicrophoneStage, label: 'COLETIVA' },
    { view: 'shop',         icon: Storefront, label: 'LOJA' },
    { view: 'rivalries',    icon: Sword, label: 'RIVALIDADES' },
    { view: 'chronicle',    icon: Scroll, label: 'CRÔNICA' },
    { view: 'saves',        icon: FloppyDisk, label: 'SAVES' },
    { view: 'autoplay',     icon: Robot, label: 'AUTOPLAY' }
];

const NAV_ITEMS_PLAYER = [
    { view: 'player_dashboard', icon: House, label: 'DASHBOARD' },
    { view: 'standings',        icon: ListNumbers, label: 'TABELA' },
    { view: 'achievements',     icon: Trophy, label: 'CONQUISTAS' },
    { view: 'saves',            icon: FloppyDisk, label: 'SAVES' }
];

export function Sidebar() {
    const { gameState, changeView } = useGame();

    if (!gameState.started) return null;
    if (gameState.view === 'start' || gameState.view === 'tutorial') return null;

    const items = gameState.mode === 'player' ? NAV_ITEMS_PLAYER : NAV_ITEMS_MANAGER;
    const currentView = gameState.view;

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    return (
        <aside
            className="elifoot-sidebar"
            style={{
                width: '180px',
                minWidth: '180px',
                background: colors.bg,
                borderRight: `2px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                position: 'sticky',
                top: 0,
                zIndex: 998,
                overflowY: 'auto',
                boxShadow: `4px 0 20px #040805`
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
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: colors.textMuted,
                    padding: '0 8px 12px',
                    borderBottom: `1px solid ${colors.border}`,
                    marginBottom: '12px',
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                    fontWeight: 'bold'
                }}>
                    {gameState.mode === 'player' ? '⚽ MODO JOGADOR' : '🧑‍💼 MODO TÉCNICO'}
                </div>

                {items.map(item => {
                    const isActive = currentView === item.view;
                    const IconComponent = item.icon;
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
                                backgroundColor: isActive ? colors.panelBg : 'transparent',
                                borderLeft: isActive ? `4px solid ${colors.accent}` : '4px solid transparent',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = '#0E1F14';
                                    e.currentTarget.style.borderLeftColor = colors.border;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderLeftColor = 'transparent';
                                }
                            }}
                        >
                            <span style={{ 
                                color: isActive ? colors.accent : colors.textMuted,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <IconComponent size={20} weight={isActive ? "fill" : "regular"} />
                            </span>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.75rem',
                                color: isActive ? colors.text : colors.textMuted,
                                fontWeight: isActive ? 'bold' : 'normal'
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
