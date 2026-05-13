/**
 * Tooltip — Simple hover tooltip component.
 * Created as a lightweight replacement to fix build (no external dep).
 */
import { useState } from 'react';

export function Tooltip({ content, children }) {
    const [show, setShow] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && content && (
                <span style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg-panel)',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--color-soft-border)',
                    pointerEvents: 'none',
                    zIndex: 100,
                    marginBottom: '4px',
                    boxShadow: '0 4px 12px var(--color-shadow-deep)'
                }}>
                    {content}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
