import React, { useEffect, useState } from 'react';
import './MatchHighlightVideo.css';

/**
 * MatchHighlightVideo
 * An interactive 2D cinematic viewer that translates match events into 
 * beautiful 16-bit full frame sequences, inspired by ISSSD.
 * 
 * @param {Object} props
 * @param {Object} props.event - The current match event object from narration
 * @param {boolean} props.isHomeAttacking - Determines placement/team
 */
export default function MatchHighlightVideo({ event, isHomeAttacking = true }) {
    const [animState, setAnimState] = useState({
        imageSrc: null,
        isGoal: false,
        flash: false,
        showBanner: true
    });

    useEffect(() => {
        if (!event) return;

        const text = (event.text || '').toLowerCase();
        let imgSrc = null;
        let isGoal = false;

        // Cinematic Event Mapping based on text
        if (text.includes('gol') || text.includes('golaço')) {
            isGoal = true;
            // Depending on who attacks, show the respective celebration
            imgSrc = isHomeAttacking ? '/assets/sprites/isssd_red_goal.png' : '/assets/sprites/isssd_blue_goal.png';
        } else if (text.includes('falta') || text.includes('cartão') || text.includes('lesão')) {
            imgSrc = '/assets/sprites/isssd_foul.png';
        } else if (text.includes('juiz') || text.includes('árbitro') || text.includes('apita')) {
            imgSrc = '/assets/sprites/isssd_dog_referee.png';
        } else if (text.includes('chute') || text.includes('defesa') || text.includes('espalma') || text.includes('perigo')) {
            // General action scenes could just reuse the foul scene or a generic stadium scene. 
            // For now, let's show the referee dog looking concerned or just a tackle.
            imgSrc = '/assets/sprites/isssd_foul.png'; 
        }

        if (imgSrc) {
            setAnimState({
                imageSrc: imgSrc,
                isGoal,
                flash: isGoal,
                showBanner: true
            });

            // Clear flash after animation
            if (isGoal) {
                setTimeout(() => {
                    setAnimState(prev => ({ ...prev, flash: false }));
                }, 500);
            }
        } else {
            // If it's a generic pass, hide it.
            setAnimState(prev => ({ ...prev, imageSrc: null }));
        }

    }, [event, isHomeAttacking]);

    if (!event || !animState.imageSrc) return null;

    return (
        <div className={`ef-match-highlight-video ${animState.flash ? 'ef-match-highlight-video--flash' : ''}`}>
            {/* Full-screen cinematic pixel art background */}
            <img 
                src={animState.imageSrc} 
                alt="Highlight" 
                className="ef-match-highlight-video__cinematic-bg"
            />
            
            <div className="ef-match-highlight-video__overlay"></div>
            
            {animState.showBanner && (
                <div className="ef-match-highlight-video__banner">
                    {event.minute}' - {event.text}
                </div>
            )}

            {animState.isGoal && (
                <div className="ef-match-highlight-video__goal-text">GOL!</div>
            )}
        </div>
    );
}

