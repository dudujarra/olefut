import { memo } from 'react';
import { HIGH_END_FACES } from '../assets/faces/high_end';

function getFaceIndex(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % HIGH_END_FACES.length;
}

// SPEC-169 (Bloco 3.3): memoizado — avatar aparece em listas de jogadores
// (market, squad, scout); name+size raramente mudam por linha.
function PlayerAvatarImpl({ name, size = 28 }) {
    const faceIndex = getFaceIndex(name);
    const faceSrc = HIGH_END_FACES[faceIndex];

    return (
        <img
            src={faceSrc}
            alt={`Avatar ${name}`}
            className="player-avatar ef-avatar-pixel"
            width={size}
            height={size}
        />
    );
}

export const PlayerAvatar = memo(PlayerAvatarImpl);
PlayerAvatar.displayName = 'PlayerAvatar';

export function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function getAvatarColor(name) {
    if (!name) return '#40BAF7';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - color.length) + color;
}
