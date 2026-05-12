/**
 * MatchBallSprite — SPEC-B1.3
 *
 * Sprite animado de bola sobre o pitch-bg do match log.
 * Decorativo (não event-driven nesta versao). CSS keyframes loop ~6s
 * percorrendo o campo lateralmente.
 *
 * Pode receber prop intensity ('idle'|'active'|'goal') no futuro
 * para sincronizar com eventos do match — por ora purely decorativo.
 */

import { SoccerBall } from '@phosphor-icons/react';

// ─── pure helpers exportados ───

export function getBallAnimationDuration(intensity = 'idle') {
    switch (intensity) {
        case 'active': return '3s';
        case 'goal':   return '0.8s';
        case 'idle':
        default:       return '6s';
    }
}

export function getBallSize(intensity = 'idle') {
    switch (intensity) {
        case 'goal':   return 28;
        case 'active': return 22;
        case 'idle':
        default:       return 18;
    }
}

export function MatchBallSprite({ intensity = 'idle', visible = true }) {
    if (!visible) return null;
    const duration = getBallAnimationDuration(intensity);
    const size = getBallSize(intensity);
    return (
        <div
            className="ef-match-ball-sprite"
            aria-hidden="true"
            style={{
                position: 'absolute',
                bottom: '8px',
                left: '0',
                pointerEvents: 'none',
                animation: `ef-ball-travel ${duration} ease-in-out infinite alternate`,
                zIndex: 2,
                color: '#FDFBF7',
                opacity: 0.85,
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))',
            }}
        >
            <SoccerBall size={size} weight="fill" />
        </div>
    );
}

export default MatchBallSprite;
