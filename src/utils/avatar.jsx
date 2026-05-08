// P2-10: Avatar iniciais + cor deterministic via name hash
const COLORS = [
    '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
];

export function getInitials(name = '') {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

export function PlayerAvatar({ name, size = 28 }) {
    const initials = getInitials(name);
    const color = getAvatarColor(name);
    return (
        <span
            className="player-avatar"
            style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
            aria-label={`Avatar ${name}`}
        >
            {initials}
        </span>
    );
}
