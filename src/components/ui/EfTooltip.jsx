/**
 * EfTooltip — Stitch component (refactor de Tooltip.jsx legacy)
 *
 * Hover delay 200ms, fade-in 100ms, beveled.
 */

import React, { useState, useRef, useLayoutEffect } from 'react';

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

    if (!content) return children;

    const HEADER_COLOR = {
        info: 'var(--ef-color-func-info)',
        success: 'var(--ef-color-func-success)',
        warning: 'var(--ef-color-func-warning)',
        danger: 'var(--ef-color-func-danger)'
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
                        padding: 'var(--ef-space-2) var(--ef-space-3)',
                        background: 'var(--ef-bg-elev)',
                        color: 'var(--ef-text-hi)',
                        fontFamily: 'var(--ef-font-family-body)',
                        fontSize: '13px',
                        lineHeight: 1.4,
                        border: '2px solid',
                        borderColor: 'var(--ef-bevel-light) var(--ef-bevel-dark) var(--ef-bevel-dark) var(--ef-bevel-light)',
                        boxShadow: 'var(--ef-shadow-drop-lg)',
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
