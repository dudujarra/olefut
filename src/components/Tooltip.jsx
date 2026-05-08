import React, { useState, useRef, useLayoutEffect } from 'react';

/**
 * Tooltip — Custom CSS-only tooltip primitive (zero deps)
 * Auto-positions to avoid viewport overflow.
 *
 * Usage:
 *   <Tooltip content="Force fisica do jogador">
 *     <span>FOR 75</span>
 *   </Tooltip>
 *
 * Props:
 *   - content: string|ReactNode — tooltip body
 *   - position: 'top'|'bottom'|'left'|'right'|'auto' (default 'auto')
 *   - delay: ms (default 300)
 *   - children: trigger element
 */
export function Tooltip({ content, position = 'auto', delay = 300, children, className = '' }) {
    const [visible, setVisible] = useState(false);
    const [computedPos, setComputedPos] = useState('top');
    const triggerRef = useRef(null);
    const bubbleRef = useRef(null);
    const showTimerRef = useRef(null);

    const handleMouseEnter = () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        showTimerRef.current = setTimeout(() => setVisible(true), delay);
    };

    const handleMouseLeave = () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        setVisible(false);
    };

    const handleFocus = () => setVisible(true);
    const handleBlur = () => setVisible(false);

    useLayoutEffect(() => {
        if (!visible || !triggerRef.current || !bubbleRef.current) return;
        if (position !== 'auto') {
            setComputedPos(position);
            return;
        }
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const bubbleHeight = bubbleRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;

        // Default top, but flip to bottom if cramped
        if (triggerRect.top < bubbleHeight + 16) {
            setComputedPos('bottom');
        } else if (viewportHeight - triggerRect.bottom < bubbleHeight + 16) {
            setComputedPos('top');
        } else {
            setComputedPos('top');
        }
    }, [visible, position]);

    if (!content) return children;

    return (
        <span
            ref={triggerRef}
            className={`tooltip-wrapper ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {children}
            {visible && (
                <span
                    ref={bubbleRef}
                    role="tooltip"
                    className={`tooltip-bubble tooltip-pos-${computedPos}`}
                >
                    {content}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
