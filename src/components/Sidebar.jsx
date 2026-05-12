/**
 * Sidebar — SPEC-099 Persistent Nav
 *
 * Always visible nav. Reduces 30-40 cliques/session.
 * Mobile: collapses to burger menu.
 *
 * 16-BIT BRUTALIST ARCADE AESTHETIC
 * Resembles the bottom nav bar from SNES football games:
 * [SQUAD] [TACTICS] [TEAM] [GAME] [EXIT]
 *
 * SPEC-172: inline styles → .ef-sidebar* classes; hover state via CSS :hover
 * (no more onMouseEnter/onMouseLeave JS handlers).
 */

import { useGame } from '../context/GameContext';
import {
    House, Users, ShoppingCart, ListNumbers, Trophy,
    MicrophoneStage, Storefront, Sword, Scroll, FloppyDisk, Robot, GraduationCap,
    TreeStructure, SoccerBall, IdentificationBadge
} from '@phosphor-icons/react';

// AKITA-234: Tutorial link adicionado pra replayability (audit gap fix).
const NAV_ITEMS_MANAGER = [
    { view: 'dashboard',    icon: House, label: 'DASHBOARD' },
    { view: 'squad',        icon: Users, label: 'PLANTEL' },
    { view: 'market',       icon: ShoppingCart, label: 'MERCADO' },
    { view: 'standings',    icon: ListNumbers, label: 'TABELA' },
    { view: 'achievements', icon: Trophy, label: 'CONQUISTAS' },
    { view: 'press',        icon: MicrophoneStage, label: 'COLETIVA' },
    { view: 'shop',         icon: Storefront, label: 'LOJA' },
    { view: 'rivalries',    icon: Sword, label: 'RIVALIDADES' },
    { view: 'lineage',      icon: TreeStructure, label: 'LINHAGEM' },
    { view: 'chronicle',    icon: Scroll, label: 'CRÔNICA' },
    { view: 'saves',        icon: FloppyDisk, label: 'SAVES' },
    { view: 'autoplay',     icon: Robot, label: 'AUTOPLAY' },
    { view: 'tutorial',     icon: GraduationCap, label: 'TUTORIAL' }
];

const NAV_ITEMS_PLAYER = [
    { view: 'player_dashboard', icon: House, label: 'DASHBOARD' },
    { view: 'standings',        icon: ListNumbers, label: 'TABELA' },
    { view: 'achievements',     icon: Trophy, label: 'CONQUISTAS' },
    { view: 'lineage',          icon: TreeStructure, label: 'LINHAGEM' },
    { view: 'saves',            icon: FloppyDisk, label: 'SAVES' },
    { view: 'tutorial',         icon: GraduationCap, label: 'TUTORIAL' }
];

export function Sidebar() {
    const { gameState, changeView } = useGame();

    if (!gameState.started) return null;
    if (gameState.view === 'start' || gameState.view === 'tutorial') return null;

    const items = gameState.mode === 'player' ? NAV_ITEMS_PLAYER : NAV_ITEMS_MANAGER;
    const currentView = gameState.view;

    // Mode label — semantic icon (Phosphor) replacing emoji decoration
    const ModeIcon = gameState.mode === 'player' ? SoccerBall : IdentificationBadge;
    const modeLabel = gameState.mode === 'player' ? 'MODO JOGADOR' : 'MODO TÉCNICO';

    return (
        <aside className="elifoot-sidebar ef-sidebar">
            <div className="ef-sidebar__inner">
                {/* Mode label */}
                <div className="ef-sidebar__mode">
                    <ModeIcon size={12} weight="fill" style={{ verticalAlign: 'middle', marginRight: '4px' }} aria-hidden />
                    {modeLabel}
                </div>

                {items.map(item => {
                    const isActive = currentView === item.view;
                    const IconComponent = item.icon;
                    const itemClass = isActive
                        ? 'ef-sidebar__item ef-sidebar__item--active'
                        : 'ef-sidebar__item';
                    return (
                        <div
                            key={item.view}
                            className={itemClass}
                            onClick={() => changeView(item.view)}
                        >
                            <span className="ef-sidebar__icon">
                                <IconComponent size={20} weight={isActive ? "fill" : "regular"} />
                            </span>
                            <span className="ef-sidebar__label">
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
