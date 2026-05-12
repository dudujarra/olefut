/**
 * EfTooltip — Stitch component (refactor de Tooltip.jsx legacy)
 *
 * Hover delay 200ms, fade-in 100ms, beveled.
 * 16-bit Brutalist Arcade edition.
 */

import { useState, useRef, useLayoutEffect } from 'react';

export function EfTooltip({
    content,
    children,
    position = 'auto',
    delay = 200,
    color = 'info',
    className = ''
}) {
    const [visible, setVisible] = useState(false);
    const [computedPos, setComputedPos] = useState('top');
    const triggerRef = useRef(null);
    const bubbleRef = useRef(null);
    const timerRef = useRef(null);

    const handleEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(true), delay);
    };

    const handleLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(false);
    };

    // BUG-081 (SPEC-158): aceitável — useLayoutEffect mede DOM (getBoundingClientRect).
    // Só roda após mount/visible; impossível derivar via useMemo sem render-time DOM.
    /* eslint-disable react-hooks/set-state-in-effect */
    useLayoutEffect(() => {
        if (!visible || !triggerRef.current || !bubbleRef.current) return;
        if (position !== 'auto') {
            setComputedPos(position);
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        const h = bubbleRef.current.offsetHeight;
        if (rect.top < h + 16) setComputedPos('bottom');
        else setComputedPos('top');
    }, [visible, position]);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (!content) return children;

    const HEADER_COLOR = {
        info: '#40BAF7',
        success: '#39FF14',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    return (
        <span
            ref={triggerRef}
            className={`ef-tooltip-trigger ${className}`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onFocus={handleEnter}
            onBlur={handleLeave}
            style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
        >
            {children}
            {visible && (
                <span
                    ref={bubbleRef}
                    role="tooltip"
                    className={`ef-tooltip-bubble ef-tooltip-pos-${computedPos}`}
                    style={{
                        position: 'absolute',
                        zIndex: 10000,
                        minWidth: '180px',
                        maxWidth: '320px',
                        padding: '8px 12px',
                        background: '#1E2124',
                        color: '#E2E8F0',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '0.45rem',
                        lineHeight: 1.6,
                        border: '4px solid',
                        borderColor: '#4A5059 #111417 #111417 #4A5059',
                        boxShadow: '4px 8px 0 #040805',
                        borderTopWidth: '4px',
                        borderTopColor: HEADER_COLOR[color] || HEADER_COLOR.info,
                        pointerEvents: 'none',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        animation: 'ef-tooltip-fade 100ms steps(2) forwards',
                        ...(computedPos === 'top'
                            ? { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
                            : { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' })
                    }}
                >
                    {content}
                </span>
            )}
        </span>
    );
}

export default EfTooltip;
