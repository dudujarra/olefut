/**
 * EfPanel — SNES 16-bit Brutalist Arcade Container
 *
 * Heavy metal beveled container with zero transparency.
 * Variants: default | elev | sunk | hero | warning | danger
 */

export function EfPanel({
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
    return (
        <div
            onClick={onClick}
            className={`ef-panel ef-panel-${variant} ef-panel-p-${padding} ${className}`.trim()}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            {title && (
                <div className="ef-panel-header" style={headerColor ? { background: headerColor } : {}}>
                    {icon && <span>{icon}</span>}
                    {title}
                </div>
            )}
            <div className={`ef-panel-content`}>
                {children}
            </div>
        </div>
    );
}

export default EfPanel;
