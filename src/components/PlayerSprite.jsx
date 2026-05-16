import React from 'react';
import './PlayerSprite.css';

/**
 * PlayerSprite Component
 * Renders an animated 16-bit player sprite using CSS steps()
 * 
 * @param {Object} props
 * @param {string} props.action - The action to perform (sprint, header, bicycle, tackle, dribble, celebration, save, freekick)
 * @param {boolean} props.isFired - Whether to use the right column 'fire' versions
 * @param {string} props.direction - 'right' (default) or 'left'
 * @param {string} props.filterColor - CSS filter to apply for team colors (optional)
 * @param {number} props.scale - Scale factor (default 1)
 */
export default function PlayerSprite({ 
    action = 'sprint', 
    isFired = false, 
    direction = 'right',
    filterColor = null,
    scale = 1
}) {
    const classNames = [
        'ef-player-sprite',
        `ef-sprite-action--${action}`,
        isFired ? 'ef-sprite-modifier--fire' : '',
        direction === 'left' ? 'ef-player-sprite--left' : ''
    ].filter(Boolean).join(' ');

    const styles = {
        transform: `scale(${scale}) ${direction === 'left' ? 'scaleX(-1)' : ''}`,
        filter: filterColor || 'none'
    };

    return (
        <div className={classNames} style={styles}></div>
    );
}
