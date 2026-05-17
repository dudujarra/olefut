/**
 * EfPanel — SNES 16-bit Brutalist Arcade Container
 *
 * Heavy metal beveled container with zero transparency.
 * Variants: default | elev | sunk | hero | warning | danger
 *
 * SPEC-169 (Bloco 3.3): wrapped em React.memo. Panel é container leaf
 * que aparece dezenas de vezes por tela (dashboard tem 8+ panels).
 * children muda quando algo dentro muda; com memo, panels-irmãos
 * estáveis não re-renderizam.
 */

import { memo } from 'react';

function EfPanelImpl({
    variant = 'default',
    title,
    icon,
    headerColor,
    padding = 'md',
    children,
    onClick,
    className = '',
    style = {}
}) {
    // Ensure we don't pass `style` down blindly to avoid object spreads
    const panelStyle = {};
    if (headerColor) panelStyle['--panel-header-color'] = headerColor;

    return (
        <div
            onClick={onClick}
            className={`ef-panel ef-panel-${variant} ef-panel-p-${padding} ${onClick ? 'ef-panel-clickable' : ''} ${className}`.trim()}
            style={Object.keys(panelStyle).length > 0 ? panelStyle : undefined}
        >
            {title && (
                <div className={`ef-panel-header ${headerColor ? 'ef-panel-header--custom' : ''}`}>
                    {icon && <span>{icon}</span>}
                    {title}
                </div>
            )}
            <div className="ef-panel-content">
                {children}
            </div>
        </div>
    );
}

export const EfPanel = memo(EfPanelImpl);
EfPanel.displayName = 'EfPanel';

export default EfPanel;
